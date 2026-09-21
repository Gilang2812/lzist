import React, { useEffect, useState, useRef } from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface CornerAlertProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  duration?: number; // duration in ms (default: 4000)
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const typeConfig: Record<
  AlertType,
  {
    bg: string;
    border: string;
    icon: string;
    iconColor: string;
    progressColor: string;
    titleColor: string;
  }
> = {
  error: {
    bg: 'bg-surface-container-high/95 dark:bg-gray-900/95',
    border: 'border-error/40 dark:border-red-500/30',
    icon: 'error',
    iconColor: 'text-error dark:text-red-400',
    progressColor: 'bg-error dark:bg-red-500',
    titleColor: 'text-error dark:text-red-400',
  },
  warning: {
    bg: 'bg-surface-container-high/95 dark:bg-gray-900/95',
    border: 'border-amber-500/40 dark:border-amber-500/30',
    icon: 'warning',
    iconColor: 'text-amber-500 dark:text-amber-400',
    progressColor: 'bg-amber-500 dark:bg-amber-400',
    titleColor: 'text-amber-700 dark:text-amber-300',
  },
  success: {
    bg: 'bg-surface-container-high/95 dark:bg-gray-900/95',
    border: 'border-primary/40 dark:border-teal-500/30',
    icon: 'check_circle',
    iconColor: 'text-primary dark:text-teal-400',
    progressColor: 'bg-primary dark:bg-teal-500',
    titleColor: 'text-primary dark:text-teal-400',
  },
  info: {
    bg: 'bg-surface-container-high/95 dark:bg-gray-900/95',
    border: 'border-outline-variant dark:border-blue-500/30',
    icon: 'info',
    iconColor: 'text-blue-500 dark:text-blue-400',
    progressColor: 'bg-blue-500 dark:bg-blue-400',
    titleColor: 'text-blue-600 dark:text-blue-400',
  },
};

const positionStyles: Record<string, string> = {
  'top-right': 'top-5 right-5',
  'top-left': 'top-5 left-5',
  'bottom-right': 'bottom-5 right-5',
  'bottom-left': 'bottom-5 left-5',
};

const CornerAlert: React.FC<CornerAlertProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  duration = 4000,
  onClose,
  position = 'top-right',
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(duration);
  const animationFrameRef = useRef<number | null>(null);

  const cfg = typeConfig[type] || typeConfig.info;

  // Reset and start countdown when alert opens or message/duration changes
  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    setProgress(100);
    remainingTimeRef.current = duration;
    startTimeRef.current = performance.now();

    const updateProgress = (currentTime: number) => {
      if (isPaused) {
        startTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      }

      const elapsed = currentTime - startTimeRef.current;
      startTimeRef.current = currentTime;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);

      const percent = (remainingTimeRef.current / duration) * 100;
      setProgress(percent);

      if (remainingTimeRef.current <= 0) {
        onClose();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, duration, message, onClose, isPaused]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed ${positionStyles[position] || positionStyles['top-right']} z-[100] max-w-ms w-full shadow-2xl rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${cfg.bg} ${cfg.border}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
    >
      <div className="p-4 flex items-start gap-3">
        <span className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${cfg.iconColor}`}>
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold leading-snug mb-1 ${cfg.titleColor}`}>
              {title}
            </h4>
          )}
          <p className="text-xs text-on-surface-variant dark:text-gray-300 leading-relaxed break-words">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant/60 hover:text-on-surface dark:text-gray-400 dark:hover:text-white p-1 -mr-1 -mt-1 rounded-md transition-colors cursor-pointer"
          title="Tutup"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Shrinking progress line indicating time left */}
      <div className="w-full h-1 bg-surface-variant/30 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full ${cfg.progressColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default CornerAlert;
