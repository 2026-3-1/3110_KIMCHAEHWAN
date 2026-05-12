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
