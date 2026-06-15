import client from './client';

export const addLecture = (courseId, data, videoFile, instructorId) => {
  const formData = new FormData();
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  if (videoFile) formData.append('video', videoFile);
  return client.post(`/courses/${courseId}/lectures`, formData, {
    headers: { 'Content-Type': undefined },
    params: { instructorId },
  });
};

export const updateLectureTitle = (courseId, lectureId, data) =>
  client.put(`/courses/${courseId}/lectures/${lectureId}`, data);

export const deleteLecture = (courseId, lectureId, instructorId) =>
  client.delete(`/courses/${courseId}/lectures/${lectureId}`, { params: { instructorId } });

export const replaceVideo = (courseId, lectureId, videoFile, instructorId) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  return client.patch(`/courses/${courseId}/lectures/${lectureId}/video`, formData, {
    headers: { 'Content-Type': undefined },
    params: { instructorId },
  });
};
