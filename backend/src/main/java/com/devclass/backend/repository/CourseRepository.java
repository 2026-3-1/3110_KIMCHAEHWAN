package com.devclass.backend.repository;

import com.devclass.backend.domain.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByCategory(String category, Pageable pageable);

    Page<Course> findByLevel(String level, Pageable pageable);

    Page<Course> findByCategoryAndLevel(String category, String level, Pageable pageable);
}
