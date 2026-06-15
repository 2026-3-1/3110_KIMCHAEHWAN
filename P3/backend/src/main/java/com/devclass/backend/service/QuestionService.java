package com.devclass.backend.service;

import com.devclass.backend.common.BusinessException;
import com.devclass.backend.common.ErrorCode;
import com.devclass.backend.domain.Course;
import com.devclass.backend.domain.Question;
import com.devclass.backend.domain.QuestionReply;
import com.devclass.backend.domain.User;
import com.devclass.backend.dto.QuestionCreateRequest;
import com.devclass.backend.dto.QuestionReplyRequest;
import com.devclass.backend.dto.QuestionReplyResponse;
import com.devclass.backend.dto.QuestionResponse;
import com.devclass.backend.repository.CourseRepository;
import com.devclass.backend.repository.QuestionRepository;
import com.devclass.backend.repository.QuestionReplyRepository;
import com.devclass.backend.repository.UserRepository;
import com.devclass.backend.service.notification.DiscordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionReplyRepository replyRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final DiscordService discordService;

    @Transactional
    public QuestionResponse createQuestion(QuestionCreateRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        Question question = Question.builder()
                .courseId(request.getCourseId())
                .authorId(request.getAuthorId())
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        questionRepository.save(question);

        // 강사에게 Discord 알림
        userRepository.findById(course.getInstructorId()).ifPresent(instructor ->
                discordService.notifyInstructorQuestion(instructor, author.getName(), course.getTitle(), question.getTitle())
        );

        return QuestionResponse.of(question, author.getName());
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long courseId) {
        List<Question> questions = questionRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        if (questions.isEmpty()) return List.of();

        List<Long> authorIds = questions.stream().map(Question::getAuthorId).distinct().toList();
        Map<Long, User> userMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return questions.stream()
                .map(q -> QuestionResponse.of(q, nameOf(userMap, q.getAuthorId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        List<QuestionReply> replies = replyRepository.findByQuestionIdOrderByCreatedAtAsc(questionId);

        List<Long> allAuthorIds = new java.util.ArrayList<>();
        allAuthorIds.add(question.getAuthorId());
        replies.forEach(r -> allAuthorIds.add(r.getAuthorId()));

        Map<Long, User> userMap = userRepository.findAllById(allAuthorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<QuestionReplyResponse> replyResponses = replies.stream()
                .map(r -> {
                    User u = userMap.get(r.getAuthorId());
                    return QuestionReplyResponse.of(r, u != null ? u.getName() : "알 수 없음", u != null ? u.getRole() : "");
                })
                .toList();

        return QuestionResponse.of(question, nameOf(userMap, question.getAuthorId()), replyResponses);
    }

    @Transactional
    public QuestionReplyResponse createReply(Long questionId, QuestionReplyRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        QuestionReply reply = QuestionReply.builder()
                .questionId(questionId)
                .authorId(request.getAuthorId())
                .content(request.getContent())
                .build();
        replyRepository.save(reply);

        // 답변자가 강사인 경우 질문 작성자(학생)에게 Discord 알림
        if ("instructor".equals(author.getRole())) {
            Course course = courseRepository.findById(question.getCourseId()).orElse(null);
            userRepository.findById(question.getAuthorId()).ifPresent(student ->
                    discordService.notifyStudentAnswered(student,
                            course != null ? course.getTitle() : "",
                            question.getTitle())
            );
        }

        return QuestionReplyResponse.of(reply, author.getName(), author.getRole());
    }

    private String nameOf(Map<Long, User> map, Long id) {
        User u = map.get(id);
        return u != null ? u.getName() : "알 수 없음";
    }
}
