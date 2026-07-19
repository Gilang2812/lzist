import React, { useState } from 'react';
import type { Variant } from '../../types';
import ImageGalleryRow from './ImageGalleryRow';
import ConfirmDialog from '../ui/ConfirmDialog';


interface InlineItemInfoProps {
  variant: Variant;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onImageClick?: (url: string) => void;
  onChangeTargetQuantity?: (quantity: number) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  showCheckboxes?: boolean;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

const InlineItemInfo: React.FC<InlineItemInfoProps> = ({ variant, isExpanded, onToggleExpand, onImageClick, onChangeTargetQuantity, onDelete, readOnly = false, showCheckboxes = true, isChecked = false, onToggleCheck }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  return (
    <div className="py-1 sm:py-1 pr-2 sm:pr-md">
      <div className="flex flex-wrap items-center mb-1 sm:mb-1 cursor-pointer gap-y-1 gap-x-2" onClick={onToggleExpand}>
        {showCheckboxes && (
          <input
            className="w-5 h-5   sm:w-5 sm:h-4 rounded border-outline text-primary focus:ring-primary-container  bg-surface-container-lowest cursor-pointer"
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleCheck && onToggleCheck()}
            onClick={e => e.stopPropagation()}
          />
        )}
        <p className={`text-xs    text-on-surface ${isExpanded ? 'font-medium' : ''}`}>{variant.name}</p>
        {variant.targetQuantity !== undefined && (
          <div
            className="flex items-center gap-1   pr-1.5 py-0.5 rounded-full ml-1 bg-secondary-container"
            onClick={e => e.stopPropagation()}
          >
            {!readOnly && (
              <button
                className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:bg-on-secondary-container/10 text-on-secondary-container transition-colors active:bg-on-secondary-container/20"
                onClick={() => onChangeTargetQuantity?.(Math.max(0, (variant.targetQuantity || 0) - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">remove</span>
              </button>
            )}
            {readOnly ? (
              <span className="w-6 sm:w-8 text-on-secondary-container text-[10px] sm:text-xs font-semibold text-center">{variant.targetQuantity}</span>
            ) : (
              <input
                type="number"
                className="w-6 sm:w-8 bg-transparent text-on-secondary-container text-[10px] sm:text-xs font-semibold outline-none border-b border-transparent focus:border-on-secondary-container/50 text-center custom-number-input"
                value={variant.targetQuantity}
                onChange={e => onChangeTargetQuantity?.(Number(e.target.value))}
                min="0"
              />
            )}
            {!readOnly && (
              <button
                className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full hover:bg-on-secondary-container/10 text-on-secondary-container transition-colors active:bg-on-secondary-container/20"
                onClick={() => onChangeTargetQuantity?.((variant.targetQuantity || 0) + 1)}
                type="button"
              >
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">add</span>
              </button>
            )}
          </div>
        )}



        <div className="flex items-center gap-sm ml-auto">
          {onDelete && !readOnly && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
              title="Hapus Varian"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && variant.images && (
        <div className="">
          <ImageGalleryRow images={variant.images} altPrefix={variant.name} onImageClick={onImageClick} />
        </div>
      )}

      {onDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Hapus Varian"
          message={`Apakah Anda yakin ingin menghapus varian "${variant.name}"?`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
          variant="danger"
        />
      )}
    </div>
  );
};

export default InlineItemInfo;
