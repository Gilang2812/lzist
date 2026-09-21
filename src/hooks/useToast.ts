import { useState, useCallback } from 'react';
import type { ToastType } from '../components/ui/Toast';

export interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast(autoDismissMs = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setToast(null), autoDismissMs);
    }
  }, [autoDismissMs]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
