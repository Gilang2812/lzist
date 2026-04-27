import React from 'react';
import EmptyState from '../components/ui/EmptyState';

const SupplierListPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Supplier</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola daftar supplier.</p>
        </div>
        <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah
        </button>
      </div>
      <EmptyState
        icon="local_shipping"
        title="Belum ada supplier"
        description="Tambahkan supplier untuk menghubungkan dengan barang."
      />
    </main>
  );
};

export default SupplierListPage;
