import React from 'react';
import EmptyState from '../components/ui/EmptyState';

const KatalogPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Katalog Barang</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola semua barang dan varian.</p>
        </div>
        <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah
        </button>
      </div>
      <EmptyState
        icon="menu_book"
        title="Katalog masih kosong"
        description="Tambahkan barang pertama untuk memulai mengelola inventaris."
      />
    </main>
  );
};

export default KatalogPage;
