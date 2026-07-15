import api from './client';

export const listAgents = () => api.get('/agents');
export const createAgent = (data) => api.post('/agents', data);
export const updateAgent = (id, data) => api.patch(`/agents/${id}`, data);
