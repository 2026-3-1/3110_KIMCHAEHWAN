# 백엔드 설정

## settings.gradle

```groovy
rootProject.name = 'backend'
```

---

## build.gradle

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.3'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.devclass'
version = '0.0.1-SNAPSHOT'
description = 'Demo project for Spring Boot'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.security:spring-security-crypto'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.2'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.mysql:mysql-connector-j'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

---

## src/main/resources/application.yaml

```yaml
spring:
  application:
    name: backend
  datasource:
    url: jdbc:mysql://<HOST>:<PORT>/<DB>?createDatabaseIfNotExist=true&useSSL=true&requireSSL=true&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: <USERNAME>
    password: <PASSWORD>
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
  servlet:
    multipart:
      max-file-size: 500MB
      max-request-size: 500MB

app:
  upload:
    dir: uploads/videos

springdoc:
  swagger-ui:
    path: /swagger-ui.html

server:
  port: 8081
```

---

## BackendApplication.java

패키지: `com.devclass.backend`

```java
package com.devclass.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

> Spring Security 전체를 사용하지 않고 `spring-security-crypto`만 의존성에 추가하여 BCrypt 암호화만 사용. SecurityFilterChain을 등록하지 않으므로 모든 API가 인증 없이 접근 가능 (인증은 프론트엔드 라우트 가드로만 처리).

---

## common — 공통 모듈

### ApiResponse.java

```java
package com.devclass.backend.common;

import lombok.Getter;

@Getter
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;
    private final String code;

    private ApiResponse(boolean success, T data, String message, String code) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static ApiResponse<Void> error(String message, String code) {
        return new ApiResponse<>(false, null, message, code);
    }
}
```

### BusinessException.java

```java
package com.devclass.backend.common;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
```

### ErrorCode.java

```java
package com.devclass.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "강의를 찾을 수 없습니다.", "COURSE_NOT_FOUND"),
    COURSE_HAS_ENROLLMENTS(HttpStatus.CONFLICT, "수강생이 있는 강의는 삭제할 수 없습니다.", "COURSE_HAS_ENROLLMENTS"),
    ENROLLMENT_DUPLICATED(HttpStatus.CONFLICT, "이미 수강 신청한 강의입니다.", "ENROLLMENT_DUPLICATED"),
    ENROLLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "수강 내역을 찾을 수 없습니다.", "ENROLLMENT_NOT_FOUND"),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다.", "REVIEW_NOT_FOUND"),
    REVIEW_DUPLICATED(HttpStatus.CONFLICT, "이미 해당 강의에 리뷰를 작성하셨습니다.", "REVIEW_DUPLICATED"),
    REVIEW_NOT_ENROLLED(HttpStatus.FORBIDDEN, "수강한 강의에만 리뷰를 작성할 수 있습니다.", "REVIEW_NOT_ENROLLED"),
    REVIEW_INSUFFICIENT_PROGRESS(HttpStatus.FORBIDDEN, "전체 강의의 70% 이상 시청해야 리뷰를 작성할 수 있습니다.", "REVIEW_INSUFFICIENT_PROGRESS"),
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.", "EMAIL_DUPLICATED"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.", "INVALID_CREDENTIALS"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.", "FORBIDDEN"),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "유효하지 않은 입력값입니다.", "INVALID_INPUT"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR");

    private final HttpStatus httpStatus;
    private final String message;
    private final String code;

    ErrorCode(HttpStatus httpStatus, String message, String code) {
        this.httpStatus = httpStatus;
        this.message = message;
        this.code = code;
    }
}
```

### GlobalExceptionHandler.java

```java
package com.devclass.backend.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity.status(errorCode.getHttpStatus())
                .body(ApiResponse.error(errorCode.getMessage(), errorCode.getCode()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500)
                .body(ApiResponse.error("서버 내부 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR"));
    }
}
```
