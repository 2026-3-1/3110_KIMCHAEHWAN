import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { CATEGORIES } from '../data/mockData';
import { getCourses } from '../api/courses';

export default function MainPage() {
  const navigate = useNavigate();
  const [newestCourses, setNewestCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);

  useEffect(() => {
    getCourses({ sort: 'newest', size: 4 })
      .then((res) => setNewestCourses(res.data.data.courses))
      .catch(() => {});
    getCourses({ sort: 'popular', size: 4 })
      .then((res) => setPopularCourses(res.data.data.courses))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* 히어로 배너 */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-3">IT 강의 플랫폼</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            누구나 쉽게 시작하는<br />
            <span className="text-indigo-200">DevClass</span>
          </h1>
          <p className="text-indigo-100 text-lg mb-10 max-w-lg">
            알고리즘부터 웹개발, AI/데이터, DevOps까지 — 취업과 성장을 위한 IT 강의를 한 곳에서.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/courses"
              className="bg-white text-indigo-700 font-semibold px-7 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow"
            >
              강의 둘러보기
            </Link>
            <Link
              to="/courses/new"
              className="border-2 border-white/50 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              강의 등록하기
            </Link>
          </div>
          <div className="flex gap-8 mt-12 text-indigo-100 text-sm">
            <div><span className="text-2xl font-bold text-white">8+</span><br />강의</div>
            <div><span className="text-2xl font-bold text-white">13K+</span><br />수강생</div>
            <div><span className="text-2xl font-bold text-white">4.7</span><br />평균 별점</div>
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">카테고리별 강의</h2>
        <p className="text-gray-500 text-sm mb-7">원하는 분야를 선택해 바로 탐색하세요</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => navigate(`/courses?category=${encodeURIComponent(cat.value)}`)}
              className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 신규 강의 */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">신규 강의</h2>
              <p className="text-gray-500 text-sm mt-1">새롭게 등록된 강의를 만나보세요</p>
            </div>
            <Link to="/courses?sort=newest" className="text-sm text-indigo-600 font-medium hover:underline">
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {newestCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* 인기 강의 */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">인기 강의</h2>
              <p className="text-gray-500 text-sm mt-1">수강생이 가장 많이 선택한 강의</p>
            </div>
            <Link to="/courses?sort=popular" className="text-sm text-indigo-600 font-medium hover:underline">
              전체보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {popularCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA 배너 */}
      <section className="bg-indigo-600 py-14 px-4 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">강사로 시작하고 싶으신가요?</h2>
        <p className="text-indigo-200 mb-7 text-sm">지금 바로 강의를 등록하고 수강생들과 지식을 나눠보세요.</p>
        <Link
          to="/courses/new"
          className="inline-block bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          강의 등록하기
        </Link>
      </section>
    </div>
  );
}
