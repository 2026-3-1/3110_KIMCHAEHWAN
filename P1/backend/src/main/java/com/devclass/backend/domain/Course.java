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
    private String level;

    @Column(nullable = false)
    private int price;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

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

    public void update(String title, String summary, String description, String category, String level, Integer price, String thumbnailUrl) {
        if (title != null) this.title = title;
        if (summary != null) this.summary = summary;
        if (description != null) this.description = description;
        if (category != null) this.category = category;
        if (level != null) this.level = level;
        if (price != null) this.price = price;
        if (thumbnailUrl != null) this.thumbnailUrl = thumbnailUrl;
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
