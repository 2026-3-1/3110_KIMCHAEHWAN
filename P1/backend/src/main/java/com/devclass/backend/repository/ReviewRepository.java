package com.devclass.backend.repository;

import com.devclass.backend.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    List<Review> findByCourseId(Long courseId);
}
