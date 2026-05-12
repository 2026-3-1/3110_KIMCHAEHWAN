package com.devclass.backend.dto;

import com.devclass.backend.domain.Course;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CourseResponse {

    private Long id;
    private Long instructorId;
    private String instructorName;
    private String title;
    private String summary;
    private String description;
    private String category;
    private String level;
    private int price;
    private String thumbnailUrl;
    private float averageRating;
    private int enrollmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LectureResponse> lectures;

    public static CourseResponse from(Course course) {
        return from(course, List.of());
    }

    public static CourseResponse from(Course course, List<LectureResponse> lectures) {
        return CourseResponse.builder()
                .id(course.getId())
                .instructorId(course.getInstructorId())
                .instructorName(course.getInstructorName())
                .title(course.getTitle())
                .summary(course.getSummary())
                .description(course.getDescription())
                .category(course.getCategory())
                .level(course.getLevel())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .averageRating(course.getAverageRating())
                .enrollmentCount(course.getEnrollmentCount())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .lectures(lectures)
                .build();
    }
}
