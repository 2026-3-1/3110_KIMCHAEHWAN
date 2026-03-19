package com.devclass.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "강의를 찾을 수 없습니다.", "COURSE_NOT_FOUND"),
    ENROLLMENT_DUPLICATED(HttpStatus.CONFLICT, "이미 수강 신청한 강의입니다.", "ENROLLMENT_DUPLICATED"),
    ENROLLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "수강 내역을 찾을 수 없습니다.", "ENROLLMENT_NOT_FOUND"),
    REVIEW_DUPLICATED(HttpStatus.CONFLICT, "이미 리뷰를 작성하셨습니다.", "REVIEW_DUPLICATED"),
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
