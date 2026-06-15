package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class LectureProgressRequest {
    private Long studentId;
    private int watchedSeconds;
    private int durationSeconds;
}
