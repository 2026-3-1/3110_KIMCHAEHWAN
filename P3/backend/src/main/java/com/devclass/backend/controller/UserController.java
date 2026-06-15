package com.devclass.backend.controller;

import com.devclass.backend.common.ApiResponse;
import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.DiscordSettingsRequest;
import com.devclass.backend.dto.UserSettingsResponse;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "User Settings", description = "내 설정 API")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "내 설정 조회")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getSettings(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        return ResponseEntity.ok(ApiResponse.success(UserSettingsResponse.from(user)));
    }

    @PutMapping("/discord")
    @Operation(summary = "Discord 알림 설정 저장")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateDiscord(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody DiscordSettingsRequest request
    ) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        user.updateDiscordSettings(request.getWebhookUrl(), request.isEnabled());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(UserSettingsResponse.from(user)));
    }
}
