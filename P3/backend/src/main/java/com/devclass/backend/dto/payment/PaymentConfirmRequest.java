package com.devclass.backend.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

@Getter
public class PaymentConfirmRequest {
    @NotBlank
    private String paymentKey;
    @NotBlank
    private String orderId;
    @Positive
    private int amount;
}
