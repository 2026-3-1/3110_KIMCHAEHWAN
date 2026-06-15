package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Enrollment;
import com.devclass.backend.domain.Payment;
import com.devclass.backend.domain.SystemConfig;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.CourseProgressResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.LectureRepository;
import com.devclass.backend.repository.LectureProgressRepository;
import com.devclass.backend.repository.PaymentRepository;
import com.devclass.backend.repository.SystemConfigRepository;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.service.notification.DiscordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {

    private static final String REFUND_THRESHOLD_KEY = "refund_threshold";
    private static final int DEFAULT_THRESHOLD = 30;

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureRepository lectureRepository;
    private final LectureProgressRepository lectureProgressRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final LectureProgressService lectureProgressService;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;

    @Value("${app.toss.secret-key}")
    private String tossSecretKey;

    private final RestClient restClient = RestClient.create();

    public int getRefundThreshold() {
        return systemConfigRepository.findById(REFUND_THRESHOLD_KEY)
                .map(c -> Integer.parseInt(c.getValue()))
                .orElse(DEFAULT_THRESHOLD);
    }

    @Transactional
    public void setRefundThreshold(int threshold) {
        if (threshold < 0 || threshold > 100) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        SystemConfig config = systemConfigRepository.findById(REFUND_THRESHOLD_KEY)
                .orElse(SystemConfig.builder().key(REFUND_THRESHOLD_KEY).value(String.valueOf(DEFAULT_THRESHOLD)).build());
        config.updateValue(String.valueOf(threshold));
        systemConfigRepository.save(config);
        log.info("[Admin] Refund threshold updated to {}%", threshold);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkRefundEligibility(Long studentId, Long courseId) {
        int threshold = getRefundThreshold();

        if (!enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND);
        }

        CourseProgressResponse progress = lectureProgressService.getCourseProgress(courseId, studentId);
        double progressPct = progress.getProgressPercent();
        boolean eligible = progressPct < threshold;

        return Map.of(
            "eligible", eligible,
            "progressPercent", progressPct,
            "threshold", threshold,
            "message", eligible
                ? "환불 가능합니다. (진행률 " + (int) progressPct + "% < 기준 " + threshold + "%)"
                : "환불 불가합니다. (진행률 " + (int) progressPct + "% ≥ 기준 " + threshold + "%)"
        );
    }

    @Transactional
    public void requestRefund(Long studentId, Long courseId) {
        int threshold = getRefundThreshold();

        Enrollment enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));

        CourseProgressResponse progress = lectureProgressService.getCourseProgress(courseId, studentId);
        if (progress.getProgressPercent() >= threshold) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        // 유료 결제가 있으면 Toss 환불
        paymentRepository.findByStudentIdAndCourseIdAndStatus(studentId, courseId, Payment.PaymentStatus.DONE)
                .ifPresent(payment -> {
                    cancelWithToss(payment.getPaymentKey(), payment.getAmount());
                    payment.cancel("고객 환불 요청");
                });

        // 수강 취소 (진행 기록 삭제 포함)
        List<Long> lectureIds = lectureRepository.findByCourseIdOrderByOrderIndex(courseId)
                .stream().map(l -> l.getId()).toList();
        if (!lectureIds.isEmpty()) {
            lectureProgressRepository.deleteByStudentIdAndLectureIdIn(studentId, lectureIds);
        }
        enrollment.getCourse().decrementEnrollmentCount();
        enrollmentRepository.delete(enrollment);

        // 강사·학생 Discord 알림
        Course course = enrollment.getCourse();
        User student = userRepository.findById(studentId).orElse(null);
        if (student != null) {
            discordService.notifyStudentRefundDone(student, course.getTitle());
        }
        userRepository.findById(course.getInstructorId()).ifPresent(instructor ->
                discordService.notifyInstructorRefund(instructor,
                        student != null ? student.getName() : "수강생 #" + studentId,
                        course.getTitle())
        );

        log.info("[Refund] studentId={} courseId={} refunded", studentId, courseId);
    }

    private void cancelWithToss(String paymentKey, int amount) {
        try {
            String encoded = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
            restClient.post()
                    .uri("https://api.tosspayments.com/v1/payments/{key}/cancel", paymentKey)
                    .header("Authorization", "Basic " + encoded)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("cancelReason", "고객 환불 요청", "cancelAmount", amount))
                    .retrieve()
                    .toBodilessEntity();
            log.info("[Refund] Toss cancel success paymentKey={}", paymentKey);
        } catch (Exception e) {
            log.error("[Refund] Toss cancel failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
