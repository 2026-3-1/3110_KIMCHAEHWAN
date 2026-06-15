package com.devclass.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class QuestionReplyRequest {
    @NotNull
    private Long authorId;
    @NotBlank
    private String content;
}
