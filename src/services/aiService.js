import api from './api';

/**
 * Send a natural language query to the backend AI Shopping Assistant
 * @param {string} message - User query (e.g. "Find me ASUS laptops")
 * @returns {Promise<{success: boolean, message: string, products: Array, pagination: Object}>}
 */
export async function sendAiMessage(message) {
  const response = await api.post('/ai/chat', { message });
  return response.data;
}

export const aiService = {
  sendAiMessage,
};

export default aiService;
