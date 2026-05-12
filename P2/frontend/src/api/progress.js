import client from './client';

export const updateLectureProgress = (lectureId, data) =>
  client.put(`/progress/lectures/${lectureId}`, data);

export const getCourseProgress = (courseId, studentId) =>
  client.get(`/progress/courses/${courseId}`, { params: { studentId } });
