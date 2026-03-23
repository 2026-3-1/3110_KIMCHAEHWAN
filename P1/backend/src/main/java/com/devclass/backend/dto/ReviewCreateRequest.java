package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class ReviewCreateRequest {

    private Long studentId;
    private int rating;
    private String content;
}
