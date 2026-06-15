package com.devclass.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "강의를 찾을 수 없습니다.", "COURSE_NOT_FOUND"),
    LECTURE_NOT_FOUND(HttpStatus.NOT_FOUND, "강의 영상을 찾을 수 없습니다.", "LECTURE_NOT_FOUND"),
    COURSE_HAS_ENROLLMENTS(HttpStatus.CONFLICT, "수강생이 있는 강의는 삭제할 수 없습니다.", "COURSE_HAS_ENROLLMENTS"),
    ENROLLMENT_DUPLICATED(HttpStatus.CONFLICT, "이미 수강 신청한 강의입니다.", "ENROLLMENT_DUPLICATED"),
    ENROLLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "수강 내역을 찾을 수 없습니다.", "ENROLLMENT_NOT_FOUND"),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "리뷰를 찾을 수 없습니다.", "REVIEW_NOT_FOUND"),
    REVIEW_DUPLICATED(HttpStatus.CONFLICT, "이미 해당 강의에 리뷰를 작성하셨습니다.", "REVIEW_DUPLICATED"),
    REVIEW_NOT_ENROLLED(HttpStatus.FORBIDDEN, "수강한 강의에만 리뷰를 작성할 수 있습니다.", "REVIEW_NOT_ENROLLED"),
    REVIEW_INSUFFICIENT_PROGRESS(HttpStatus.FORBIDDEN, "전체 강의의 70% 이상 시청해야 리뷰를 작성할 수 있습니다.", "REVIEW_INSUFFICIENT_PROGRESS"),
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.", "EMAIL_DUPLICATED"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.", "INVALID_CREDENTIALS"),
    INVALID_ADMIN_CODE(HttpStatus.UNAUTHORIZED, "관리자 코드가 올바르지 않습니다.", "INVALID_ADMIN_CODE"),
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
