package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Enrollment;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.EnrollmentCreateRequest;
import com.devclass.backend.dto.EnrollmentResponse;
import com.devclass.backend.domain.Lecture;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.LectureProgressRepository;
import com.devclass.backend.repository.LectureRepository;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.service.notification.DiscordService;
import com.devclass.backend.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    private final LectureProgressRepository lectureProgressRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final DiscordService discordService;

    @Transactional
    public EnrollmentResponse create(EnrollmentCreateRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())) {
            throw new BusinessException(ErrorCode.ENROLLMENT_DUPLICATED);
        }

        Enrollment enrollment = Enrollment.builder()
                .studentId(request.getStudentId())
                .course(course)
                .build();

        course.incrementEnrollmentCount();
        enrollmentRepository.save(enrollment);

        String studentDisplayName = userRepository.findById(request.getStudentId())
                .map(student -> {
                    emailService.sendEnrollmentConfirmation(student.getEmail(), student.getName(), course.getTitle());
                    return student.getName();
                })
                .orElse("수강생 #" + request.getStudentId());

        // 강사에게 Discord 알림
        userRepository.findById(course.getInstructorId()).ifPresent(instructor ->
                discordService.notifyInstructorEnrollment(instructor, studentDisplayName, course.getTitle())
        );

        return EnrollmentResponse.from(enrollment);
    }

    @Transactional
    public void delete(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));

        Long studentId = enrollment.getStudentId();
        Long courseId = enrollment.getCourse().getId();

        List<Long> lectureIds = lectureRepository.findByCourseIdOrderByOrderIndex(courseId)
                .stream().map(Lecture::getId).toList();
        if (!lectureIds.isEmpty()) {
            lectureProgressRepository.deleteByStudentIdAndLectureIdIn(studentId, lectureIds);
        }

        enrollment.getCourse().decrementEnrollmentCount();
        enrollmentRepository.delete(enrollment);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getByStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(EnrollmentResponse::from)
                .toList();
    }
}
