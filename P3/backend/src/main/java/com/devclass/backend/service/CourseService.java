package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Enrollment;
import com.devclass.backend.domain.Lecture;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.*;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.EnrollmentRepository;
import com.devclass.backend.repository.LectureRepository;
import com.devclass.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;
    private final VideoStorageService videoStorageService;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final LectureProgressService lectureProgressService;

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseResponse create(CourseCreateRequest request, Map<String, MultipartFile> videoFiles) {
        Course course = Course.builder()
                .instructorId(request.getInstructorId())
                .instructorName(request.getInstructorName())
                .title(request.getTitle())
                .summary(request.getSummary())
                .description(request.getDescription())
                .category(request.getCategory())
                .level(request.getLevel())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        courseRepository.save(course);

        List<LectureResponse> lectureResponses = new ArrayList<>();
        if (request.getLectures() != null) {
            for (LectureCreateRequest lectureReq : request.getLectures()) {
                String videoUrl = null;
                MultipartFile videoFile = videoFiles.get("video_" + lectureReq.getOrderIndex());
                if (videoFile != null && !videoFile.isEmpty()) {
                    videoUrl = videoStorageService.store(videoFile);
                }
                Lecture lecture = Lecture.builder()
                        .courseId(course.getId())
                        .title(lectureReq.getTitle())
                        .orderIndex(lectureReq.getOrderIndex())
                        .videoUrl(videoUrl)
                        .build();
                lectureResponses.add(LectureResponse.from(lectureRepository.save(lecture)));
            }
        }

        CourseResponse response = CourseResponse.from(course, lectureResponses);
        return response;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "courses", key = "#keyword + '_' + #category + '_' + #level + '_' + #instructorId + '_' + #sort + '_' + #page + '_' + #size")
    public CourseListResponse getList(String keyword, String category, String level, Long instructorId, String sort, int page, int size) {
        Sort sortOrder = switch (sort) {
            case "popular"    -> Sort.by(Sort.Direction.DESC, "enrollmentCount");
            case "rating"     -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default           -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sortOrder);
        Page<Course> courses = courseRepository.search(keyword, category, level, instructorId, pageable);

        return CourseListResponse.builder()
                .courses(courses.map(CourseResponse::from).getContent())
                .totalCount(courses.getTotalElements())
                .page(page)
                .size(size)
                .build();
    }

    @Transactional(readOnly = true)
    public CourseResponse getOne(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        List<Lecture> lectures = lectureRepository.findByCourseIdOrderByOrderIndex(id);
        List<LectureResponse> lectureResponses = lectures.stream().map(LectureResponse::from).toList();
        return CourseResponse.from(course, lectureResponses);
    }

    @Transactional
    public CourseResponse update(Long courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(request.getInstructorId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        course.update(request.getTitle(), request.getSummary(), request.getDescription(),
                request.getCategory(), request.getLevel(), request.getPrice(), request.getThumbnailUrl(), null);

        List<Lecture> lectures = lectureRepository.findByCourseIdOrderByOrderIndex(courseId);
        return CourseResponse.from(course, lectures.stream().map(LectureResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public List<StudentProgressResponse> getStudents(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        if (enrollments.isEmpty()) {
            return List.of();
        }

        List<Long> studentIds = enrollments.stream().map(Enrollment::getStudentId).toList();
        Map<Long, User> userMap = userRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        int totalLectures = lectureRepository.findByCourseIdOrderByOrderIndex(courseId).size();

        return enrollments.stream()
                .map(enrollment -> {
                    User student = userMap.get(enrollment.getStudentId());
                    CourseProgressResponse progress =
                            lectureProgressService.getCourseProgress(courseId, enrollment.getStudentId());
                    return StudentProgressResponse.builder()
                            .studentId(enrollment.getStudentId())
                            .studentName(student != null ? student.getName() : "알 수 없음")
                            .studentEmail(student != null ? student.getEmail() : "")
                            .enrolledAt(enrollment.getEnrolledAt())
                            .progressPercent(progress.getProgressPercent())
                            .canWriteReview(progress.isCanWriteReview())
                            .totalLectures(totalLectures)
                            .build();
                })
                .sorted(Comparator.comparingDouble(StudentProgressResponse::getProgressPercent).reversed())
                .toList();
    }

    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public void delete(Long courseId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (course.getEnrollmentCount() > 0) {
            throw new BusinessException(ErrorCode.COURSE_HAS_ENROLLMENTS);
        }

        lectureRepository.deleteAll(lectureRepository.findByCourseIdOrderByOrderIndex(courseId));
        courseRepository.delete(course);
    }
}
