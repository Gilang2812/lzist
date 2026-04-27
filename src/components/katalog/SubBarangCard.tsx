import React from 'react';
import type { SubBarang } from '../../types';

interface SubBarangCardProps {
  subBarang: SubBarang;
  onClick?: () => void;
}

const SubBarangCard: React.FC<SubBarangCardProps> = ({ subBarang, onClick }) => {
  const isLowStock = subBarang.minStock !== undefined && subBarang.stock <= subBarang.minStock;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
    >
      <div className="flex-1">
        <span className="font-body-md text-body-md text-on-surface">{subBarang.name}</span>
        {subBarang.sku && (
          <span className="ml-sm font-label-md text-label-md text-on-surface-variant">SKU: {subBarang.sku}</span>
        )}
      </div>
      <div className={`flex items-center gap-xs px-sm py-xs rounded-full ${isLowStock ? 'bg-error-container' : 'bg-surface-container'}`}>
        <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-error' : 'bg-primary-fixed-dim'}`}></span>
        <span className={`font-label-md text-label-md ${isLowStock ? 'text-on-error-container' : 'text-on-surface-variant'}`}>
          Stok: {subBarang.stock}
        </span>
      </div>
    </div>
  );
};

export default SubBarangCard;
