import client from './client';

export const getCourses = (params) => client.get('/courses', { params });
export const getCourse = (id) => client.get(`/courses/${id}`);

// lectures: [{ title, orderIndex, file }]
export const createCourse = (data, lectures) => {
  const formData = new FormData();
  const { lectures: _omit, ...courseData } = data;
  const lecturesMeta = lectures.map(({ title, orderIndex }) => ({ title, orderIndex }));
  formData.append(
    'data',
    new Blob([JSON.stringify({ ...courseData, lectures: lecturesMeta })], { type: 'application/json' })
  );
  lectures.forEach(({ file, orderIndex }) => {
    if (file) formData.append(`video_${orderIndex}`, file);
  });
  return client.post('/courses', formData, {
    headers: { 'Content-Type': undefined },
  });
};

export const updateCourse = (id, data) => client.put(`/courses/${id}`, data);
export const deleteCourse = (id, instructorId) =>
  client.delete(`/courses/${id}`, { params: { instructorId } });

export const getCourseStudents = (courseId, instructorId) =>
  client.get(`/courses/${courseId}/students`, { params: { instructorId } });
