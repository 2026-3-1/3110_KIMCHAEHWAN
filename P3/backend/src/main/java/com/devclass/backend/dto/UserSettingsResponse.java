package com.devclass.backend.dto;

import com.devclass.backend.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSettingsResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String discordWebhookUrl;
    private boolean discordNotiEnabled;

    public static UserSettingsResponse from(User user) {
        return UserSettingsResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .discordWebhookUrl(user.getDiscordWebhookUrl())
                .discordNotiEnabled(user.isDiscordNotiEnabled())
                .build();
    }
}
