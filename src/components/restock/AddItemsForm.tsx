import React, { useState } from 'react';
import type { Variant, Category } from '../../types';
import SearchInput from '../ui/SearchInput';
import { INITIAL_DATA } from '../../data/restockInitialData';

interface AddItemsFormProps {
  onClose: () => void;
  onAddItems?: (items: Category[]) => void;
}


// ─── Sub-components ─────────────────────────────────────────

const VariantRow: React.FC<{
  variant: Variant;
  isChecked: boolean;
  onToggle: (id: string) => void;
}> = ({ variant, isChecked, onToggle }) => {
  return (
    <label className={`flex items-center p-sm hover:bg-surface-container-low rounded-DEFAULT cursor-pointer transition-colors ${isChecked ? 'bg-primary-container/10' : ''}`}>
      <div className="relative flex items-center mr-md">
        <input 
          checked={isChecked} 
          onChange={() => onToggle(variant.id)}
          className={`custom-checkbox appearance-none w-md h-md border-2 rounded-DEFAULT cursor-pointer transition-colors relative ${isChecked ? 'border-primary-container bg-primary-container' : 'border-outline-variant'}`} 
          type="checkbox" 
        />
      </div>
      <span className={`font-body-sm text-body-sm text-on-surface-variant flex-1 ${isChecked ? 'font-medium' : ''}`}>{variant.name}</span>
      <div className={`flex items-center gap-xs px-sm py-xs rounded-full ${variant.stock === 0 ? 'bg-error-container' : 'bg-surface-container'}`}>
        <span className={`font-label-md text-label-md ${variant.stock === 0 ? 'text-on-error-container' : 'text-on-surface-variant'}`}>Stok: {variant.stock}</span>
        {variant.stock === 0 && <span className="material-symbols-outlined text-[14px] text-on-error-container">warning</span>}
      </div>
    </label>
  );
};

const AccordionCategory: React.FC<{
  category: Category;
  expanded: boolean;
  onToggleExpand: () => void;
  selectedVariants: Set<string>;
  onToggleVariant: (id: string) => void;
  onToggleCategory: () => void;
}> = ({ category, expanded, onToggleExpand, selectedVariants, onToggleVariant, onToggleCategory }) => {
  const availableVariants = category.variants;
  const checkedCount = availableVariants.filter(variant => selectedVariants.has(variant.id)).length;
  
  const isAllChecked = availableVariants.length > 0 && checkedCount === availableVariants.length;
  const isIndeterminate = checkedCount > 0 && checkedCount < availableVariants.length;
  const hasChecked = checkedCount > 0;

  return (
    <div className="mb-sm">
      <div 
        className={`flex items-center p-sm rounded-DEFAULT cursor-pointer transition-colors group ${hasChecked ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'}`}
        onClick={onToggleExpand}
      >
        <button className="mr-sm text-on-surface-variant group-hover:text-on-surface p-xs rounded-DEFAULT hover:bg-surface-container">
          <span className="material-symbols-outlined">
            {expanded ? 'expand_more' : 'chevron_right'}
          </span>
        </button>
        <div className="relative flex items-center mr-md" onClick={(e) => e.stopPropagation()}>
          <input 
            checked={isAllChecked || isIndeterminate}
            onChange={onToggleCategory}
            className={`custom-checkbox appearance-none w-md h-md border-2 rounded-DEFAULT cursor-pointer transition-colors relative ${isIndeterminate ? 'indeterminate border-primary-container bg-primary-container' : (isAllChecked ? 'border-primary-container bg-primary-container' : 'border-outline-variant')}`} 
            type="checkbox" 
          />
        </div>
        <span className={`font-body-md text-body-md text-on-surface flex-1 ${hasChecked ? 'font-medium' : ''}`}>{category.name}</span>
      </div>
      
      {expanded && category.variants.length > 0 && (
        <div className="pl-[44px] pr-sm py-xs flex flex-col gap-xs">
          {category.variants.map(variant => (
            <VariantRow 
              key={variant.id} 
              variant={variant} 
              isChecked={selectedVariants.has(variant.id)} 
              onToggle={onToggleVariant} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────

const AddItemsForm: React.FC<AddItemsFormProps> = ({ onClose, onAddItems }) => {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariants(prev => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  };

  const toggleCategory = (category: Category) => {
    const availableVariants = category.variants;
    if (availableVariants.length === 0) return;

    setSelectedVariants(prev => {
      const next = new Set(prev);
      const isAllChecked = availableVariants.every(variant => prev.has(variant.id));
      
      if (isAllChecked) {
        availableVariants.forEach(variant => next.delete(variant.id));
      } else {
        availableVariants.forEach(variant => next.add(variant.id));
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (onAddItems && selectedVariants.size > 0) {
      const itemsToAdd = INITIAL_DATA.map(cat => ({
        ...cat,
        variants: cat.variants.filter(v => selectedVariants.has(v.id))
      })).filter(cat => cat.variants.length > 0);
      
      onAddItems(itemsToAdd);
    }
    onClose();
  };

  const filteredAndSortedData = React.useMemo(() => {
    let data = INITIAL_DATA;
    
    if (searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      data = data.map(cat => {
        const catNameLower = cat.name.toLowerCase();
        
        const filteredVariants = cat.variants.filter(v => {
          const variantNameLower = v.name.toLowerCase();
          const combinedName = `${catNameLower} ${variantNameLower}`;
          return searchTerms.every(term => combinedName.includes(term));
        });
        
        if (filteredVariants.length > 0) {
          return { ...cat, variants: filteredVariants };
        }
        return null;
      }).filter((cat): cat is Category => cat !== null);
    }
    
    return [...data].map(cat => ({
      ...cat,
      variants: [...cat.variants].sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery]);

  const totalSelected = selectedVariants.size;

  return (
    <div className="fixed inset-0 bg-on-surface/50 z-50 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest w-[90%] sm:w-[500px] rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-1px_rgba(0,0,0,0.03)] border border-surface-variant flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-lg py-md border-b border-surface-variant flex justify-between items-center bg-surface-bright">
          <h2 className="font-h2 text-h2 text-on-surface">Tambah Barang ke List</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-xs rounded-DEFAULT hover:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="p-lg border-b border-surface-variant bg-surface-bright">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Cari barang..." />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-md max-h-[512px] bg-surface">
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map(category => (
              <AccordionCategory 
                key={category.id}
                category={category}
                expanded={searchQuery.trim() !== '' || expandedCats.has(category.id)}
                onToggleExpand={() => toggleExpand(category.id)}
                selectedVariants={selectedVariants}
                onToggleVariant={toggleVariant}
                onToggleCategory={() => toggleCategory(category)}
              />
            ))
          ) : (
            <div className="p-lg text-center text-on-surface-variant font-body-md">
              Tidak ada barang yang ditemukan.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-lg py-md border-t border-surface-variant bg-surface-bright flex items-center justify-between">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Dipilih: <strong className="text-on-surface">{totalSelected} Varian</strong></span>
          <div className="flex gap-md">
            <button onClick={onClose} className="px-lg py-sm rounded-DEFAULT border border-on-surface font-label-md text-label-md text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2">
              Batal
            </button>
            <button onClick={handleAdd} className="px-lg py-sm rounded-DEFAULT border border-transparent font-label-md text-label-md text-on-secondary bg-primary-container hover:bg-primary-fixed-dim transition-colors text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2">
              Tambahkan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddItemsForm;
