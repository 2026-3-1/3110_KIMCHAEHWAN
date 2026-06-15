package com.devclass.backend.repository;

import com.devclass.backend.domain.LectureProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    Optional<LectureProgress> findByStudentIdAndLectureId(Long studentId, Long lectureId);
    List<LectureProgress> findByStudentIdAndLectureIdIn(Long studentId, List<Long> lectureIds);
    void deleteByStudentIdAndLectureIdIn(Long studentId, List<Long> lectureIds);
}
