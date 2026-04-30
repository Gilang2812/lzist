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
  readOnly?: boolean;
  showCheckboxes?: boolean;
  checkedVariants?: Set<string>;
  onToggleVariantCheck?: (id: string) => void;
  onToggleCategoryCheck?: () => void;
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
  readOnly = false,
  showCheckboxes = true,
  checkedVariants = new Set(),
  onToggleVariantCheck,
  onToggleCategoryCheck,
}) => {
  const availableVariants = category.variants;
  const checkedCount = availableVariants.filter(variant => checkedVariants.has(variant.id)).length;
  
  const isAllChecked = availableVariants.length > 0 && checkedCount === availableVariants.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < availableVariants.length;

  return (
    <div className="border-b border-surface-variant last:border-b-0">
      {/* Category Header */}
      <div
        className="flex items-center py-sm px-md cursor-pointer hover:bg-surface-container-low transition-colors group gap-sm"
        onClick={onToggleExpand}
      >
        <span className={`material-symbols-outlined text-on-surface-variant transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>chevron_right</span>
        {showCheckboxes && (
          <input
            className={`w-5 h-5 rounded border-outline text-primary focus:ring-primary-container bg-surface-container-lowest cursor-pointer flex-shrink-0 ${isIndeterminate ? 'indeterminate' : ''}`}
            type="checkbox"
            checked={isAllChecked || isIndeterminate}
            onChange={() => onToggleCategoryCheck && onToggleCategoryCheck()}
            ref={el => { if (el) el.indeterminate = isIndeterminate; }}
            onClick={e => e.stopPropagation()}
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-h3 text-h3 text-on-surface leading-snug truncate">{category.name}</h2>
          {category.supplierNames && category.supplierNames.length > 0 && (
            <div className="flex flex-wrap gap-xs mt-0.5">
              {category.supplierNames.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-0.5 text-[11px] text-on-secondary-container bg-secondary-container px-xs py-0.5 rounded-full leading-none"
                >
                  <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="bg-surface-container px-sm py-xs rounded-full font-label-md text-label-md text-on-surface-variant flex-shrink-0">{category.variants.length} Varian</span>
        {onDelete && !readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id);
            }}
            className="w-8 h-8 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all cursor-pointer flex-shrink-0"
            title="Hapus Kategori"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        )}
      </div>

      {/* Category Variants */}
      {isExpanded && category.variants.length > 0 && (
        <div className="flex flex-col pl-md sm:pl-xl border-l-2 border-primary-fixed-dim ml-[18px] sm:ml-[34px] mb-md">
          {category.variants.map(variant => (
            <InlineItemInfo
              key={variant.id}
              variant={variant}
              isExpanded={expandedVariants.has(variant.id)}
              onToggleExpand={() => onToggleVariant(variant.id)}
              onImageClick={onImageClick}
              onChangeTargetQuantity={(q) => onChangeVariantTargetQuantity?.(variant.id, q)}
              onDelete={onDeleteVariant ? () => onDeleteVariant(variant.id) : undefined}
              readOnly={readOnly}
              showCheckboxes={showCheckboxes}
              isChecked={checkedVariants.has(variant.id)}
              onToggleCheck={() => onToggleVariantCheck && onToggleVariantCheck(variant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestockListCard;
