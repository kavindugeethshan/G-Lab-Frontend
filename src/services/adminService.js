import api from './api';

export const adminService = {
  // Statistics
  async getStatistics() {
    const res = await api.get('/admin/statistics');
    return res.data;
  },

  // Orders
  async getOrders(status) {
    const url = status && status !== 'All'
      ? `/admin/orders/filter?status=${encodeURIComponent(status)}`
      : '/admin/orders';
    const res = await api.get(url);
    return res.data;
  },

  async updateOrderStatus(orderId, status) {
    const res = await api.patch(`/admin/orders/${orderId}/status`, { status });
    return res.data;
  },

  async getOrderDetails(orderId) {
    const res = await api.get(`/admin/orders/${orderId}`);
    return res.data;
  },

  async searchOrders(query) {
    const param = query.includes('@') ? `email=${encodeURIComponent(query)}` : `orderId=${encodeURIComponent(query)}`;
    const res = await api.get(`/admin/orders/search?${param}`);
    return res.data;
  },

  // Products
  async getAllProducts() {
    const res = await api.get('/products?limit=1000');
    return res.data;
  },

  async createProduct(productData) {
    const res = await api.post('/admin/products/create', productData);
    return res.data;
  },

  async updateProduct(id, productData) {
    const res = await api.put(`/admin/products/update/${id}`, productData);
    return res.data;
  },

  async deleteProduct(id) {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Users
  async getUsers() {
    const res = await api.get('/admin/users');
    return res.data;
  },

  async getUserDetails(userId) {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
  },

  async blockUser(userId) {
    const res = await api.patch(`/admin/users/${userId}/block`);
    return res.data;
  },

  async unblockUser(userId) {
    const res = await api.patch(`/admin/users/${userId}/unblock`);
    return res.data;
  },

  async deleteUser(userId) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },

  // Reviews
  async getReviews() {
    const res = await api.get('/admin/reviews');
    return res.data;
  },

  async deleteReview(reviewId) {
    const res = await api.delete(`/admin/reviews/${reviewId}`);
    return res.data;
  },

  // Admin creation
  async createAdmin(adminData) {
    const res = await api.post('/admin/create-admin', adminData);
    return res.data;
  },
};
