import client from './client';

export const checkRefund = (studentId, courseId) =>
  client.get(`/refund/check?studentId=${studentId}&courseId=${courseId}`);

export const requestRefund = (studentId, courseId) =>
  client.post('/refund', { studentId, courseId });
