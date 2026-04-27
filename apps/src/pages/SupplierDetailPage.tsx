import React from 'react';
import EmptyState from '../components/ui/EmptyState';

const SupplierDetailPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <EmptyState
        icon="local_shipping"
        title="Detail Supplier"
        description="Halaman detail supplier akan menampilkan informasi kontak dan barang terkait."
      />
    </main>
  );
};

export default SupplierDetailPage;
