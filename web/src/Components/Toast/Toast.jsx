import { useEffect, useState } from 'react';
import './Toast.css';

let toastIdCounter = 0;
const toastListeners = new Set();

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = toastIdCounter++;
  const toast = { id, message, type, duration };
  
  toastListeners.forEach(listener => listener(toast));
  
  return id;
};

export const showSuccess = (message, duration) => showToast(message, 'success', duration);
export const showError = (message, duration) => showToast(message, 'error', duration);
export const showInfo = (message, duration) => showToast(message, 'info', duration);
export const showWarning = (message, duration) => showToast(message, 'warning', duration);

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (newToast) => {
      setToasts(prev => [...prev, newToast]);
      
      // Автоматически удаляем тост через duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-icon">
            {toast.type === 'success' && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13.3333V10M10 6.66667H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39765 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39765 5.39765 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39765 18.3333 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39765 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39765 5.39765 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39765 18.3333 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;

