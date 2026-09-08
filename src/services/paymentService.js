import api from './api';

export const paymentService = {
  // Create payment record
  async createPayment(paymentData) {
    const res = await api.post('/payments/create', paymentData);
    return res.data;
  },

  // Get payment details
  async getPayment(paymentId) {
    const res = await api.get(`/payments/${paymentId}`);
    return res.data;
  },
};
