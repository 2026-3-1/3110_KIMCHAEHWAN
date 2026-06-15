package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.service.RefundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/refund")
@RequiredArgsConstructor
@Tag(name = "Refund", description = "환불 API")
public class RefundController {

    private final RefundService refundService;

    @GetMapping("/check")
    @Operation(summary = "환불 가능 여부 확인")
    public ResponseEntity<ApiResponse<Map<String, Object>>> check(
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        return ResponseEntity.ok(ApiResponse.success(refundService.checkRefundEligibility(studentId, courseId)));
    }

    @PostMapping
    @Operation(summary = "환불 요청 (진행률 < 임계값일 때만 가능)")
    public ResponseEntity<ApiResponse<Void>> refund(@RequestBody Map<String, Long> body) {
        Long studentId = body.get("studentId");
        Long courseId = body.get("courseId");
        refundService.requestRefund(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
