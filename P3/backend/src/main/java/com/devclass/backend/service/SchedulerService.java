package com.devclass.backend.service;

import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.service.notification.DiscordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;

    @Value("${app.discord.admin-webhook-url:}")
    private String adminWebhookUrl;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendDailyReport() {
        long courses = courseRepository.count();
        long enrollments = enrollmentRepository.count();
        long users = userRepository.count();
        String msg = String.format("📊 **DevClass 일일 리포트**\n강의 수: %d | 수강 신청: %d | 회원 수: %d",
                courses, enrollments, users);
        discordService.sendRaw(adminWebhookUrl, msg);
        log.info("[Scheduler] Daily report: courses={}, enrollments={}, users={}", courses, enrollments, users);
    }
}
