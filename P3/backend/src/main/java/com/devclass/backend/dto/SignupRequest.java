package com.devclass.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 200)
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 6, max = 100, message = "비밀번호는 6자 이상 100자 이하입니다.")
    private String password;

    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "역할은 필수입니다.")
    @Pattern(regexp = "^(student|instructor)$", message = "역할은 student 또는 instructor여야 합니다.")
    private String role;
}
