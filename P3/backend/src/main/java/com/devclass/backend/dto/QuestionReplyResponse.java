package com.devclass.backend.dto;

import com.devclass.backend.domain.QuestionReply;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class QuestionReplyResponse {
    private Long id;
    private Long questionId;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String content;
    private LocalDateTime createdAt;

    public static QuestionReplyResponse of(QuestionReply reply, String authorName, String authorRole) {
        return QuestionReplyResponse.builder()
                .id(reply.getId())
                .questionId(reply.getQuestionId())
                .authorId(reply.getAuthorId())
                .authorName(authorName)
                .authorRole(authorRole)
                .content(reply.getContent())
                .createdAt(reply.getCreatedAt())
                .build();
    }
}
