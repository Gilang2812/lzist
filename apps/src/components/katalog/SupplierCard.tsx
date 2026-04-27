import React from 'react';
import type { Supplier } from '../../types';

interface SupplierCardProps {
  supplier: Supplier;
  onClick?: () => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl border border-surface-variant p-md cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all"
    >
      <div className="flex items-center gap-md">
        <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-tertiary-container">local_shipping</span>
        </div>
        <div className="flex-1">
          <h3 className="font-body-lg text-body-lg text-on-surface font-medium">{supplier.name}</h3>
          {supplier.contact && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">{supplier.contact}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierCard;
