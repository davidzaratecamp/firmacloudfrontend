import api from './client';

export const createOleada = (formData) =>
  api.post('/oleadas', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const listOleadas = (params) => api.get('/oleadas', { params });
export const getDailyUsage = () => api.get('/oleadas/daily-usage');
export const getOleada = (id) => api.get(`/oleadas/${id}`);
export const listOleadaRecipients = (id, params) => api.get(`/oleadas/${id}/recipients`, { params });
export const sendOleadaNow = (id) => api.post(`/oleadas/${id}/send-now`);
export const retryFailedRecipients = (id) => api.patch(`/oleadas/${id}/retry-failed`);
export const deleteFailedRecipients = (id) => api.delete(`/oleadas/${id}/failed`);
export const pauseOleada = (id) => api.patch(`/oleadas/${id}/pause`);
export const resumeOleada = (id) => api.patch(`/oleadas/${id}/resume`);
export const cancelOleada = (id) => api.patch(`/oleadas/${id}/cancel`);
