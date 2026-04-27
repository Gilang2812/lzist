import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/50 z-[60] backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest w-[90%] sm:w-[400px] rounded-xl shadow-lg border border-surface-variant p-lg flex flex-col gap-lg">
        <div>
          <h3 className="font-h3 text-h3 text-on-surface mb-xs">{title}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
        </div>
        <div className="flex gap-md justify-end">
          <button
            onClick={onCancel}
            className="px-lg py-sm rounded-DEFAULT border border-on-surface font-label-md text-label-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-lg py-sm rounded-DEFAULT border border-transparent font-label-md text-label-md transition-colors ${
              variant === 'danger'
                ? 'bg-error text-on-error hover:bg-error/90'
                : 'bg-primary-container text-on-surface hover:bg-primary-fixed-dim'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
