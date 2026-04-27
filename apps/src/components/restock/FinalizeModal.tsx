import React from 'react';

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemCount?: number;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ isOpen, onClose, onConfirm, itemCount = 0 }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/50 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest w-[90%] sm:w-[420px] rounded-xl shadow-lg border border-surface-variant p-lg flex flex-col gap-lg">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">check_circle</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-surface">Finalisasi Restock</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{itemCount} item akan ditandai selesai</p>
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Apakah kamu yakin ingin menyelesaikan restock list ini? Aksi ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-md justify-end">
          <button onClick={onClose} className="px-lg py-sm rounded-DEFAULT border border-on-surface font-label-md text-label-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
            Batal
          </button>
          <button onClick={onConfirm} className="px-lg py-sm rounded-DEFAULT bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors">
            Selesaikan
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizeModal;
