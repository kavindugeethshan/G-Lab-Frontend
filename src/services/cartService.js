import api from './api';

export const cartService = {
  // Get cart for authenticated user
  async getCart() {
    const res = await api.get('/cart');
    return res.data;
  },

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    const res = await api.post('/cart/add', { productId, quantity });
    return res.data;
  },

  // Update item quantity
  async updateQuantity(productId, quantity) {
    const res = await api.put(`/cart/update/${productId}`, { quantity });
    return res.data;
  },

  // Remove item from cart
  async removeFromCart(productId) {
    const res = await api.delete(`/cart/remove/${productId}`);
    return res.data;
  },

  // Clear entire cart
  async clearCart() {
    const res = await api.delete('/cart/clear');
    return res.data;
  },
};
