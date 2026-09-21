import React from 'react';

interface LoadingSpinnerProps {
  isOpen: boolean;
  title: string;
  message?: string;
}

/**
 * Full-screen overlay popup spinner for long-running user actions
 * such as form submissions or Excel imports.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isOpen, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/30 backdrop-blur-[2px] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-ms rounded-2xl bg-surface-container-lowest border border-surface-variant/60 shadow-xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
            <span className="material-symbols-outlined animate-spin text-[24px]">
              progress_activity
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface">{title}</p>
            {message && (
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{message}</p>
            )}
          </div>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
