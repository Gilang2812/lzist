import React, { useState } from 'react';
import type { Variant } from '../../types';
import ImageGalleryRow from './ImageGalleryRow';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatRupiah } from '../../utils/formatCurrency';

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
    <div className="py-2 sm:py-3 border-b border-surface-variant last:border-b-0 pr-2 sm:pr-md">
      <div className="flex flex-wrap items-center mb-2 sm:mb-3 cursor-pointer gap-y-1 gap-x-2" onClick={onToggleExpand}>
        <span className={`material-symbols-outlined text-on-surface-variant mr-1 transition-transform text-[16px] sm:text-[20px] ${isExpanded ? 'rotate-90' : ''}`}>arrow_right</span>
        {showCheckboxes && (
          <input 
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-outline text-primary focus:ring-primary-container mr-1 bg-surface-container-lowest cursor-pointer" 
            type="checkbox" 
            checked={isChecked}
            onChange={() => onToggleCheck && onToggleCheck()}
            onClick={e => e.stopPropagation()} 
          />
        )}
        <h3 className={`text-xs sm:text-sm text-on-surface ${isExpanded ? 'font-medium' : ''}`}>{variant.name}</h3>
        
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full sm:ml-2 w-fit ${variant.outOfStock ? 'bg-error-container border border-error/20' : 'bg-surface-container'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${variant.color || 'bg-primary-fixed-dim'}`}></span>
          <span className={`text-[10px] sm:text-xs font-medium ${variant.outOfStock ? 'text-on-error-container' : 'text-on-surface-variant'}`}>
            {variant.outOfStock ? 'Habis' : `Stok: ${variant.stock}`}
          </span>
        </div>
        
        {variant.targetQuantity !== undefined && (
          <div 
            className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full ml-1 bg-secondary-container"
            onClick={e => e.stopPropagation()}
          >
            <span className="material-symbols-outlined text-[12px] sm:text-[14px] text-on-secondary-container">shopping_cart</span>
            <span className="text-[10px] sm:text-xs font-semibold text-on-secondary-container mr-0.5">Dicari:</span>
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

        {variant.price !== undefined && (
          <div className="flex items-center gap-1 ml-1.5 text-[11px] sm:text-xs text-on-surface-variant flex-wrap">
            <span className="font-semibold text-on-surface">{formatRupiah(variant.price)}</span>
            {variant.targetQuantity !== undefined && variant.targetQuantity > 0 && (
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant/70">
                × {variant.targetQuantity} = <span className="font-bold text-primary">{formatRupiah(variant.price * variant.targetQuantity)}</span>
              </span>
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
        <div className="pl-[28px] sm:pl-[44px]">
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
