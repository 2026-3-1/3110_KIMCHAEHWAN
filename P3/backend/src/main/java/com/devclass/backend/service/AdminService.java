package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.AdminLoginRequest;
import com.devclass.backend.dto.AuthResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${app.admin.code}")
    private String adminCode;

    @Transactional
    public String initAdminAccount(String requestCode) {
        if (!adminCode.equals(requestCode)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        String encodedPw = passwordEncoder.encode("admin1234");
        return userRepository.findByEmail("admin@devclass.com")
                .map(existing -> {
                    userRepository.updatePassword(existing.getId(), encodedPw);
                    log.info("[Admin] Admin password reset");
                    return "관리자 비밀번호 초기화 완료: admin@devclass.com / admin1234";
                })
                .orElseGet(() -> {
                    User admin = User.builder()
                            .email("admin@devclass.com")
                            .password(encodedPw)
                            .name("관리자")
                            .role("admin")
                            .build();
                    userRepository.save(admin);
                    log.info("[Admin] Admin account created");
                    return "관리자 계정 생성 완료: admin@devclass.com / admin1234";
                });
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AdminLoginRequest request) {
        if (!adminCode.equals(request.getAdminCode())) {
            log.warn("[Admin] Invalid admin code attempt for email={}", request.getEmail());
            throw new BusinessException(ErrorCode.INVALID_ADMIN_CODE);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!"admin".equals(user.getRole())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        log.info("[Admin] Login: email={}", request.getEmail());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        return AuthResponse.from(user, token);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard() {
        long totalUsers = userRepository.count();
        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long students = userRepository.countByRole("student");
        long instructors = userRepository.countByRole("instructor");

        return Map.of(
            "totalUsers", totalUsers,
            "students", students,
            "instructors", instructors,
            "totalCourses", totalCourses,
            "totalEnrollments", totalEnrollments
        );
    }

    @Transactional(readOnly = true)
    public List<User> getUsers(int page, int size) {
        Page<User> users = userRepository.findAll(
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return users.getContent();
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        if ("admin".equals(user.getRole())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        userRepository.delete(user);
        log.info("[Admin] Deleted user id={}", userId);
    }
}
