import api from './client';

export const sendCarta   = (data)   => api.post('/cartas/send', data);
export const listCartas  = (params) => api.get('/cartas', { params });
export const getCarta    = (id)     => api.get(`/cartas/${id}`);
export const deleteCarta = (id)     => api.delete(`/cartas/${id}`);

export async function downloadCarta(id, filename) {
  const res = await api.get(`/cartas/${id}/download`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || `FIRMADO-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// Igual que downloadCarta pero devuelve el object URL para previsualizar (ej. en un <iframe>) sin forzar descarga
export async function getCartaPreviewUrl(id) {
  const res = await api.get(`/cartas/${id}/download`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

// type: 'social' | 'status' — devuelve un object URL para previsualizar la foto del formulario
export async function getCartaPhotoUrl(id, type) {
  const res = await api.get(`/cartas/${id}/photo/${type}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}

const PHOTO_EXT_BY_MIME = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' };

export async function downloadCartaPhoto(id, type) {
  const res = await api.get(`/cartas/${id}/photo/${type}`, { responseType: 'blob' });
  const ext = PHOTO_EXT_BY_MIME[res.data.type] || 'jpg';
  const label = type === 'social' ? 'seguro-social' : 'estatus-migratorio';
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${label}-${id}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export async function exportCartas(params) {
  const res = await api.get('/cartas/export', { params, responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `cartas-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export const getFormulario    = (token)       => api.get(`/formulario/${token}`);
export const submitFormulario = (token, data) => api.post(`/formulario/${token}/submit`, data);
