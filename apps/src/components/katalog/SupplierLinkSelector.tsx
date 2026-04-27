import React from 'react';
import type { Supplier } from '../../types';

interface SupplierLinkSelectorProps {
  suppliers: Supplier[];
  selectedId?: string;
  onChange: (supplierId: string) => void;
}

const SupplierLinkSelector: React.FC<SupplierLinkSelectorProps> = ({ suppliers, selectedId, onChange }) => {
  return (
    <div className="flex flex-col gap-xs">
      <label className="font-label-md text-label-md text-on-surface-variant uppercase">Supplier</label>
      <select
        value={selectedId || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
      >
        <option value="">Pilih supplier...</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
};

export default SupplierLinkSelector;
