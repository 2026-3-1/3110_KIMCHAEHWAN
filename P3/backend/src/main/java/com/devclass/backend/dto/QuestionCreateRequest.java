package com.devclass.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class QuestionCreateRequest {
    @NotNull
    private Long courseId;
    @NotNull
    private Long authorId;
    @NotBlank
    private String title;
    @NotBlank
    private String content;
}
