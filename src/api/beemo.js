import api from './client';

export const sendBeemoDocument = (formData) =>
  api.post('/beemo/enviar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const listBeemoDocuments = (params) => api.get('/beemo', { params });
export const getBeemoDocument = (id) => api.get(`/beemo/${id}`);
export const deleteBeemoDocument = (id) => api.delete(`/beemo/${id}`);
export const resendBeemoDocument = (id) => api.post(`/beemo/${id}/reenviar`);
export const getBeemoStats = () => api.get('/beemo/stats');
export const getBeemoTemplateFields = () => api.get('/beemo/plantilla');

export const getBeemoSigningPage = (token) => api.get(`/beemo-sign/${token}`);
export const recordBeemoView = (token) => api.post(`/beemo-sign/${token}/view`);
export const submitBeemoSignature = (token, data) => api.post(`/beemo-sign/${token}/sign`, data);

async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

export const downloadBeemoSigned = (id, name) => downloadFile(`/beemo/${id}/download`, `FIRMADO-${name}`);
