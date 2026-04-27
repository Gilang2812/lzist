import React from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  onClose?: () => void;
}

const typeStyles: Record<NonNullable<ToastProps['type']>, string> = {
  info: 'bg-inverse-surface text-inverse-on-surface',
  success: 'bg-primary-container text-on-primary-container',
  error: 'bg-error-container text-on-error-container',
};

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] px-lg py-md rounded-xl shadow-lg flex items-center gap-md animate-slide-up ${typeStyles[type]}`}>
      <span className="font-body-sm text-body-sm">{message}</span>
      {onClose && (
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
};

export default Toast;
