import React from 'react';
import EmptyState from '../components/ui/EmptyState';

const BarangDetailPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <EmptyState
        icon="inventory"
        title="Detail Barang"
        description="Halaman detail barang akan menampilkan informasi lengkap beserta varian dan stok."
      />
    </main>
  );
};

export default BarangDetailPage;
