import api from './client';

export const sendCarta  = (data)   => api.post('/cartas/send', data);
export const listCartas = (params) => api.get('/cartas', { params });
export const getCarta   = (id)     => api.get(`/cartas/${id}`);

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

export const getFormulario    = (token)       => api.get(`/formulario/${token}`);
export const submitFormulario = (token, data) => api.post(`/formulario/${token}/submit`, data);
