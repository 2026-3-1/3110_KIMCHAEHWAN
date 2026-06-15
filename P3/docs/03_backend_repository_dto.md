# 백엔드 — Repository & DTO

---

## Repository (repository/)

패키지: `com.devclass.backend.repository`

### UserRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### CourseRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByCategory(String category, Pageable pageable);
    Page<Course> findByLevel(String level, Pageable pageable);
    Page<Course> findByCategoryAndLevel(String category, String level, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE " +
           "(:keyword IS NULL OR c.title LIKE %:keyword% OR c.description LIKE %:keyword% OR c.instructorName LIKE %:keyword%) AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:level IS NULL OR c.level = :level)")
    Page<Course> search(@Param("keyword") String keyword,
                        @Param("category") String category,
                        @Param("level") String level,
                        Pageable pageable);
}
```

### LectureRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByCourseIdOrderByOrderIndex(Long courseId);
}
```

### EnrollmentRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
}
```

> `findByCourseId`는 Spring Data JPA가 `course.id` 관계 탐색으로 자동 처리.

### LectureProgressRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.LectureProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    Optional<LectureProgress> findByStudentIdAndLectureId(Long studentId, Long lectureId);
    List<LectureProgress> findByStudentIdAndLectureIdIn(Long studentId, List<Long> lectureIds);
}
```

### ReviewRepository.java

```java
package com.devclass.backend.repository;

import com.devclass.backend.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Review> findByCourseId(Long courseId);
    Optional<Review> findByIdAndCourseId(Long id, Long courseId);
}
```

---

## DTO (dto/)

패키지: `com.devclass.backend.dto`

### 인증 DTO

**SignupRequest.java**
```java
@Getter
public class SignupRequest {
    private String email;
    private String password;
    private String name;
    private String role;  // "student" 또는 "instructor"
}
```

**LoginRequest.java**
```java
@Getter
public class LoginRequest {
    private String email;
    private String password;
}
```

**AuthResponse.java**
```java
@Getter
@Builder
public class AuthResponse {
    private Long id;
    private String email;
    private String name;
    private String role;

    public static AuthResponse from(User user) {
        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
```

---

### 강의 DTO

**CourseCreateRequest.java**
```java
@Getter
public class CourseCreateRequest {
    private Long instructorId;
    private String instructorName;
    private String title;
    private String summary;
    private String description;
    private String category;
    private String level;
    private int price;
    private String thumbnailUrl;
    private List<LectureCreateRequest> lectures;
}
```

**CourseUpdateRequest.java**
```java
@Getter
public class CourseUpdateRequest {
    private Long instructorId;
    private String title;
    private String summary;
    private String description;
    private String category;
    private String level;
    private Integer price;
    private String thumbnailUrl;
    private String videoUrl;
}
```

**CourseResponse.java**
```java
@Getter
@Builder
public class CourseResponse {
    private Long id;
    private Long instructorId;
    private String instructorName;
    private String title;
    private String summary;
    private String description;
    private String category;
    private String level;
    private int price;
    private String thumbnailUrl;
    private float averageRating;
    private int enrollmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LectureResponse> lectures;

    public static CourseResponse from(Course course) {
        return from(course, List.of());
    }

    public static CourseResponse from(Course course, List<LectureResponse> lectures) {
        return CourseResponse.builder()
                .id(course.getId())
                .instructorId(course.getInstructorId())
                .instructorName(course.getInstructorName())
                .title(course.getTitle())
                .summary(course.getSummary())
                .description(course.getDescription())
                .category(course.getCategory())
                .level(course.getLevel())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .averageRating(course.getAverageRating())
                .enrollmentCount(course.getEnrollmentCount())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .lectures(lectures)
                .build();
    }
}
```

**CourseListResponse.java**
```java
@Getter
@Builder
public class CourseListResponse {
    private List<CourseResponse> courses;
    private long totalCount;
    private int page;
    private int size;
}
```

---

### 강의(Lecture) DTO

**LectureCreateRequest.java**
```java
@Getter
public class LectureCreateRequest {
    private String title;
    private int orderIndex;
}
```

**LectureResponse.java**
```java
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
```

---

### 수강 신청 DTO

**EnrollmentCreateRequest.java**
```java
@Getter
public class EnrollmentCreateRequest {
    private Long studentId;
    private Long courseId;
}
```

**EnrollmentResponse.java**
```java
@Getter
@Builder
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private Long courseId;
    private String courseTitle;
    private LocalDateTime enrolledAt;

    public static EnrollmentResponse from(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentId(enrollment.getStudentId())
                .courseId(enrollment.getCourse().getId())
                .courseTitle(enrollment.getCourse().getTitle())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
    }
}
```

---

### 진도율 DTO

**LectureProgressRequest.java**
```java
@Getter
public class LectureProgressRequest {
    private Long studentId;
    private int watchedSeconds;
    private int durationSeconds;
}
```

**CourseProgressResponse.java**
```java
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
```

---

### 리뷰 DTO

**ReviewCreateRequest.java**
```java
@Getter
public class ReviewCreateRequest {
    private Long studentId;
    private int rating;
    private String content;
}
```

**ReviewUpdateRequest.java**
```java
@Getter
@NoArgsConstructor
public class ReviewUpdateRequest {
    private Long studentId;
    private int rating;
    private String content;
}
```

**ReviewResponse.java**
```java
@Getter
@Builder
public class ReviewResponse {
    private Long id;
    private Long studentId;
    private int rating;
    private String content;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .studentId(review.getStudentId())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
```

---

### 수강생 진도 DTO (강사 전용)

**StudentProgressResponse.java**
```java
@Getter
@Builder
public class StudentProgressResponse {
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime enrolledAt;
    private double progressPercent;
    private boolean canWriteReview;
    private int totalLectures;
}
```
