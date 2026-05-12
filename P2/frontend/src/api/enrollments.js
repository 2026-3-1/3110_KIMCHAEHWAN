import client from './client';

export const createEnrollment = (data) => client.post('/enrollments', data);
export const deleteEnrollment = (enrollmentId) =>
  client.delete(`/enrollments/${enrollmentId}`);
export const getEnrollmentsByStudent = (studentId) =>
  client.get(`/enrollments/student/${studentId}`);
