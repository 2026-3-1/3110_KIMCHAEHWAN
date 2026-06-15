package com.devclass.backend.repository;

import com.devclass.backend.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}
