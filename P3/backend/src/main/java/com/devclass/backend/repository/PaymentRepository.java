package com.devclass.backend.repository;

import com.devclass.backend.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(String orderId);
    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, Payment.PaymentStatus status);
    Optional<Payment> findByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, Payment.PaymentStatus status);
}
