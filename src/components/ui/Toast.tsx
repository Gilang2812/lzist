import React from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'loading';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  info: 'bg-inverse-surface text-inverse-on-surface',
  success: 'bg-primary-container text-on-primary-container',
  error: 'bg-error-container text-on-error-container',
  loading: 'bg-inverse-surface text-inverse-on-surface',
};

const typeIcons: Record<ToastType, React.ReactNode> = {
  info: <span className="material-symbols-outlined text-[18px] flex-shrink-0">info</span>,
  success: <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>,
  error: <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>,
  loading: (
    <svg className="animate-spin w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
};

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] px-lg py-md rounded-xl shadow-lg flex items-center gap-md animate-slide-up min-w-[220px] ${typeStyles[type]}`}>
      {typeIcons[type]}
      <span className="font-body-sm text-body-sm flex-1">{message}</span>
      {onClose && type !== 'loading' && (
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
};

export default Toast;
