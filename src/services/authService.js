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
  async forgotPassword(emailOrPayload) {
    const email = typeof emailOrPayload === 'object' && emailOrPayload !== null
      ? emailOrPayload.email
      : emailOrPayload;
    const res = await api.post('/users/forgot-password', { email });
    return res.data;
  },

  // Verify reset OTP
  async verifyResetOtp(emailOrPayload, otp) {
    let payload;
    if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
      payload = emailOrPayload;
    } else {
      payload = { email: emailOrPayload, otp };
    }
    const res = await api.post('/users/verify-reset-otp', payload);
    return res.data;
  },

  // Reset password
  async resetPassword(emailOrPayload, otp, newPassword) {
    let payload;
    if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
      payload = emailOrPayload;
    } else {
      payload = { email: emailOrPayload, otp, newPassword };
    }
    const res = await api.post('/users/reset-password', payload);
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
  async changePassword(currentPasswordOrPayload, newPassword) {
    let payload;
    if (typeof currentPasswordOrPayload === 'object' && currentPasswordOrPayload !== null) {
      payload = currentPasswordOrPayload;
    } else {
      payload = { currentPassword: currentPasswordOrPayload, newPassword };
    }
    const res = await api.put('/users/change-password', payload);
    return res.data;
  },

  // Delete account
  async deleteAccount() {
    const res = await api.delete('/users/delete-account');
    return res.data;
  },
};
