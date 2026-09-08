import React from 'react';
import './Toast.css';

export default function Toast({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <i className="fa-solid fa-circle-check"></i>}
            {toast.type === 'error' && <i className="fa-solid fa-circle-exclamation"></i>}
            {toast.type === 'loading' && <i className="fa-solid fa-circle-notch fa-spin"></i>}
            {toast.type === 'info' && <i className="fa-solid fa-circle-info"></i>}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            type="button"
            className="toast-close"
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
