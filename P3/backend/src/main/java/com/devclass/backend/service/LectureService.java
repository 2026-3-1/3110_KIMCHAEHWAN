package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Lecture;
import com.devclass.backend.dto.LectureCreateRequest;
import com.devclass.backend.dto.LectureResponse;
import com.devclass.backend.dto.LectureUpdateRequest;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.LectureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LectureService {

    private final LectureRepository lectureRepository;
    private final CourseRepository courseRepository;
    private final VideoStorageService videoStorageService;

    @Transactional
    public LectureResponse add(Long courseId, LectureCreateRequest request, MultipartFile videoFile, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        String videoUrl = null;
        if (videoFile != null && !videoFile.isEmpty()) {
            videoUrl = videoStorageService.store(videoFile);
        }

        int orderIndex = lectureRepository.findByCourseIdOrderByOrderIndex(courseId).size();
        Lecture lecture = Lecture.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .orderIndex(orderIndex)
                .videoUrl(videoUrl)
                .build();

        return LectureResponse.from(lectureRepository.save(lecture));
    }

    @Transactional
    public LectureResponse update(Long courseId, Long lectureId, LectureUpdateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (!course.getInstructorId().equals(request.getInstructorId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LECTURE_NOT_FOUND));
        lecture.updateTitle(request.getTitle());

        return LectureResponse.from(lecture);
    }

    @Transactional
    public LectureResponse replaceVideo(Long courseId, Long lectureId, MultipartFile videoFile, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LECTURE_NOT_FOUND));

        String videoUrl = videoStorageService.store(videoFile);
        lecture.updateVideoUrl(videoUrl);

        return LectureResponse.from(lecture);
    }

    @Transactional
    public void delete(Long courseId, Long lectureId, Long instructorId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (!course.getInstructorId().equals(instructorId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        lectureRepository.findById(lectureId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LECTURE_NOT_FOUND));
        lectureRepository.deleteById(lectureId);

        List<Lecture> remaining = lectureRepository.findByCourseIdOrderByOrderIndex(courseId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).updateOrderIndex(i);
        }
    }
}
