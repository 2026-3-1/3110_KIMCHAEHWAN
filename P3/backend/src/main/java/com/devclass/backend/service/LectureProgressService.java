package com.devclass.backend.service;

import com.devclass.backend.domain.Lecture;
import com.devclass.backend.domain.LectureProgress;
import com.devclass.backend.dto.CourseProgressResponse;
import com.devclass.backend.dto.LectureProgressRequest;
import com.devclass.backend.repository.LectureProgressRepository;
import com.devclass.backend.repository.LectureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LectureProgressService {

    private final LectureProgressRepository progressRepository;
    private final LectureRepository lectureRepository;

    private static final double REVIEW_THRESHOLD = 70.0;

    @Transactional
    public void upsert(Long lectureId, LectureProgressRequest request) {
        Optional<LectureProgress> existing =
                progressRepository.findByStudentIdAndLectureId(request.getStudentId(), lectureId);

        if (existing.isPresent()) {
            existing.get().update(request.getWatchedSeconds(), request.getDurationSeconds());
        } else {
            int capped = request.getDurationSeconds() > 0
                    ? Math.min(request.getWatchedSeconds(), request.getDurationSeconds())
                    : request.getWatchedSeconds();
            LectureProgress progress = LectureProgress.builder()
                    .studentId(request.getStudentId())
                    .lectureId(lectureId)
                    .watchedSeconds(capped)
                    .durationSeconds(request.getDurationSeconds())
                    .build();
            progressRepository.save(progress);
        }
    }

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(Long courseId, Long studentId) {
        List<Lecture> lectures = lectureRepository.findByCourseIdOrderByOrderIndex(courseId);

        if (lectures.isEmpty()) {
            return CourseProgressResponse.builder()
                    .totalLectures(0)
                    .totalDurationSeconds(0)
                    .totalWatchedSeconds(0)
                    .progressPercent(0)
                    .canWriteReview(false)
                    .lectures(List.of())
                    .build();
        }

        List<Long> lectureIds = lectures.stream().map(Lecture::getId).toList();
        List<LectureProgress> progressList =
                progressRepository.findByStudentIdAndLectureIdIn(studentId, lectureIds);

        Map<Long, LectureProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(LectureProgress::getLectureId, p -> p));

        int totalDuration = 0;
        int totalWatched = 0;
        List<CourseProgressResponse.LectureProgressDetail> details = new java.util.ArrayList<>();

        for (Lecture lecture : lectures) {
            LectureProgress p = progressMap.get(lecture.getId());
            int watched = p != null ? p.getWatchedSeconds() : 0;
            int duration = p != null ? p.getDurationSeconds() : 0;
            double pct = duration > 0 ? Math.min((double) watched / duration * 100, 100.0) : 0;

            totalDuration += duration;
            totalWatched += watched;

            details.add(CourseProgressResponse.LectureProgressDetail.builder()
                    .lectureId(lecture.getId())
                    .lectureTitle(lecture.getTitle())
                    .orderIndex(lecture.getOrderIndex())
                    .watchedSeconds(watched)
                    .durationSeconds(duration)
                    .progressPercent(pct)
                    .build());
        }

        double overallPct = totalDuration > 0
                ? Math.min((double) totalWatched / totalDuration * 100, 100.0)
                : 0;

        return CourseProgressResponse.builder()
                .totalLectures(lectures.size())
                .totalDurationSeconds(totalDuration)
                .totalWatchedSeconds(totalWatched)
                .progressPercent(Math.round(overallPct * 10.0) / 10.0)
                .canWriteReview(overallPct >= REVIEW_THRESHOLD)
                .lectures(details)
                .build();
    }
}
