# 프론트엔드 — 시청 & 내 수강 페이지

---

## CourseWatchPage.jsx

경로: `/courses/:id/watch`

Layout 없이 전체화면으로 렌더링. 좌측 영상 플레이어 + 우측 강의 목록 사이드바.

### 구조

```
┌─ 헤더 (← 강의 정보 | 강의명 | 전체 진행도) ────────────────┐
│                                                              │
│  ┌─ 영상 플레이어 (aspect-video) ──────┐  ┌─ 사이드바 ─┐  │
│  │  <video> controls autoPlay          │  │ 커리큘럼   │  │
│  └─────────────────────────────────────┘  │ 강의 목록  │  │
│  ┌─ 현재 강의 제목 ────────────────────┐  │ (클릭 전환)│  │
│  └─────────────────────────────────────┘  └────────────┘  │
│  ┌─ 탭: 강의 소개 | 리뷰 ─────────────┐                    │
│  └─────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

### 진도율 추적 로직

```jsx
const MAX_COUNTED_SPEED = 2.0;  // 2배속 초과 시 진행도 미반영
const MAX_TIME_DIFF = 2.0;      // 2초 이상 점프는 스킵으로 간주

const videoRef = useRef(null);
const lastTimeRef = useRef(0);
const accumulatedRef = useRef(0);  // 이번 세션 실제 시청 시간

// timeupdate 이벤트 — 실제 재생된 시간만 누적
const handleTimeUpdate = () => {
  const video = videoRef.current;
  if (!video) return;
  const current = video.currentTime;
  const diff = current - lastTimeRef.current;
  if (diff > 0 && diff <= MAX_TIME_DIFF && video.playbackRate <= MAX_COUNTED_SPEED) {
    accumulatedRef.current += diff;
  }
  lastTimeRef.current = current;
};

const handleSeeked = () => {
  if (videoRef.current) lastTimeRef.current = videoRef.current.currentTime;
};
```

### 진행도 저장 시점

```jsx
// 일시정지 / 영상 끝
const handlePause = () => sendProgress(currentLecture);
const handleEnded = () => sendProgress(currentLecture);

// 30초마다 자동 저장
useEffect(() => {
  const interval = setInterval(() => {
    if (currentLecture && accumulatedRef.current > 0) {
      sendProgress(currentLecture);
    }
  }, 30000);
  return () => clearInterval(interval);
}, [currentLecture, sendProgress]);

// 페이지 떠날 때 — fetch keepalive로 저장
useEffect(() => {
  const handleUnload = () => {
    if (currentLecture && accumulatedRef.current > 0) {
      fetch(`/api/progress/lectures/${currentLecture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          watchedSeconds: Math.round(accumulatedRef.current),
          durationSeconds: Math.round(isFinite(duration) ? duration : 0),
        }),
        keepalive: true,
      });
    }
  };
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, [currentLecture, user.id]);
```

### sendProgress 함수

```jsx
const sendProgress = useCallback(async (lecture, extra = 0) => {
  if (!lecture || sendingRef.current) return;
  const totalWatched = accumulatedRef.current + extra;
  if (totalWatched === 0) return;
  sendingRef.current = true;
  const duration = videoRef.current?.duration ?? 0;
  try {
    await updateLectureProgress(lecture.id, {
      studentId: user.id,
      watchedSeconds: Math.round(totalWatched),
      durationSeconds: Math.round(isFinite(duration) ? duration : 0),
    });
    setProgressMap((prev) => ({
      ...prev,
      [lecture.id]: {
        watched: Math.max(prev[lecture.id]?.watched ?? 0, Math.round(totalWatched)),
        duration: Math.round(isFinite(duration) ? duration : 0),
      },
    }));
  } finally {
    sendingRef.current = false;
  }
}, [user.id]);
```

### 강의 전환

```jsx
const switchLecture = useCallback((newIdx) => {
  if (currentLecture) {
    sendProgress(currentLecture);  // 이전 강의 진행도 저장
  }
  accumulatedRef.current = 0;  // 누적 시간 초기화
  lastTimeRef.current = 0;
  setSelectedIdx(newIdx);
}, [currentLecture, sendProgress]);
```

### 전체 진행도 계산 (프론트엔드)

```jsx
const totalDuration = Object.values(progressMap).reduce((s, p) => s + p.duration, 0);
const totalWatched = Object.values(progressMap).reduce((s, p) => s + p.watched, 0);
const overallPct = totalDuration > 0
  ? Math.min(Math.round((totalWatched / totalDuration) * 100), 100)
  : 0;
```

### 수강 미신청 시 접근 제어

```jsx
const enrolled = enrollmentsRes.data.data.some((e) => e.courseId === Number(id));
if (!enrolled) {
  navigate(`/courses/${id}`, { replace: true });  // 강의 상세로 리다이렉트
  return;
}
```

### 사이드바 강의 목록 아이콘

- 100% 완료: 초록 원 + ✓
- 현재 강의: 인디고 원 + 번호
- 미시청: 회색 원 + 번호

### 비디오 태그

```jsx
<video
  ref={videoRef}
  key={currentLecture.id}     // 강의 변경 시 리마운트
  src={currentLecture.videoUrl}
  controls
  autoPlay
  className="w-full h-full"
  onTimeUpdate={handleTimeUpdate}
  onSeeked={handleSeeked}
  onPause={handlePause}
  onEnded={handleEnded}
/>
```

---

## MyCoursesPage.jsx

경로: `/my-courses` (학생만 네비게이션에서 노출)

**데이터 로드 — 수강 목록 + 각 강의 상세:**
```jsx
getEnrollmentsByStudent(user.id).then(async (res) => {
  const list = res.data.data;
  const withCourses = await Promise.all(
    list.map((e) =>
      getCourse(e.courseId)
        .then((cr) => ({ ...e, course: cr.data.data }))
        .catch(() => ({ ...e, course: null }))
    )
  );
  setEnrollments(withCourses);
});
```

**카드 레이아웃:**
```
[썸네일 112x80] [카테고리 배지 | 난이도 | 제목 | 강사 | 평점 | 수강 신청일] [강의 시청 버튼 | 수강 취소 버튼]
```

**수강 취소 확인 모달:**
```jsx
const [cancelConfirm, setCancelConfirm] = useState(null);  // enrollmentId 저장
// 버튼 클릭 → setCancelConfirm(enrollment.id)
// 모달에서 확인 → handleCancel(cancelConfirm) → deleteEnrollment 호출
```

**빈 상태:** 📚 이모지 + "아직 수강 중인 강의가 없습니다." + "강의 둘러보기" 버튼
