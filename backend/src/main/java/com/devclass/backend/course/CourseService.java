package com.devclass.backend.course;

import com.devclass.backend.course.dto.CourseCreateRequest;
import com.devclass.backend.course.dto.CourseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                .description(request.getDescription())
                .category(request.getCategory())
                .level(request.getLevel())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getList(String category, String level, String sort, int page, int size) {
        Sort sortOrder = switch (sort) {
            case "popular" -> Sort.by(Sort.Direction.DESC, "enrollmentCount");
            case "rating"  -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sortOrder);

        Page<Course> courses;
        if (category != null && level != null) {
            courses = courseRepository.findByCategoryAndLevel(category, level, pageable);
        } else if (category != null) {
            courses = courseRepository.findByCategory(category, pageable);
        } else if (level != null) {
            courses = courseRepository.findByLevel(level, pageable);
        } else {
            courses = courseRepository.findAll(pageable);
        }

        return courses.map(CourseResponse::from);
    }

    @Transactional(readOnly = true)
    public CourseResponse getOne(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "강의를 찾을 수 없습니다."));
        return CourseResponse.from(course);
    }
}
