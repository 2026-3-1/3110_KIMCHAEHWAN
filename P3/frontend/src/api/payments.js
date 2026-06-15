import client from './client';

export const initPayment = (data) => client.post('/payments/init', data);
export const confirmPayment = (data) => client.post('/payments/confirm', data);
