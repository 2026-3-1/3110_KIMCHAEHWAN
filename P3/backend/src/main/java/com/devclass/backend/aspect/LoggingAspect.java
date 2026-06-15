package com.devclass.backend.aspect;

import com.devclass.backend.security.AuthPrincipal;
import com.devclass.backend.service.OperationLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LoggingAspect {

    private final OperationLogService operationLogService;

    @Around("execution(* com.devclass.backend.service.EnrollmentService.create(..))")
    public Object logEnrollment(ProceedingJoinPoint pjp) throws Throwable {
        return logOperation(pjp, "ENROLL");
    }

    @Around("execution(* com.devclass.backend.service.CourseService.create(..))")
    public Object logCourseCreate(ProceedingJoinPoint pjp) throws Throwable {
        return logOperation(pjp, "CREATE_COURSE");
    }

    @Around("execution(* com.devclass.backend.service.CourseService.delete(..))")
    public Object logCourseDelete(ProceedingJoinPoint pjp) throws Throwable {
        return logOperation(pjp, "DELETE_COURSE");
    }

    @Around("execution(* com.devclass.backend.service.AuthService.login(..))")
    public Object logLogin(ProceedingJoinPoint pjp) throws Throwable {
        return logOperation(pjp, "LOGIN");
    }

    private Object logOperation(ProceedingJoinPoint pjp, String action) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            long duration = System.currentTimeMillis() - start;
            Long userId = getCurrentUserId();
            String ip = getCurrentIp();
            operationLogService.log(action, userId, null, pjp.getSignature().getName(), ip, duration);
            return result;
        } catch (Throwable t) {
            log.warn("[{}] operation failed: {}", action, t.getMessage());
            throw t;
        }
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal principal) {
            return principal.getId();
        }
        return null;
    }

    private String getCurrentIp() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                return xForwardedFor != null ? xForwardedFor.split(",")[0].trim()
                        : request.getRemoteAddr();
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }
}
