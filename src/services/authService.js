import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    const res = await api.post('/users/login', { email, password });
    return res.data;
  },

  // Register (sends OTP)
  async register(userData) {
    const res = await api.post('/users/create', userData);
    return res.data;
  },

  // Verify email with OTP
  async verifyEmail(email, otp) {
    const res = await api.post('/users/verify-email', { email, otp });
    return res.data;
  },

  // Resend OTP
  async resendOtp(email) {
    const res = await api.post('/users/resend-otp', { email });
    return res.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const res = await api.post('/users/forgot-password', { email });
    return res.data;
  },

  // Verify reset OTP
  async verifyResetOtp(email, otp) {
    const res = await api.post('/users/verify-reset-otp', { email, otp });
    return res.data;
  },

  // Reset password
  async resetPassword(email, otp, newPassword) {
    const res = await api.post('/users/reset-password', { email, otp, newPassword });
    return res.data;
  },

  // Get current user profile
  async getProfile() {
    const res = await api.get('/users/profile');
    return res.data;
  },

  // Update profile details (firstName, lastName, phone, Image)
  async updateProfile(data) {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  // Update default shipping address
  async updateAddress(address) {
    const res = await api.put('/users/address', { address });
    return res.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const res = await api.put('/users/change-password', { currentPassword, newPassword });
    return res.data;
  },

  // Delete account
  async deleteAccount() {
    const res = await api.delete('/users/delete-account');
    return res.data;
  },
};
