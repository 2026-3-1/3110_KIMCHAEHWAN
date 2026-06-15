package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "lecture_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "lecture_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LectureProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "lecture_id", nullable = false)
    private Long lectureId;

    @Column(name = "watched_seconds", nullable = false)
    private int watchedSeconds;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(int watchedSeconds, int durationSeconds) {
        // 실제 시청 시간은 영상 길이를 초과할 수 없음
        int capped = durationSeconds > 0 ? Math.min(watchedSeconds, durationSeconds) : watchedSeconds;
        this.watchedSeconds = Math.max(this.watchedSeconds, capped);
        if (durationSeconds > 0) {
            this.durationSeconds = durationSeconds;
        }
    }
}
