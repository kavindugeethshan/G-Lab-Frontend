import api from './api';

export const orderService = {
  // Create order (COD or Card)
  async createOrder(orderData) {
    const res = await api.post('/order', orderData);
    return res.data;
  },

  // Get current user's orders
  async getMyOrders() {
    const res = await api.get('/order/my-orders');
    return res.data;
  },

  // Get specific order by id
  async getOrderById(orderId) {
    const res = await api.get(`/order/${orderId}`);
    return res.data;
  },

  // Cancel order (Pending or Confirmed orders)
  async cancelOrder(orderId) {
    try {
      const res = await api.patch(`/order/${orderId}/cancel`);
      return res.data;
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 405)) {
        const res = await api.put(`/order/${orderId}/cancel`);
        return res.data;
      }
      throw err;
    }
  },

  // Update order delivery address
  async updateOrderAddress(orderId, address) {
    try {
      const res = await api.patch(`/order/${orderId}/address`, { address });
      return res.data;
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 405)) {
        const res = await api.put(`/order/${orderId}/address`, { address });
        return res.data;
      }
      throw err;
    }
  },
};
