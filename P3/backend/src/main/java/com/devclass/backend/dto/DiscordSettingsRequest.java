package com.devclass.backend.dto;

import lombok.Getter;

@Getter
public class DiscordSettingsRequest {
    private String webhookUrl;
    private boolean enabled;
}
