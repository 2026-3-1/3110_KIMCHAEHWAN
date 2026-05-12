package com.devclass.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StudentProgressResponse {
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime enrolledAt;
    private double progressPercent;
    private boolean canWriteReview;
    private int totalLectures;
}
