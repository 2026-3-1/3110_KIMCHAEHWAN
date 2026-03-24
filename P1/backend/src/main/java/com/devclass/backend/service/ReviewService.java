package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Review;
import com.devclass.backend.dto.ReviewCreateRequest;
import com.devclass.backend.dto.ReviewResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getList(Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        return reviewRepository.findByCourseId(courseId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    @Transactional
    public ReviewResponse create(Long courseId, ReviewCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), courseId)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ENROLLED);
        }

        if (reviewRepository.existsByStudentIdAndCourseId(request.getStudentId(), courseId)) {
            throw new BusinessException(ErrorCode.REVIEW_DUPLICATED);
        }

        Review review = Review.builder()
                .studentId(request.getStudentId())
                .course(course)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        reviewRepository.save(review);

        // 평균 평점 갱신
        List<Review> reviews = reviewRepository.findByCourseId(courseId);
        float avg = (float) reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        course.updateAverageRating(avg);

        return ReviewResponse.from(review);
    }
}
