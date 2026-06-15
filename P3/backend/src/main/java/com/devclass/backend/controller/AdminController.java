package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.AdminLoginRequest;
import com.devclass.backend.dto.AuthResponse;
import com.devclass.backend.service.AdminService;
import com.devclass.backend.service.RefundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API (별도 인증 필요)")
public class AdminController {

    private final AdminService adminService;
    private final RefundService refundService;

    @PostMapping("/init")
    @Operation(summary = "관리자 계정 최초 생성 (관리자 코드 필요, 없을 때만 동작)")
    public ResponseEntity<ApiResponse<String>> init(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(adminService.initAdminAccount(body.get("adminCode"))));
    }

    @PostMapping("/login")
    @Operation(summary = "관리자 로그인 (이메일 + 비밀번호 + 관리자 코드)")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.login(request)));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "대시보드 통계")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    @GetMapping("/users")
    @Operation(summary = "전체 회원 목록")
    public ResponseEntity<ApiResponse<List<User>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(page, size)));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "회원 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/refund-policy")
    @Operation(summary = "환불 기준 진행률 조회")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRefundPolicy() {
        int threshold = refundService.getRefundThreshold();
        return ResponseEntity.ok(ApiResponse.success(Map.of("threshold", threshold)));
    }

    @PutMapping("/refund-policy")
    @Operation(summary = "환불 기준 진행률 변경 (0~100)")
    public ResponseEntity<ApiResponse<Void>> updateRefundPolicy(@RequestBody Map<String, Integer> body) {
        refundService.setRefundThreshold(body.get("threshold"));
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
