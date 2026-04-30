import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-on-surface/50 z-50 backdrop-blur-sm flex items-center justify-center p-md"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest w-[90%] sm:w-[500px] rounded-xl shadow-lg border border-surface-variant flex flex-col overflow-hidden max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-lg py-md border-b border-surface-variant flex justify-between items-center bg-surface-bright">
            <h2 className="font-h2 text-h2 text-on-surface">{title}</h2>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-xs rounded-DEFAULT hover:bg-surface-container">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
