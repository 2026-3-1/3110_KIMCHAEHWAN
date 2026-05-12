package com.devclass.backend.dto;

import com.devclass.backend.domain.Lecture;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LectureResponse {
    private Long id;
    private Long courseId;
    private String title;
    private int orderIndex;
    private String videoUrl;

    public static LectureResponse from(Lecture lecture) {
        return LectureResponse.builder()
                .id(lecture.getId())
                .courseId(lecture.getCourseId())
                .title(lecture.getTitle())
                .orderIndex(lecture.getOrderIndex())
                .videoUrl(lecture.getVideoUrl())
                .build();
    }
}
