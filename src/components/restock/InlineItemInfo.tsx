import React from 'react';
import type { Variant } from '../../types';
import ImageGalleryRow from './ImageGalleryRow';

interface InlineItemInfoProps {
  variant: Variant;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onImageClick?: (url: string) => void;
  onChangeTargetQuantity?: (quantity: number) => void;
}

const InlineItemInfo: React.FC<InlineItemInfoProps> = ({ variant, isExpanded, onToggleExpand, onImageClick, onChangeTargetQuantity }) => {
  return (
    <div className="py-md border-b border-surface-variant last:border-b-0 pr-md">
      <div className="flex flex-wrap items-center mb-md cursor-pointer gap-y-sm" onClick={onToggleExpand}>
        <span className={`material-symbols-outlined text-on-surface-variant mr-sm transition-transform text-[20px] ${isExpanded ? 'rotate-90' : ''}`}>arrow_right</span>
        <input className="w-4 h-4 rounded border-outline text-primary focus:ring-primary-container mr-sm bg-surface-container-lowest cursor-pointer" type="checkbox" onClick={e => e.stopPropagation()} />
        <h3 className={`font-body-lg text-body-lg text-on-surface ${isExpanded ? 'font-medium' : ''}`}>{variant.name}</h3>
        
        <div className={`flex items-center gap-xs px-sm py-xs rounded-full sm:ml-md w-fit ${variant.outOfStock ? 'bg-error-container border border-error/20' : 'bg-surface-container'}`}>
          <span className={`w-2 h-2 rounded-full ${variant.color || 'bg-primary-fixed-dim'}`}></span>
          <span className={`font-label-md text-label-md ${variant.outOfStock ? 'text-on-error-container' : 'text-on-surface-variant'}`}>
            {variant.outOfStock ? 'Habis' : `Stok: ${variant.stock}`}
          </span>
        </div>
        
        {variant.targetQuantity !== undefined && (
          <div 
            className="flex items-center gap-xs pl-sm pr-xs py-xs rounded-full ml-sm bg-secondary-container"
            onClick={e => e.stopPropagation()}
          >
            <span className="material-symbols-outlined text-[14px] text-on-secondary-container">shopping_cart</span>
            <span className="font-label-md text-label-md text-on-secondary-container">Dicari:</span>
            <input 
              type="number" 
              className="w-12 bg-transparent text-on-secondary-container font-label-md text-label-md outline-none border-b border-transparent focus:border-on-secondary-container/50 text-center custom-number-input"
              value={variant.targetQuantity}
              onChange={e => onChangeTargetQuantity?.(Number(e.target.value))}
            />
          </div>
        )}
        
        {variant.stores && variant.stores.length > 0 && (
          <div className="flex flex-wrap gap-sm ml-auto">
            <span className="px-md py-xs text-primary font-body-sm text-body-sm flex items-center gap-xs">
              {variant.stores.join(' | ')}
            </span>
          </div>
        )}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && variant.images && (
        <div className="pl-[28px] sm:pl-[44px]">
          <ImageGalleryRow images={variant.images} altPrefix={variant.name} onImageClick={onImageClick} />
        </div>
      )}
    </div>
  );
};

export default InlineItemInfo;
