package com.devclass.backend.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class PaymentInitRequest {
    @NotNull
    private Long courseId;
    @NotNull
    private Long studentId;
}
