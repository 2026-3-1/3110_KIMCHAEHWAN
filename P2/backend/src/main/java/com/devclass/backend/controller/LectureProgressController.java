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
