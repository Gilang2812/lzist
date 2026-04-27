import React, { useState } from 'react';
import type { StokLogType } from '../../types';

interface StokFormProps {
  subBarangName?: string;
  onSubmit?: (data: { type: StokLogType; quantity: number; note: string }) => void;
  onCancel?: () => void;
}

const StokForm: React.FC<StokFormProps> = ({ subBarangName, onSubmit, onCancel }) => {
  const [type, setType] = useState<StokLogType>('masuk');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ type, quantity, note });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg p-lg">
      {subBarangName && (
        <h3 className="font-h3 text-h3 text-on-surface">Stok {type === 'masuk' ? 'Masuk' : 'Keluar'}: {subBarangName}</h3>
      )}

      <div className="flex bg-surface-container rounded-lg p-1">
        <button
          type="button"
          onClick={() => setType('masuk')}
          className={`flex-1 px-md py-sm rounded-md font-label-md text-label-md transition-all ${type === 'masuk' ? 'bg-primary-container text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
        >
          Stok Masuk
        </button>
        <button
          type="button"
          onClick={() => setType('keluar')}
          className={`flex-1 px-md py-sm rounded-md font-label-md text-label-md transition-all ${type === 'keluar' ? 'bg-error-container text-on-error-container shadow-sm' : 'text-on-surface-variant'}`}
        >
          Stok Keluar
        </button>
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Jumlah</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Catatan</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
          placeholder="Catatan opsional..."
        />
      </div>

      <div className="flex gap-md justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-lg py-sm rounded-DEFAULT border border-on-surface font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
            Batal
          </button>
        )}
        <button type="submit" className="px-lg py-sm rounded-DEFAULT bg-primary text-on-primary font-label-md text-label-md hover:bg-surface-tint transition-colors">
          Simpan
        </button>
      </div>
    </form>
  );
};

export default StokForm;
