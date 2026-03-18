package com.devclass.backend.course.dto;

import lombok.Getter;

@Getter
public class CourseCreateRequest {

    private Long instructorId;
    private String instructorName;
    private String title;
    private String description;
    private String category;
    private String level;
    private int price;
    private String thumbnailUrl;
}
