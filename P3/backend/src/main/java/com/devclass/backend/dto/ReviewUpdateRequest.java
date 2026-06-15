package com.devclass.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewUpdateRequest {
    private Long studentId;
    private int rating;
    private String content;
}
