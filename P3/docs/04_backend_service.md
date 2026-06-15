# 백엔드 — Service 레이어

패키지: `com.devclass.backend.service`

---

## AuthService.java

```java
package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.AuthResponse;
import com.devclass.backend.dto.LoginRequest;
import com.devclass.backend.dto.SignupRequest;
import com.devclass.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_DUPLICATED);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(request.getRole())
                .build();

        return AuthResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return AuthResponse.from(user);
    }
}
```

---

## VideoStorageService.java

```java
package com.devclass.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class VideoStorageService {

    private final Path uploadDir;

    public VideoStorageService(@Value("${app.upload.dir:uploads/videos}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("업로드 디렉토리 생성 실패", e);
        }
    }

    public String store(MultipartFile file) {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf("."))
                : "";
        String filename = UUID.randomUUID() + ext;

        try {
            Files.copy(file.getInputStream(), uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패", e);
        }

        return "/api/videos/" + filename;
    }

    public Path load(String filename) {
        return uploadDir.resolve(filename).normalize();
    }
}
```

> `store()` 반환값 `/api/videos/{UUID}.mp4`가 `Lecture.videoUrl`에 저장되고, 프론트엔드가 이 URL로 `<video>` 태그를 재생.

---

## CourseService.java

```java
package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Enrollment;
import com.devclass.backend.domain.Lecture;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.*;
import com.devclass.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    private final VideoStorageService videoStorageService;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final LectureProgressService lectureProgressService;

    @Transactional
    public CourseResponse create(CourseCreateRequest request, Map<String, MultipartFile> videoFiles) {
        Course course = Course.builder()
                .instructorId(request.getInstructorId())
                .instructorName(request.getInstructorName())
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .category(request.getCategory())
                .level(request.getLevel())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        courseRepository.save(course);

        List<LectureResponse> lectureResponses = new ArrayList<>();
        if (request.getLectures() != null) {
            for (LectureCreateRequest lectureReq : request.getLectures()) {
                String videoUrl = null;
                MultipartFile videoFile = videoFiles.get("video_" + lectureReq.getOrderIndex());
                if (videoFile != null && !videoFile.isEmpty()) {
                    videoUrl = videoStorageService.store(videoFile);
                }
                Lecture lecture = Lecture.builder()
                        .courseId(course.getId())
                        .title(lectureReq.getTitle())
                        .orderIndex(lectureReq.getOrderIndex())
                        .videoUrl(videoUrl)
                        .build();
                lectureResponses.add(LectureResponse.from(lectureRepository.save(lecture)));
            }
        }

        return CourseResponse.from(course, lectureResponses);
    }

    @Transactional(readOnly = true)
    public CourseListResponse getList(String keyword, String category, String level,
                                      String sort, int page, int size) {
        Sort sortOrder = switch (sort) {
            case "popular"    -> Sort.by(Sort.Direction.DESC, "enrollmentCount");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default           -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Course> courses = courseRepository.search(keyword, category, level, pageable);

        return CourseListResponse.builder()
                .courses(courses.map(CourseResponse::from).getContent())
                .totalCount(courses.getTotalElements())
                .page(page)
                .size(size)
                .build();
    }

    @Transactional(readOnly = true)
    public CourseResponse getOne(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        List<Lecture> lectures = lectureRepository.findByCourseIdOrderByOrderIndex(id);
        return CourseResponse.from(course, lectures.stream().map(LectureResponse::from).toList());
    }

    @Transactional
    public CourseResponse update(Long courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(request.getInstructorId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        course.update(request.getTitle(), request.getSummary(), request.getDescription(),
                request.getCategory(), request.getLevel(), request.getPrice(),
                request.getThumbnailUrl(), null);

        List<Lecture> lectures = lectureRepository.findByCourseIdOrderByOrderIndex(courseId);
        return CourseResponse.from(course, lectures.stream().map(LectureResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public List<StudentProgressResponse> getStudents(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        if (enrollments.isEmpty()) return List.of();

        List<Long> studentIds = enrollments.stream().map(Enrollment::getStudentId).toList();
        Map<Long, User> userMap = userRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        int totalLectures = lectureRepository.findByCourseIdOrderByOrderIndex(courseId).size();

        return enrollments.stream()
                .map(enrollment -> {
                    User student = userMap.get(enrollment.getStudentId());
                    CourseProgressResponse progress =
                            lectureProgressService.getCourseProgress(courseId, enrollment.getStudentId());
                    return StudentProgressResponse.builder()
                            .studentId(enrollment.getStudentId())
                            .studentName(student != null ? student.getName() : "알 수 없음")
                            .studentEmail(student != null ? student.getEmail() : "")
                            .enrolledAt(enrollment.getEnrolledAt())
                            .progressPercent(progress.getProgressPercent())
                            .canWriteReview(progress.isCanWriteReview())
                            .totalLectures(totalLectures)
                            .build();
                })
                .sorted(Comparator.comparingDouble(StudentProgressResponse::getProgressPercent).reversed())
                .toList();
    }

    @Transactional
    public void delete(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (course.getEnrollmentCount() > 0) {
            throw new BusinessException(ErrorCode.COURSE_HAS_ENROLLMENTS);
        }

        lectureRepository.deleteAll(lectureRepository.findByCourseIdOrderByOrderIndex(courseId));
        courseRepository.delete(course);
    }
}
```

---

## EnrollmentService.java

```java
package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Enrollment;
import com.devclass.backend.dto.EnrollmentCreateRequest;
import com.devclass.backend.dto.EnrollmentResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public EnrollmentResponse create(EnrollmentCreateRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())) {
            throw new BusinessException(ErrorCode.ENROLLMENT_DUPLICATED);
        }

        Enrollment enrollment = Enrollment.builder()
                .studentId(request.getStudentId())
                .course(course)
                .build();

        course.incrementEnrollmentCount();

        return EnrollmentResponse.from(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public void delete(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENROLLMENT_NOT_FOUND));

        enrollment.getCourse().decrementEnrollmentCount();
        enrollmentRepository.delete(enrollment);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getByStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(EnrollmentResponse::from)
                .toList();
    }
}
```

---

## LectureProgressService.java

```java
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
import java.util.*;
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
                    .totalLectures(0).totalDurationSeconds(0).totalWatchedSeconds(0)
                    .progressPercent(0).canWriteReview(false).lectures(List.of())
                    .build();
        }

        List<Long> lectureIds = lectures.stream().map(Lecture::getId).toList();
        List<LectureProgress> progressList =
                progressRepository.findByStudentIdAndLectureIdIn(studentId, lectureIds);
        Map<Long, LectureProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(LectureProgress::getLectureId, p -> p));

        int totalDuration = 0, totalWatched = 0;
        List<CourseProgressResponse.LectureProgressDetail> details = new ArrayList<>();

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
```

> 진도율 계산: `(총 시청 초 / 총 영상 길이 초) * 100`. 70% 이상이면 `canWriteReview = true`.

---

## ReviewService.java

```java
package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Review;
import com.devclass.backend.dto.*;
import com.devclass.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LectureProgressService lectureProgressService;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getList(Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return reviewRepository.findByCourseId(courseId).stream()
                .map(ReviewResponse::from).toList();
    }

    @Transactional
    public ReviewResponse create(Long courseId, ReviewCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!enrollmentRepository.existsByStudentIdAndCourseId(request.getStudentId(), courseId)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_ENROLLED);
        }
        if (reviewRepository.existsByStudentIdAndCourseId(request.getStudentId(), courseId)) {
            throw new BusinessException(ErrorCode.REVIEW_DUPLICATED);
        }
        if (!lectureProgressService.getCourseProgress(courseId, request.getStudentId()).isCanWriteReview()) {
            throw new BusinessException(ErrorCode.REVIEW_INSUFFICIENT_PROGRESS);
        }

        Review review = Review.builder()
                .studentId(request.getStudentId())
                .course(course)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        reviewRepository.save(review);

        List<Review> reviews = reviewRepository.findByCourseId(courseId);
        float avg = (float) reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        course.updateAverageRating(avg);

        return ReviewResponse.from(review);
    }

    @Transactional
    public ReviewResponse update(Long courseId, Long reviewId, ReviewUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Review review = reviewRepository.findByIdAndCourseId(reviewId, courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getStudentId().equals(request.getStudentId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        review.update(request.getRating(), request.getContent());

        List<Review> reviews = reviewRepository.findByCourseId(courseId);
        float avg = (float) reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        course.updateAverageRating(avg);

        return ReviewResponse.from(review);
    }

    @Transactional
    public void delete(Long courseId, Long reviewId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Review review = reviewRepository.findByIdAndCourseId(reviewId, courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getStudentId().equals(studentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        reviewRepository.delete(review);

        List<Review> reviews = reviewRepository.findByCourseId(courseId);
        float avg = reviews.isEmpty() ? 0f
                : (float) reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        course.updateAverageRating(avg);
    }
}
```
