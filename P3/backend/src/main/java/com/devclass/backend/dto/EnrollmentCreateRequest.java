package com.devclass.backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EnrollmentCreateRequest {

    private Long studentId;
    private Long courseId;

    public static EnrollmentCreateRequest of(Long studentId, Long courseId) {
        EnrollmentCreateRequest req = new EnrollmentCreateRequest();
        req.studentId = studentId;
        req.courseId = courseId;
        return req;
    }
}
