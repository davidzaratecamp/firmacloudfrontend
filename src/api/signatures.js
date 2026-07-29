import api from './client';
export const getDashboard = () => api.get('/signatures/dashboard');
export const sendDocument = (data) => api.post('/signatures/send', data);
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

// Opens a file in a new tab for inline viewing (blob URL, sends JWT)
export async function previewFile(url) {
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const href = URL.createObjectURL(blob);
  window.open(href, '_blank');
  // Da tiempo a que la pestaña nueva cargue el blob antes de liberar memoria
  setTimeout(() => URL.revokeObjectURL(href), 60000);
}

export const previewSigned      = (id) => previewFile(`/signatures/${id}/download`);
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
