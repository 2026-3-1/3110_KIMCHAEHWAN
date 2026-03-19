package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.CourseCreateRequest;
import com.devclass.backend.dto.CourseListResponse;
import com.devclass.backend.dto.CourseResponse;
import com.devclass.backend.dto.CourseUpdateRequest;
import com.devclass.backend.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "Course", description = "강의 API")
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @Operation(summary = "강의 등록")
    public ResponseEntity<ApiResponse<CourseResponse>> create(@RequestBody CourseCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(courseService.create(request)));
    }

    @GetMapping
    @Operation(summary = "강의 목록 조회")
    public ResponseEntity<ApiResponse<CourseListResponse>> getList(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getList(category, level, sort, page, size)));
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
