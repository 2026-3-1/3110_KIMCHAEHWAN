import client from './client';

export const getReviews = (courseId) => client.get(`/courses/${courseId}/reviews`);
export const createReview = (courseId, data) => client.post(`/courses/${courseId}/reviews`, data);
export const updateReview = (courseId, reviewId, data) =>
  client.put(`/courses/${courseId}/reviews/${reviewId}`, data);
export const deleteReview = (courseId, reviewId, studentId) =>
  client.delete(`/courses/${courseId}/reviews/${reviewId}`, { params: { studentId } });
