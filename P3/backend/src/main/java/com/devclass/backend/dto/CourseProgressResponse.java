package com.devclass.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseProgressResponse {
    private int totalLectures;
    private int totalDurationSeconds;
    private int totalWatchedSeconds;
    private double progressPercent;
    private boolean canWriteReview;
    private List<LectureProgressDetail> lectures;

    @Getter
    @Builder
    public static class LectureProgressDetail {
        private Long lectureId;
        private String lectureTitle;
        private int orderIndex;
        private int watchedSeconds;
        private int durationSeconds;
        private double progressPercent;
    }
}
