package com.devclass.backend.dto;

import com.devclass.backend.domain.Question;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class QuestionResponse {
    private Long id;
    private Long courseId;
    private Long authorId;
    private String authorName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private List<QuestionReplyResponse> replies;

    public static QuestionResponse of(Question question, String authorName, List<QuestionReplyResponse> replies) {
        return QuestionResponse.builder()
                .id(question.getId())
                .courseId(question.getCourseId())
                .authorId(question.getAuthorId())
                .authorName(authorName)
                .title(question.getTitle())
                .content(question.getContent())
                .createdAt(question.getCreatedAt())
                .replies(replies)
                .build();
    }

    public static QuestionResponse of(Question question, String authorName) {
        return of(question, authorName, List.of());
    }
}
