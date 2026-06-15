package com.devclass.backend.repository;

import com.devclass.backend.domain.QuestionReply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionReplyRepository extends JpaRepository<QuestionReply, Long> {
    List<QuestionReply> findByQuestionIdOrderByCreatedAtAsc(Long questionId);
}
