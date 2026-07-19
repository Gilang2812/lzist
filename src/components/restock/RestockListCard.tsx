import React from 'react';
import type { Category } from '../../types';
import InlineItemInfo from './InlineItemInfo';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRupiah } from '../../utils/formatCurrency';

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
  onToggleVariantCheck?: (id: string) => void;
  onToggleCategoryCheck?: () => void;
  isLast?: boolean;
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
  onToggleVariantCheck,
  onToggleCategoryCheck,
  isLast = false,
}) => {
  const availableVariants = category.variants;
  const checkedCount = availableVariants.filter(variant => variant.checked).length;
  const checkedQty = availableVariants.filter(v => v.checked).reduce((acc, v) => acc + (v.targetQuantity || 0), 0);
  const totalQty = availableVariants.reduce((acc, v) => acc + (v.targetQuantity || 0), 0);
  
  const uncheckedCategoryPrice = availableVariants
    .filter(v => !v.checked)
    .reduce((acc, v) => acc + (category.price || 0) * (v.targetQuantity || 0), 0);
  
  const totalCategoryPrice = availableVariants
    .reduce((acc, v) => acc + (category.price || 0) * (v.targetQuantity || 0), 0);
    
  const checkedCategoryPrice = totalCategoryPrice - uncheckedCategoryPrice;
  
  const isAllChecked = availableVariants.length > 0 && checkedCount === availableVariants.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < availableVariants.length;

  const sortedVariants = [...availableVariants].sort((a, b) => {
    if (a.checked === b.checked) return 0;
    return a.checked ? 1 : -1;
  });

  return (
    <div className={`border-b border-surface-variant ${isLast ? 'border-b-0' : ''}`}>
      {/* Category Header */}
      <div
        className="flex items-center border-t first:border-t-0 p-1 sm:py-sm sm:px-md cursor-pointer hover:bg-surface-container-low transition-colors group gap-2"
        onClick={onToggleExpand}
      >
      {showCheckboxes && (
          <input
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-outline text-primary focus:ring-primary-container bg-surface-container-lowest cursor-pointer shrink-0 ${isIndeterminate ? 'indeterminate' : ''}`}
            type="checkbox"
            checked={isAllChecked || isIndeterminate}
            onChange={() => onToggleCategoryCheck && onToggleCategoryCheck()}
            ref={el => { if (el) el.indeterminate = isIndeterminate; }}
            onClick={e => e.stopPropagation()}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-xs text-on-surface font-semibold leading-snug ${isExpanded ? '' : 'truncate'}`}>{category.name}</p>
          {category.supplierNames && category.supplierNames.length > 0 && (
            <div className="flex flex-wrap gap-xs mt-0.5">
              {category.supplierNames.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] text-on-secondary-container bg-secondary-container px-1 py-0.5 rounded-full leading-none font-medium"
                >
                  <span className="material-symbols-outlined text-[9px] sm:text-[10px]">local_shipping</span>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="bg-surface-container px-1.5 py-px sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[11px] text-on-surface-variant font-medium">
            {checkedCount}/{availableVariants.length} Varian
          </span>
          <span className="text-[9px] sm:text-[10px] text-on-surface-variant opacity-70 px-1 sm:px-1.5">
            {checkedQty}/{totalQty} qty
          </span>
          {totalCategoryPrice > 0 && (
            <div className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 font-semibold">
              <span className="text-primary">{formatRupiah(uncheckedCategoryPrice)}</span>
              <span className="text-on-surface mx-1">/</span>
              <span className="text-on-surface">{formatRupiah(checkedCategoryPrice)}</span>
            </div>
          )}
        </div>
        {onDelete && !readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(category.id);
            }}
            className="w-7 h-7 flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-all cursor-pointer shrink-0"
            title="Hapus Kategori"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>

      {/* Category Variants */}
      {isExpanded && category.variants.length > 0 && (
        <div className="flex flex-col border-l-2 border-primary-fixed-dim ml-[18px]">
          <AnimatePresence>
            {sortedVariants.map(variant => (
              <motion.div
                key={variant.id}
                layout="position"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="odd:bg-surface-container-high pl-md "
              >
                <InlineItemInfo
                  variant={variant} 
                  isExpanded={expandedVariants.has(variant.id)}
                  onToggleExpand={() => onToggleVariant(variant.id)}
                  onImageClick={onImageClick}
                  onChangeTargetQuantity={(q) => onChangeVariantTargetQuantity?.(variant.id, q)}
                  onDelete={onDeleteVariant ? () => onDeleteVariant(variant.id) : undefined}
                  readOnly={readOnly}
                  showCheckboxes={showCheckboxes}
                  isChecked={variant.checked}
                  onToggleCheck={() => onToggleVariantCheck && onToggleVariantCheck(variant.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default RestockListCard;
