package com.devclass.backend.service;

import com.devclass.backend.domain.OperationLog;
import com.devclass.backend.repository.OperationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationLogService {

    private final OperationLogRepository logRepository;

    @Async
    public void log(String action, Long userId, Long resourceId, String detail, String ipAddress, Long durationMs) {
        try {
            OperationLog entry = OperationLog.builder()
                    .action(action)
                    .userId(userId)
                    .resourceId(resourceId)
                    .detail(detail)
                    .ipAddress(ipAddress)
                    .durationMs(durationMs)
                    .build();
            logRepository.save(entry);
        } catch (Exception e) {
            log.warn("Failed to save operation log: {}", e.getMessage());
        }
    }

    @Async
    public void log(String action, Long userId, String detail) {
        log(action, userId, null, detail, null, null);
    }
}
