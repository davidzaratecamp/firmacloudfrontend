import api from './client';

// Público — sin token, cualquiera puede enviarlo (solo una vez por email, ver backend)
export const submitPublicDataUpdate = (formData) =>
  api.post('/actualizacion-datos/submit', formData);

// Panel interno
export const listPublicDataUpdates = (params) => api.get('/actualizacion-datos', { params });
export const getPublicDataUpdatesDashboard = () => api.get('/actualizacion-datos/dashboard');

export async function getPublicDataUpdatePhotoUrl(id, type) {
  const res = await api.get(`/actualizacion-datos/${id}/photo/${type}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}
