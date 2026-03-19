package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class CourseUpdateRequest {

    private Long instructorId;
    private String title;
    private String summary;
    private String description;
    private String category;
    private String level;
    private Integer price;
    private String thumbnailUrl;
}
