package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.dto.CourseCreateRequest;
import com.devclass.backend.dto.CourseListResponse;
import com.devclass.backend.dto.CourseResponse;
import com.devclass.backend.dto.CourseUpdateRequest;
import com.devclass.backend.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    @Transactional
    public CourseResponse create(CourseCreateRequest request) {
        Course course = Course.builder()
                .instructorId(request.getInstructorId())
                .instructorName(request.getInstructorName())
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .category(request.getCategory())
                .level(request.getLevel())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public CourseListResponse getList(String keyword, String category, String level, String sort, int page, int size) {
        Sort sortOrder = switch (sort) {
            case "popular"    -> Sort.by(Sort.Direction.DESC, "enrollmentCount");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default           -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Course> courses = courseRepository.search(keyword, category, level, pageable);

        return CourseListResponse.builder()
                .courses(courses.map(CourseResponse::from).getContent())
                .totalCount(courses.getTotalElements())
                .page(page)
                .size(size)
                .build();
    }

    @Transactional(readOnly = true)
    public CourseResponse getOne(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return CourseResponse.from(course);
    }

    @Transactional
    public CourseResponse update(Long courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(request.getInstructorId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        course.update(request.getTitle(), request.getSummary(), request.getDescription(),
                request.getCategory(), request.getLevel(), request.getPrice(), request.getThumbnailUrl());

        return CourseResponse.from(course);
    }

    @Transactional
    public void delete(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (course.getEnrollmentCount() > 0) {
            throw new BusinessException(ErrorCode.COURSE_HAS_ENROLLMENTS);
        }

        courseRepository.delete(course);
    }
}
