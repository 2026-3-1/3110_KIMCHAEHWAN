package com.devclass.backend.repository;

import com.devclass.backend.domain.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findByCourseIdOrderByOrderIndex(Long courseId);
}
