# 백엔드 — Controller 레이어

패키지: `com.devclass.backend.controller`

---

## AuthController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.AuthResponse;
import com.devclass.backend.dto.LoginRequest;
import com.devclass.backend.dto.SignupRequest;
import com.devclass.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "회원가입")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.signup(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "로그인")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }
}
```

---

## CourseController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.*;
import com.devclass.backend.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Course", description = "강의 API")
public class CourseController {

    private final CourseService courseService;

    // 강의 등록 — multipart/form-data
    // "data" 파트: JSON (CourseCreateRequest)
    // "video_0", "video_1" ... 파트: 강의 동영상 파일
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "강의 등록")
    public ResponseEntity<ApiResponse<CourseResponse>> create(
            @RequestPart("data") CourseCreateRequest request,
            MultipartHttpServletRequest multipartRequest
    ) {
        Map<String, MultipartFile> videoFiles = new HashMap<>();
        multipartRequest.getFileMap().forEach((key, file) -> {
            if (key.startsWith("video_")) {
                videoFiles.put(key, file);
            }
        });
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(courseService.create(request, videoFiles)));
    }

    @GetMapping
    @Operation(summary = "강의 목록 조회")
    public ResponseEntity<ApiResponse<CourseListResponse>> getList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                courseService.getList(keyword, category, level, sort, page, size)));
    }

    @GetMapping("/{courseId}")
    @Operation(summary = "강의 단건 조회")
    public ResponseEntity<ApiResponse<CourseResponse>> getOne(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getOne(courseId)));
    }

    @PutMapping("/{courseId}")
    @Operation(summary = "강의 수정")
    public ResponseEntity<ApiResponse<CourseResponse>> update(
            @PathVariable Long courseId,
            @RequestBody CourseUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(courseService.update(courseId, request)));
    }

    @GetMapping("/{courseId}/students")
    @Operation(summary = "수강생 목록 및 진행도 조회 (강사 전용)")
    public ResponseEntity<ApiResponse<List<StudentProgressResponse>>> getStudents(
            @PathVariable Long courseId,
            @RequestParam Long instructorId
    ) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getStudents(courseId, instructorId)));
    }

    @DeleteMapping("/{courseId}")
    @Operation(summary = "강의 삭제")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @RequestParam Long instructorId
    ) {
        courseService.delete(courseId, instructorId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## EnrollmentController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.EnrollmentCreateRequest;
import com.devclass.backend.dto.EnrollmentResponse;
import com.devclass.backend.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@Tag(name = "Enrollment", description = "수강 신청 API")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @Operation(summary = "수강 신청")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> create(@RequestBody EnrollmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(enrollmentService.create(request)));
    }

    @DeleteMapping("/{enrollmentId}")
    @Operation(summary = "수강 취소")
    public ResponseEntity<Void> delete(@PathVariable Long enrollmentId) {
        enrollmentService.delete(enrollmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "수강생 수강 목록 조회")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getByStudent(studentId)));
    }
}
```

---

## LectureProgressController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.CourseProgressResponse;
import com.devclass.backend.dto.LectureProgressRequest;
import com.devclass.backend.service.LectureProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@Tag(name = "Progress", description = "강의 진행도 API")
public class LectureProgressController {

    private final LectureProgressService progressService;

    @PutMapping("/lectures/{lectureId}")
    @Operation(summary = "강의 영상 시청 진행도 업데이트")
    public ResponseEntity<Void> updateProgress(
            @PathVariable Long lectureId,
            @RequestBody LectureProgressRequest request
    ) {
        progressService.upsert(lectureId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses/{courseId}")
    @Operation(summary = "강의 전체 진행도 조회")
    public ResponseEntity<ApiResponse<CourseProgressResponse>> getCourseProgress(
            @PathVariable Long courseId,
            @RequestParam Long studentId
    ) {
        return ResponseEntity.ok(ApiResponse.success(progressService.getCourseProgress(courseId, studentId)));
    }
}
```

---

## ReviewController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.*;
import com.devclass.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Review", description = "리뷰 API")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "강의 리뷰 목록 조회")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getList(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getList(courseId)));
    }

    @PostMapping
    @Operation(summary = "리뷰 작성")
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @PathVariable Long courseId,
            @RequestBody ReviewCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(reviewService.create(courseId, request)));
    }

    @PutMapping("/{reviewId}")
    @Operation(summary = "리뷰 수정")
    public ResponseEntity<ApiResponse<ReviewResponse>> update(
            @PathVariable Long courseId,
            @PathVariable Long reviewId,
            @RequestBody ReviewUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.update(courseId, reviewId, request)));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "리뷰 삭제")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long reviewId,
            @RequestParam Long studentId
    ) {
        reviewService.delete(courseId, reviewId, studentId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## VideoController.java

```java
package com.devclass.backend.controller;

import com.devclass.backend.service.VideoStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoStorageService videoStorageService;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<ResourceRegion> serve(
            @PathVariable String filename,
            @RequestHeader HttpHeaders headers
    ) throws IOException {
        Path file = videoStorageService.load(filename);
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        long contentLength = resource.contentLength();
        List<HttpRange> ranges = headers.getRange();

        ResourceRegion region;
        HttpStatus status;

        if (ranges.isEmpty()) {
            region = new ResourceRegion(resource, 0, contentLength);
            status = HttpStatus.OK;
        } else {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long length = Math.min(2 * 1024 * 1024L, end - start + 1); // 최대 2MB 청크
            region = new ResourceRegion(resource, start, length);
            status = HttpStatus.PARTIAL_CONTENT;
        }

        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.status(status)
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(region);
    }
}
```

> HTTP Range 요청 지원 — 브라우저가 `Range: bytes=0-` 헤더를 보내면 2MB 단위 청크로 응답 (HTTP 206). Range 없으면 전체 파일 반환 (HTTP 200).
