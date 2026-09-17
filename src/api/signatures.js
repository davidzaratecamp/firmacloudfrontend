import api from './client';
export const getDashboard = () => api.get('/signatures/dashboard');
export const sendDocument = (data) => api.post('/signatures/send', data);
// Módulo Vital — Firma Tratamiento de Datos (reemplazo de "Contrato de Activación").
// Mismo endpoint que la intranet usa vía X-Api-Key; desde el panel se llama con el JWT del agente.
export const sendVitalDocument = (data) => api.post('/signatures/send-with-data', data);
export const listSignatures = (params) => api.get('/signatures', { params });
export const getSignature = (id) => api.get(`/signatures/${id}`);
export const getSigningPage = (token) => api.get(`/sign/${token}`);
export const recordView = (token) => api.post(`/sign/${token}/view`);
export const submitSignature = (token, data) => api.post(`/sign/${token}/sign`, data);

// Downloads a file via axios (sends JWT) and triggers browser download
export async function downloadFile(url, filename) {
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

export const downloadSigned      = (id, name) => downloadFile(`/signatures/${id}/download`, `FIRMADO-${name}`);
export const downloadCertificate = (id)        => downloadFile(`/signatures/${id}/certificate`, `sumarium-${id}.pdf`);
export const deleteSignature     = (id)        => api.delete(`/signatures/${id}`);

// Devuelve un object URL (para mostrar en un <iframe> dentro de un Modal, en vez de abrir
// una pestaña nueva) — mismo patrón que getCartaPreviewUrl en api/cartas.js.
export async function getSignedPreviewUrl(id) {
  const res = await api.get(`/signatures/${id}/download`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

// Opens a file in a new tab for inline viewing (blob URL, sends JWT)
export async function previewFile(url) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const href = URL.createObjectURL(blob);
  window.open(href, '_blank');
  // Da tiempo a que la pestaña nueva cargue el blob antes de liberar memoria
  setTimeout(() => URL.revokeObjectURL(href), 60000);
}

export const previewCertificate = (id) => previewFile(`/signatures/${id}/certificate`);

export const replaceSignedDocument = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.put(`/signatures/${id}/replace-signed`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const replaceCertificate = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.put(`/signatures/${id}/replace-certificate`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};
