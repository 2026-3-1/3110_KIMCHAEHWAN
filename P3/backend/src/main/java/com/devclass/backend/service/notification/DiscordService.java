package com.devclass.backend.service.notification;

import com.devclass.backend.domain.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
public class DiscordService {

    private final RestClient restClient = RestClient.create();

    @Async
    public void send(User user, String content) {
        if (user == null || !user.isDiscordNotiEnabled()) return;
        if (!StringUtils.hasText(user.getDiscordWebhookUrl())) return;
        try {
            restClient.post()
                    .uri(user.getDiscordWebhookUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("content", content))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("[Discord] Failed to send notification to user {}: {}", user.getId(), e.getMessage());
        }
    }

    // 강사 알림
    public void notifyInstructorEnrollment(User instructor, String studentName, String courseTitle) {
        send(instructor, "📚 **새 수강신청**\n수강생: **" + studentName + "**\n강의: `" + courseTitle + "`");
    }

    public void notifyInstructorRefund(User instructor, String studentName, String courseTitle) {
        send(instructor, "💸 **환불 처리됨**\n수강생: **" + studentName + "**\n강의: `" + courseTitle + "`");
    }

    public void notifyInstructorQuestion(User instructor, String studentName, String courseTitle, String questionTitle) {
        send(instructor, "❓ **새 질문 등록**\n수강생: **" + studentName + "**\n강의: `" + courseTitle + "`\n질문: " + questionTitle);
    }

    // 학생 알림
    public void notifyStudentRefundDone(User student, String courseTitle) {
        send(student, "✅ **환불 완료**\n강의 `" + courseTitle + "` 환불이 처리되었습니다.");
    }

    public void notifyStudentAnswered(User student, String courseTitle, String questionTitle) {
        send(student, "💬 **질문에 답변이 달렸습니다**\n강의: `" + courseTitle + "`\n질문: " + questionTitle);
    }

    public void notifyStudentNewLecture(User student, String courseTitle, String lectureTitle) {
        send(student, "🎬 **새 강의 영상 추가됨**\n강의: `" + courseTitle + "`\n새 영상: **" + lectureTitle + "**");
    }

    // 일일 리포트 (관리자 웹훅이 따로 없으므로 시스템 레벨 - 별도 처리)
    public void sendRaw(String webhookUrl, String content) {
        if (!StringUtils.hasText(webhookUrl)) return;
        try {
            restClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("content", content))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("[Discord] Failed to send raw notification: {}", e.getMessage());
        }
    }
}
