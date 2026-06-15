package com.devclass.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseListResponse {

    private List<CourseResponse> courses;
    private long totalCount;
    private int page;
    private int size;
}
