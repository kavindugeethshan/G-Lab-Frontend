import api from './api';

export const productService = {
  // Get products with optional filter params
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  // Get single product by id
  async getProductById(id) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  // Get product rating summary
  async getProductRating(id) {
    const res = await api.get(`/products/${id}/rating`);
    return res.data;
  },

  // Get product reviews
  async getProductReviews(productId) {
    const res = await api.get(`/products/${productId}/reviews`);
    return res.data;
  },

  // Create review
  async addReview(productId, reviewData) {
    const res = await api.post(`/products/${productId}/reviews`, reviewData);
    return res.data;
  },

  // Update review
  async updateReview(reviewId, reviewData) {
    const res = await api.put(`/reviews/${reviewId}`, reviewData);
    return res.data;
  },

  // Delete review
  async deleteReview(reviewId) {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },
};
