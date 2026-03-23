import client from './client';

export const getReviews = (courseId) => client.get(`/courses/${courseId}/reviews`);
export const createReview = (courseId, data) =>
  client.post(`/courses/${courseId}/reviews`, data);
