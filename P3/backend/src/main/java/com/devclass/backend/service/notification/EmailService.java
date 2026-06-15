package com.devclass.backend.service.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendEnrollmentConfirmation(String toEmail, String studentName, String courseTitle) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(toEmail);
            msg.setSubject("[DevClass] 수강 신청 완료: " + courseTitle);
            msg.setText(String.format("""
                    안녕하세요, %s님!

                    '%s' 강의 수강 신청이 완료되었습니다.

                    강의실에서 바로 학습을 시작해보세요!
                    👉 %s/my-courses

                    DevClass를 이용해 주셔서 감사합니다.
                    """, studentName, courseTitle, frontendUrl));
            mailSender.send(msg);
            log.info("Enrollment email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send enrollment email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendWelcome(String toEmail, String name) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromEmail);
            msg.setTo(toEmail);
            msg.setSubject("[DevClass] 가입을 환영합니다!");
            msg.setText(String.format("""
                    안녕하세요, %s님!

                    DevClass에 오신 것을 환영합니다! 🎉

                    다양한 IT 강의로 커리어를 성장시켜보세요.
                    👉 %s/courses

                    DevClass 팀 드림
                    """, name, frontendUrl));
            mailSender.send(msg);
            log.info("Welcome email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }
}
