package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.QuestionCreateRequest;
import com.devclass.backend.dto.QuestionReplyRequest;
import com.devclass.backend.dto.QuestionReplyResponse;
import com.devclass.backend.dto.QuestionResponse;
import com.devclass.backend.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Tag(name = "Q&A", description = "강의 질문 API")
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @Operation(summary = "질문 등록")
    public ResponseEntity<ApiResponse<QuestionResponse>> create(@Valid @RequestBody QuestionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(questionService.createQuestion(request)));
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "강의별 질문 목록")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getList(@PathVariable Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestions(courseId)));
    }

    @GetMapping("/{questionId}")
    @Operation(summary = "질문 단건 조회 (답변 포함)")
    public ResponseEntity<ApiResponse<QuestionResponse>> getOne(@PathVariable Long questionId) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestion(questionId)));
    }

    @PostMapping("/{questionId}/replies")
    @Operation(summary = "답변 등록")
    public ResponseEntity<ApiResponse<QuestionReplyResponse>> reply(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionReplyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(questionService.createReply(questionId, request)));
    }
}
