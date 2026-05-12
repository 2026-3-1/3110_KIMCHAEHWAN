package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class LectureCreateRequest {
    private String title;
    private int orderIndex;
}
