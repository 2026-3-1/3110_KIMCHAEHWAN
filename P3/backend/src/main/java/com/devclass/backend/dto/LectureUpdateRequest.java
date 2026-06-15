package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class LectureUpdateRequest {
    private String title;
    private Long instructorId;
}
