import client from './client';

export const getQuestions = (courseId) => client.get(`/questions/course/${courseId}`);
export const getQuestion = (questionId) => client.get(`/questions/${questionId}`);
export const createQuestion = (data) => client.post('/questions', data);
export const createReply = (questionId, data) => client.post(`/questions/${questionId}/replies`, data);
