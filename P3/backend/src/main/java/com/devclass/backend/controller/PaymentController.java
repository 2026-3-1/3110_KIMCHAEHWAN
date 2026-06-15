package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.dto.payment.PaymentConfirmRequest;
import com.devclass.backend.dto.payment.PaymentInitRequest;
import com.devclass.backend.dto.payment.PaymentInitResponse;
import com.devclass.backend.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "결제 API (Toss Payments)")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/init")
    @Operation(summary = "결제 초기화 - orderId, amount, clientKey 반환")
    public ResponseEntity<ApiResponse<PaymentInitResponse>> init(@Valid @RequestBody PaymentInitRequest request) {
        PaymentInitResponse response = paymentService.initPayment(request);
        if (response == null) {
            return ResponseEntity.ok(ApiResponse.success(null)); // 무료 강의
        }
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/confirm")
    @Operation(summary = "결제 승인 - Toss API 호출 후 수강 신청 처리")
    public ResponseEntity<ApiResponse<Void>> confirm(@Valid @RequestBody PaymentConfirmRequest request) {
        paymentService.confirmPayment(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
