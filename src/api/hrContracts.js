import api from './client';

export const sendContract = (formData) =>
  api.post('/rrhh/contratos/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const listContracts = (params) => api.get('/rrhh/contratos', { params });
export const getContract = (id) => api.get(`/rrhh/contratos/${id}`);
export const deleteContract = (id) => api.delete(`/rrhh/contratos/${id}`);

export const getHrSigningPage = (token) => api.get(`/rrhh-sign/${token}`);
export const recordHrView = (token) => api.post(`/rrhh-sign/${token}/view`);
export const submitHrSignature = (token, data) => api.post(`/rrhh-sign/${token}/sign`, data);

// Downloads a file via axios (sends JWT) and triggers browser download
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

export const downloadSignedContract = (id, name) => downloadFile(`/rrhh/contratos/${id}/download`, `FIRMADO-${name}`);
