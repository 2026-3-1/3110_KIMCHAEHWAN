package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.ReviewCreateRequest;
import com.devclass.backend.dto.ReviewResponse;
import com.devclass.backend.dto.ReviewUpdateRequest;
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
