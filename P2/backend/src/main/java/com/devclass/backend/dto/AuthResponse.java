package com.devclass.backend.dto;

import com.devclass.backend.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private Long id;
    private String email;
    private String name;
    private String role;

    public static AuthResponse from(User user) {
        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
