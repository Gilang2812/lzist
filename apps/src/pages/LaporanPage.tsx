import React from 'react';
import DateRangePicker from '../components/laporan/DateRangePicker';
import EmptyState from '../components/ui/EmptyState';

const LaporanPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Laporan Stok</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Riwayat perubahan stok masuk dan keluar.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Filter Tanggal</h2>
        <DateRangePicker />
      </div>

      <EmptyState
        icon="assessment"
        title="Belum ada riwayat"
        description="Log stok akan muncul setelah ada perubahan stok masuk atau keluar."
      />
    </main>
  );
};

export default LaporanPage;
