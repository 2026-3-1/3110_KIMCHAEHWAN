# 프론트엔드 — 강의 관련 페이지

---

## MainPage.jsx

경로: `/`

히어로 배너 + 카테고리 버튼 + 신규/인기 강의 4개씩 + CTA 배너.

**핵심 로직:**
```jsx
useEffect(() => {
  getCourses({ sort: 'newest', size: 4 }).then((res) => setNewestCourses(res.data.data.courses));
  getCourses({ sort: 'popular', size: 4 }).then((res) => setPopularCourses(res.data.data.courses));
}, []);
```

**카테고리 버튼** — 클릭 시 `/courses?category=...`로 이동
```jsx
import { CATEGORIES } from '../data/mockData';
// CATEGORIES = [{ label, value, icon }, ...]
```

**히어로 배너 통계:** 999999+강의, googol+수강생, 5 평균 별점 (하드코딩 예시)

---

## CourseListPage.jsx

경로: `/courses`

**상태:**
```jsx
const [courses, setCourses] = useState([]);
const [totalCount, setTotalCount] = useState(0);
const [loading, setLoading] = useState(false);
const [enrolledIds, setEnrolledIds] = useState(new Set());
```

**URL 파라미터로 필터 관리:**
```jsx
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get('category') ?? '';
const level = searchParams.get('level') ?? '';
const sort = searchParams.get('sort') ?? 'newest';
const keyword = searchParams.get('keyword') ?? '';
const page = parseInt(searchParams.get('page') ?? '0');
```

**수강 중 배지** — 학생만 수강 목록 조회 후 `enrolledIds` Set에 저장:
```jsx
useEffect(() => {
  if (user?.role !== 'student') return;
  getEnrollmentsByStudent(user.id).then((res) => {
    setEnrolledIds(new Set(res.data.data.map((e) => e.courseId)));
  });
}, [user]);
```

**카테고리:** 전체, 알고리즘/자료구조, 웹 개발, 앱 개발, 데이터베이스, AI/데이터, DevOps

**난이도:** 전체, 입문(beginner), 중급(intermediate), 고급(advanced)

**정렬:** 최신순(newest), 인기순(popular), 평점순(rating)

**페이지당 8개, 페이지네이션 버튼**

---

## CourseDetailPage.jsx

경로: `/courses/:id`

**데이터 로드:**
```jsx
Promise.all([getCourse(id), getReviews(id), getEnrollmentsByStudent(user.id)])
  .then(([courseRes, reviewsRes, enrollmentsRes]) => {
    setCourse(courseRes.data.data);
    setReviews(reviewsRes.data.data);
    const alreadyEnrolled = enrollmentsRes.data.data.some((e) => e.courseId === Number(id));
    setEnrolled(alreadyEnrolled);
    if (alreadyEnrolled) {
      getCourseProgress(id, user.id).then((res) => {
        setProgressPct(Math.round(res.data.data.progressPercent));
        setCanWriteReview(res.data.data.canWriteReview);
      });
    }
  });
```

**레이아웃:** 좌측(강의 정보, 커리큘럼, 소개, 리뷰) + 우측(수강 신청 카드, sticky)

**수강 신청 카드 (학생):**
- 미수강: "수강 신청하기" 버튼 (indigo)
- 수강 후: "✓ 수강 신청 완료" (green) + "강의 시청하기 →" 버튼

**강사 전용 카드:**
- "수강생 현황 보기" → `/courses/:id/students`
- "강의 수정" → `/courses/:id/edit`
- "강의 삭제" → 확인 모달 후 삭제

**리뷰 섹션:**
- 평균 평점 + 별점 분포 바 (5개 별점별 비율)
- 내 리뷰: 수정/삭제 버튼 표시
- 리뷰 작성 폼: `enrolled && !myReview && canWriteReview`일 때만 표시
- 70% 미만: 주황색 진행도 바 + 안내 메시지

**별점 컴포넌트:**
```jsx
function StarDisplay({ value, size = 'sm' }) { ... }  // 표시용 (readonly)
function StarInput({ value, onChange }) { ... }       // 입력용 (클릭 가능)
function RatingBar({ star, count, total }) { ... }    // 별점 분포 바
```

---

## CourseFormPage.jsx

경로: `/courses/new` (등록) / `/courses/:id/edit` (수정)

**상태:**
```jsx
const isEdit = Boolean(id);  // useParams()의 id 유무로 판단
const [form, setForm] = useState({
  title: '', summary: '', description: '',
  category: CATEGORIES[0], level: 'beginner', price: '', thumbnailUrl: '',
});
const [lectures, setLectures] = useState([{ title: '', file: null, orderIndex: 0 }]);
```

**강의 추가/삭제:**
```jsx
const addLecture = () => setLectures((prev) => [...prev, { title: '', file: null, orderIndex: prev.length }]);
const removeLecture = (index) => {
  setLectures((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, orderIndex: i })));
};
```

**제출:**
```jsx
const payload = { ...form, price: Number(form.price) || 0, instructorId: user.id, instructorName: user.name };
const request = isEdit
  ? updateCourse(id, payload)      // PUT /api/courses/:id
  : createCourse(payload, lectures); // POST /api/courses (multipart)
```

**LectureItem 서브 컴포넌트:**
- 강의 제목 인풋
- 영상 파일 선택 (드래그 영역 클릭 → `input[type=file]` 트리거)
- 파일 선택 시 파일명 + 크기 표시

**폼 필드:**
1. 강의명 (필수)
2. 한 줄 요약
3. 강의 설명 (textarea, 6행)
4. 카테고리 (select) + 난이도 (버튼 3개)
5. 가격 (0 입력 시 "무료" 표시)
6. 썸네일 URL + 미리보기 이미지
7. 강의 영상 (등록 시만, 수정 시 숨김)

---

## CourseStudentsPage.jsx

경로: `/courses/:id/students` (강사 전용)

**데이터 로드:**
```jsx
Promise.all([getCourse(id), getCourseStudents(id, user.id)])
  .then(([courseRes, studentsRes]) => {
    setCourse(courseRes.data.data);
    setStudents(studentsRes.data.data);  // StudentProgressResponse[]
  });
```

**요약 카드 3개:**
- 총 수강생 수
- 평균 진도율 (%)
- 리뷰 작성 가능 수 (canWriteReview === true)

**수강생 테이블:**
```
[아바타 + 이름/이메일] [진도율 바 + %] [수강 신청일] [상태 배지]
```

**진도율 바 색상:**
- ≥ 70%: `bg-green-500`
- ≥ 30%: `bg-indigo-500`
- < 30%: `bg-gray-300`

**상태 배지:**
- `canWriteReview`: "리뷰 가능" (초록)
- `progressPercent > 0`: "수강 중" (인디고)
- `progressPercent === 0`: "미시청" (회색)

**정렬:** 진도율 내림차순 (백엔드에서 정렬 후 응답)
