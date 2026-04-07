import client from './client';

export const getCourses = (params) => client.get('/courses', { params });
export const getCourse = (id) => client.get(`/courses/${id}`);
export const createCourse = (data, videoFile) => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (videoFile) formData.append('video', videoFile);
  return client.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const updateCourse = (id, data) => client.put(`/courses/${id}`, data);
export const deleteCourse = (id, instructorId) =>
  client.delete(`/courses/${id}`, { params: { instructorId } });
