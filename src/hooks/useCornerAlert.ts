import { useState, useCallback } from 'react';
import type { AlertType } from '../components/ui/CornerAlert';

export interface CornerAlertState {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  duration?: number;
}

export function useCornerAlert() {
  const [alert, setAlert] = useState<CornerAlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    duration: 4000,
  });

  const showAlert = useCallback(
    ({
      title,
      message,
      type = 'info',
      duration = 4000,
    }: {
      title?: string;
      message: string;
      type?: AlertType;
      duration?: number;
    }) => {
      setAlert({
        isOpen: true,
        title,
        message,
        type,
        duration,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { alert, showAlert, hideAlert };
}
