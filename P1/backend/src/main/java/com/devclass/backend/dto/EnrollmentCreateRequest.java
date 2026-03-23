package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class EnrollmentCreateRequest {

    private Long studentId;
    private Long courseId;
}
