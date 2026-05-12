import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, createCourse, updateCourse } from '../api/courses';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['알고리즘/자료구조', '웹 개발', '앱 개발', '데이터베이스', 'AI/데이터', 'DevOps'];
const LEVELS = [
  { label: '입문', value: 'beginner' },
  { label: '중급', value: 'intermediate' },
  { label: '고급', value: 'advanced' },
];
const EMPTY_FORM = {
  title: '', summary: '', description: '',
  category: CATEGORIES[0], level: 'beginner', price: '', thumbnailUrl: '',
};
const EMPTY_LECTURE = (orderIndex) => ({ title: '', file: null, orderIndex });

function LectureItem({ lecture, index, total, onChange, onRemove }) {
  const fileInputRef = useRef(null);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-600">{index + 1}강</span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            삭제
          </button>
        )}
      </div>

      <input
        value={lecture.title}
        onChange={(e) => onChange({ ...lecture, title: e.target.value })}
        placeholder={`${index + 1}강 제목 입력`}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onChange({ ...lecture, file });
        }}
      />
      <div
        onClick={() => fileInputRef.current.click()}
        className={`w-full border-2 border-dashed rounded-lg px-4 py-5 text-center cursor-pointer transition-colors ${
          lecture.file
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-white'
        }`}
      >
        {lecture.file ? (
          <div>
            <p className="text-sm font-medium text-indigo-700 truncate">{lecture.file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(lecture.file.size / (1024 * 1024)).toFixed(1)} MB · 클릭하여 변경
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">클릭하여 영상 파일 선택</p>
            <p className="text-xs text-gray-400 mt-0.5">mp4, mov, avi 등</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [lectures, setLectures] = useState([EMPTY_LECTURE(0)]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getCourse(id)
      .then((res) => {
        const c = res.data.data;
        setForm({
          title: c.title,
          summary: c.summary || '',
          description: c.description || '',
          category: c.category,
          level: c.level,
          price: String(c.price),
          thumbnailUrl: c.thumbnailUrl || '',
        });
      })
      .catch(() => setError('강의 정보를 불러올 수 없습니다.'));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addLecture = () => {
    setLectures((prev) => [...prev, EMPTY_LECTURE(prev.length)]);
  };

  const removeLecture = (index) => {
    setLectures((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((l, i) => ({ ...l, orderIndex: i }));
    });
  };

  const updateLecture = (index, updated) => {
    setLectures((prev) => prev.map((l, i) => (i === index ? { ...updated, orderIndex: i } : l)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('강의명을 입력해주세요.'); return; }
    if (!isEdit) {
      const hasTitle = lectures.every((l) => l.title.trim());
      if (!hasTitle) { setError('모든 강의의 제목을 입력해주세요.'); return; }
    }
    setError('');
    setSubmitted(true);

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      instructorId: user.id,
      instructorName: user.name,
    };

    const request = isEdit
      ? updateCourse(id, payload)
      : createCourse(payload, lectures);

    request
      .then(() => navigate(isEdit ? `/courses/${id}` : '/courses'))
      .catch(() => {
        setError('저장에 실패했습니다. 다시 시도해주세요.');
        setSubmitted(false);
      });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">{isEdit ? '강의 수정' : '강의 등록'}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? '강의 정보를 수정하세요' : '새 강의를 등록하세요'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">강사: {user?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            강의명 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.title}
            onChange={set('title')}
            placeholder="예: 자바스크립트 완전 정복 — 입문부터 심화까지"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">한 줄 요약</label>
          <input
            value={form.summary}
            onChange={set('summary')}
            placeholder="강의를 한 문장으로 소개해주세요"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">강의 설명</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            placeholder="강의에서 배울 내용, 커리큘럼, 수강 대상을 자세히 설명해주세요"
            rows={6}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">카테고리</label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">난이도</label>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, level: l.value }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.level === l.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">가격 (원)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={set('price')}
              placeholder="0 입력 시 무료 강의"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
            {(form.price === '0' || form.price === '') && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-500 font-medium">무료</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">썸네일 URL</label>
          <input
            value={form.thumbnailUrl}
            onChange={set('thumbnailUrl')}
            placeholder="https://images.example.com/thumbnail.jpg"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />
          {form.thumbnailUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={form.thumbnailUrl}
                alt="썸네일 미리보기"
                className="w-full h-44 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {!isEdit && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                강의 영상 <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-gray-400">{lectures.length}개 강의</span>
            </div>

            <div className="space-y-3">
              {lectures.map((lecture, index) => (
                <LectureItem
                  key={index}
                  lecture={lecture}
                  index={index}
                  total={lectures.length}
                  onChange={(updated) => updateLecture(index, updated)}
                  onRemove={() => removeLecture(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addLecture}
              className="mt-3 w-full border-2 border-dashed border-indigo-300 text-indigo-500 hover:border-indigo-500 hover:text-indigo-700 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              + 강의 추가
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 text-gray-600 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitted}
            className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {submitted ? '저장 중...' : isEdit ? '수정 완료' : '강의 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
