import { apiClient } from './apiClient';

export async function listInvoices() {
  const res = await apiClient.get('/billing');
  return res.data;
}

export async function createInvoice(payload) {
  const res = await apiClient.post('/billing', payload);
  return res.data;
}
