import api from './client';

// Sin "sendCandidato": el envío lo dispara Hydra directamente contra el backend
// (POST /api/reclutamiento/send, con HYDRA_API_KEY) — el panel de FirmaCloud es de solo lectura.
export const listCandidatos = (params) => api.get('/reclutamiento', { params });
export const getCandidatosDashboard = () => api.get('/reclutamiento/dashboard');
export const getCandidato = (id) => api.get(`/reclutamiento/${id}`);

export const getReclutamientoSigningPage = (token) => api.get(`/reclutamiento-sign/${token}`);
export const recordReclutamientoView = (token) => api.post(`/reclutamiento-sign/${token}/view`);
export const submitReclutamientoSignature = (token, data) => api.post(`/reclutamiento-sign/${token}/sign`, data);

// Descarga un archivo vía axios (manda el JWT) y dispara la descarga en el navegador.
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

export const downloadCandidatoCv = (id, candidateName) =>
  downloadFile(`/reclutamiento/${id}/download/cv`, `FIRMADO-hoja-de-vida-${candidateName}.pdf`);
export const downloadCandidatoTratamiento = (id, candidateName) =>
  downloadFile(`/reclutamiento/${id}/download/tratamiento`, `FIRMADO-tratamiento-de-datos-${candidateName}.pdf`);
