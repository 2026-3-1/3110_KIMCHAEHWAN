import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestions, getQuestion, createQuestion, createReply } from '../api/questions';

function TimeAgo({ date }) {
  const d = new Date(date);
  return <span className="text-xs text-gray-400">{d.toLocaleDateString('ko-KR')}</span>;
}

function QuestionDetail({ questionId, onBack, currentUser }) {
  const [data, setData] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuestion(questionId).then((res) => setData(res.data.data));
  }, [questionId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await createReply(questionId, { authorId: currentUser.id, content: replyContent });
      setData((prev) => ({ ...prev, replies: [...(prev.replies ?? []), res.data.data] }));
      setReplyContent('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← 목록으로
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">{data.title}</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-600">{data.authorName}</span>
          <TimeAgo date={data.createdAt} />
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.content}</p>
      </div>

      <div className="space-y-3 mb-6">
        {(data.replies ?? []).map((reply) => (
          <div key={reply.id} className={`rounded-2xl border p-4 ${reply.authorRole === 'instructor' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-800">{reply.authorName}</span>
              {reply.authorRole === 'instructor' && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">강사</span>
              )}
              <TimeAgo date={reply.createdAt} />
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
          </div>
        ))}
        {(data.replies ?? []).length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">아직 답변이 없습니다.</p>
        )}
      </div>

      <form onSubmit={handleReply} className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">답변 작성</p>
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          rows={3}
          placeholder="답변을 입력하세요..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !replyContent.trim()}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? '등록 중...' : '답변 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CourseQnaPage() {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuestions(courseId)
      .then((res) => setQuestions(res.data.data))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await createQuestion({ courseId: Number(courseId), authorId: user.id, ...form });
      setQuestions((prev) => [res.data.data, ...prev]);
      setForm({ title: '', content: '' });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center"><div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }

  if (selectedId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <QuestionDetail questionId={selectedId} onBack={() => setSelectedId(null)} currentUser={user} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/courses/${courseId}`} className="text-sm text-gray-500 hover:text-gray-800">← 강의로</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Q&A</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          {showForm ? '취소' : '질문하기'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="mb-3">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="질문 제목"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={4}
            placeholder="질문 내용을 자세히 작성해주세요..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !form.title.trim() || !form.content.trim()}
              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? '등록 중...' : '질문 등록'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className="w-full text-left bg-white rounded-2xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">{q.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{q.authorName}</span>
              <TimeAgo date={q.createdAt} />
            </div>
          </button>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">아직 질문이 없습니다. 첫 번째로 질문해보세요!</div>
        )}
      </div>
    </div>
  );
}
