import React from 'react';
import type { Barang } from '../../types';

interface BarangCardProps {
  barang: Barang;
  onClick?: () => void;
}

const BarangCard: React.FC<BarangCardProps> = ({ barang, onClick }) => {
  const totalStock = barang.subBarang.reduce((sum, sb) => sum + sb.stock, 0);

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl border border-surface-variant p-md cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all"
    >
      <h3 className="font-h3 text-h3 text-on-surface mb-xs">{barang.name}</h3>
      {barang.category && (
        <span className="inline-block bg-surface-container px-sm py-xs rounded-full font-label-md text-label-md text-on-surface-variant mb-sm">
          {barang.category}
        </span>
      )}
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {barang.subBarang.length} varian · Total stok: {totalStock}
      </p>
    </div>
  );
};

export default BarangCard;
