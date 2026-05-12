# 백엔드 — 도메인 엔티티 (domain/)

패키지: `com.devclass.backend.domain`

모든 엔티티는 Lombok `@Getter`, `@Builder`, `@NoArgsConstructor(access = PROTECTED)`, `@AllArgsConstructor` 사용.

---

## User.java

```java
package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(nullable = false, length = 200)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String role;  // "student" 또는 "instructor"

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

---

## Course.java

```java
package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "instructor_id", nullable = false)
    private Long instructorId;

    @Column(name = "instructor_name", nullable = false, length = 100)
    private String instructorName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 20)
    private String level;  // "beginner", "intermediate", "advanced"

    @Column(nullable = false)
    private int price;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Builder.Default
    @Column(name = "average_rating", nullable = false)
    private float averageRating = 0.0f;

    @Builder.Default
    @Column(name = "enrollment_count", nullable = false)
    private int enrollmentCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(String title, String summary, String description,
                       String category, String level, Integer price,
                       String thumbnailUrl, String videoUrl) {
        if (title != null) this.title = title;
        if (summary != null) this.summary = summary;
        if (description != null) this.description = description;
        if (category != null) this.category = category;
        if (level != null) this.level = level;
        if (price != null) this.price = price;
        if (thumbnailUrl != null) this.thumbnailUrl = thumbnailUrl;
        if (videoUrl != null) this.videoUrl = videoUrl;
    }

    public void incrementEnrollmentCount() {
        this.enrollmentCount++;
    }

    public void decrementEnrollmentCount() {
        this.enrollmentCount = Math.max(0, this.enrollmentCount - 1);
    }

    public void updateAverageRating(float newRating) {
        this.averageRating = newRating;
    }
}
```

---

## Lecture.java

```java
package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lecture")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Lecture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

---

## Enrollment.java

```java
package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
    }
}
```

> `course`를 `@ManyToOne`으로 참조해 `course.id`, `course.title` 등을 DTO에서 바로 사용 가능.

---

## LectureProgress.java

```java
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
        // 시청 시간은 영상 길이를 초과할 수 없으며, 이전 값보다 줄어들지 않음
        int capped = durationSeconds > 0 ? Math.min(watchedSeconds, durationSeconds) : watchedSeconds;
        this.watchedSeconds = Math.max(this.watchedSeconds, capped);
        if (durationSeconds > 0) {
            this.durationSeconds = durationSeconds;
        }
    }
}
```

> `(student_id, lecture_id)` 복합 유니크 제약으로 같은 수강생이 같은 강의를 중복 기록하지 못함. upsert 패턴으로 처리.

---

## Review.java

```java
package com.devclass.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void update(int rating, String content) {
        this.rating = rating;
        this.content = content;
    }
}
```
