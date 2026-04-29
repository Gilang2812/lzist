import React from 'react';
import type { Category } from '../../types';
import InlineItemInfo from './InlineItemInfo';

interface RestockListCardProps {
  category: Category;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedVariants: Set<string>;
  onToggleVariant: (id: string) => void;
  onImageClick?: (url: string) => void;
  onDelete?: (id: string) => void;
  onDeleteVariant?: (variantId: string) => void;
  onChangeVariantTargetQuantity?: (variantId: string, quantity: number) => void;
}

const RestockListCard: React.FC<RestockListCardProps> = ({
  category,
  isExpanded,
  onToggleExpand,
  expandedVariants,
  onToggleVariant,
  onImageClick,
  onDelete,
  onDeleteVariant,
  onChangeVariantTargetQuantity,
}) => {
  return (
    <div className="border-b border-surface-variant last:border-b-0">
      {/* Category Header */}
      <div className="flex items-center py-md px-md cursor-pointer hover:bg-surface-container-low transition-colors group" onClick={onToggleExpand}>
        <span className={`material-symbols-outlined text-on-surface-variant mr-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
        <input className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container mr-md bg-surface-container-lowest cursor-pointer" type="checkbox" onClick={e => e.stopPropagation()} />
        <h2 className="font-h3 text-h3 text-on-surface flex-grow">{category.name}</h2>
        <span className="bg-surface-container px-sm py-xs rounded-full font-label-md text-label-md text-on-surface-variant transition-all">{category.variants.length} Varian</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id);
            }}
            className="ml-sm w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all cursor-pointer"
            title="Hapus Kategori"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        )}
      </div>

      {/* Category Variants */}
      {isExpanded && category.variants.length > 0 && (
        <div className="flex flex-col pl-md sm:pl-xl border-l-2 border-surface-variant ml-[18px] sm:ml-[34px] mb-md">
          {category.variants.map(variant => (
            <InlineItemInfo
              key={variant.id}
              variant={variant}
              isExpanded={expandedVariants.has(variant.id)}
              onToggleExpand={() => onToggleVariant(variant.id)}
              onImageClick={onImageClick}
              onChangeTargetQuantity={(q) => onChangeVariantTargetQuantity?.(variant.id, q)}
              onDelete={onDeleteVariant ? () => onDeleteVariant(variant.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestockListCard;
