package com.devclass.backend.dto.payment;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentInitResponse {
    private String orderId;
    private String orderName;
    private int amount;
    private String clientKey;
    private Long courseId;
    private String successUrl;
    private String failUrl;
}
