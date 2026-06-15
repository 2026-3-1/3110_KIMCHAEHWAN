package com.devclass.backend.repository;

import com.devclass.backend.domain.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long> {

    Page<Course> findByCategory(String category, Pageable pageable);

    Page<Course> findByLevel(String level, Pageable pageable);

    Page<Course> findByCategoryAndLevel(String category, String level, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE " +
           "(:keyword IS NULL OR c.title LIKE %:keyword% OR c.description LIKE %:keyword% OR c.instructorName LIKE %:keyword%) AND " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:level IS NULL OR c.level = :level) AND " +
           "(:instructorId IS NULL OR c.instructorId = :instructorId)")
    Page<Course> search(@Param("keyword") String keyword,
                        @Param("category") String category,
                        @Param("level") String level,
                        @Param("instructorId") Long instructorId,
                        Pageable pageable);
}
