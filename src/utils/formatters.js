/**
 * G-Lab Formatting & Validation Utilities
 */

export function formatPrice(amount) {
  const num = Number(amount || 0);
  return `Rs. ${num.toLocaleString('en-US')}`;
}

export function calculateDiscountPrice(price, discount) {
  const original = Number(price || 0);
  const discPercent = Number(discount || 0);
  if (discPercent <= 0) return original;
  return Math.round(original * (1 - discPercent / 100));
}

export function validatePhoneNumber(phone) {
  if (!phone) return false;
  const cleaned = String(phone).trim();
  return /^[0-9]{10}$/.test(cleaned);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
