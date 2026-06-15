package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.LectureCreateRequest;
import com.devclass.backend.dto.LectureResponse;
import com.devclass.backend.dto.LectureUpdateRequest;
import com.devclass.backend.service.LectureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/courses/{courseId}/lectures")
@RequiredArgsConstructor
@Tag(name = "Lecture", description = "강의 영상 관리 API")
public class LectureController {

    private final LectureService lectureService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "강의 영상 추가")
    public ResponseEntity<ApiResponse<LectureResponse>> add(
            @PathVariable Long courseId,
            @RequestPart("data") LectureCreateRequest request,
            @RequestParam Long instructorId,
            @RequestPart(value = "video", required = false) MultipartFile videoFile
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(lectureService.add(courseId, request, videoFile, instructorId)));
    }

    @PutMapping("/{lectureId}")
    @Operation(summary = "강의 제목 수정")
    public ResponseEntity<ApiResponse<LectureResponse>> update(
            @PathVariable Long courseId,
            @PathVariable Long lectureId,
            @RequestBody LectureUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(lectureService.update(courseId, lectureId, request)));
    }

    @PatchMapping(value = "/{lectureId}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "강의 영상 교체")
    public ResponseEntity<ApiResponse<LectureResponse>> replaceVideo(
            @PathVariable Long courseId,
            @PathVariable Long lectureId,
            @RequestParam Long instructorId,
            @RequestPart("video") MultipartFile videoFile
    ) {
        return ResponseEntity.ok(ApiResponse.success(lectureService.replaceVideo(courseId, lectureId, videoFile, instructorId)));
    }

    @DeleteMapping("/{lectureId}")
    @Operation(summary = "강의 영상 삭제")
    public ResponseEntity<Void> delete(
            @PathVariable Long courseId,
            @PathVariable Long lectureId,
            @RequestParam Long instructorId
    ) {
        lectureService.delete(courseId, lectureId, instructorId);
        return ResponseEntity.noContent().build();
    }
}
