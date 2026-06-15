package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Payment;
import com.devclass.backend.dto.EnrollmentCreateRequest;
import com.devclass.backend.dto.payment.PaymentConfirmRequest;
import com.devclass.backend.dto.payment.PaymentInitRequest;
import com.devclass.backend.dto.payment.PaymentInitResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;

    @Value("${app.toss.secret-key}")
    private String tossSecretKey;

    @Value("${app.toss.client-key}")
    private String tossClientKey;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final RestClient restClient = RestClient.create();

    @Transactional
    public PaymentInitResponse initPayment(PaymentInitRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        // 무료 강의는 결제 없이 바로 수강
        if (course.getPrice() == 0) {
            enrollmentService.create(EnrollmentCreateRequest.of(request.getStudentId(), request.getCourseId()));
            return null;
        }

        String orderId = "ORDER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

        Payment payment = Payment.builder()
                .orderId(orderId)
                .studentId(request.getStudentId())
                .courseId(request.getCourseId())
                .amount(course.getPrice())
                .status(Payment.PaymentStatus.READY)
                .build();
        paymentRepository.save(payment);

        return PaymentInitResponse.builder()
                .orderId(orderId)
                .orderName(course.getTitle())
                .amount(course.getPrice())
                .clientKey(tossClientKey)
                .courseId(course.getId())
                .successUrl(frontendUrl + "/payment/success")
                .failUrl(frontendUrl + "/payment/fail")
                .build();
    }

    @Transactional
    public void confirmPayment(PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        if (payment.getAmount() != request.getAmount()) {
            payment.fail("결제 금액 불일치");
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        // Toss API 호출로 결제 검증
        verifyWithToss(request.getPaymentKey(), request.getOrderId(), request.getAmount());

        payment.confirm(request.getPaymentKey());

        // 수강 신청 처리
        enrollmentService.create(EnrollmentCreateRequest.of(payment.getStudentId(), payment.getCourseId()));

        log.info("[Payment] Confirmed: orderId={}, amount={}", request.getOrderId(), request.getAmount());
    }

    private void verifyWithToss(String paymentKey, String orderId, int amount) {
        try {
            String encoded = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
            restClient.post()
                    .uri("https://api.tosspayments.com/v1/payments/confirm")
                    .header("Authorization", "Basic " + encoded)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("paymentKey", paymentKey, "orderId", orderId, "amount", amount))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("[Payment] Toss verification failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }
}
