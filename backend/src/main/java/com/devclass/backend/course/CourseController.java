package com.devclass.backend.course;

import com.devclass.backend.course.dto.CourseCreateRequest;
import com.devclass.backend.course.dto.CourseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Course", description = "강의 API")
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @Operation(summary = "강의 등록", description = "새 강의를 등록합니다. P1에서는 instructorId를 바디로 전달합니다.")
    public ResponseEntity<CourseResponse> create(@RequestBody CourseCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request));
    }

    @GetMapping
    @Operation(summary = "강의 목록 조회", description = "카테고리/난이도/정렬 필터와 페이지네이션을 지원합니다.")
    public ResponseEntity<Page<CourseResponse>> getList(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(courseService.getList(category, level, sort, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "강의 단건 조회", description = "강의 ID로 특정 강의를 조회합니다.")
    public ResponseEntity<CourseResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getOne(id));
    }
}
