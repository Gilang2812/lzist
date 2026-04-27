import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Dashboard</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Ringkasan inventaris kamu.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        <StatCard icon="inventory_2" label="Total Barang" value={24} />
        <StatCard icon="category" label="Kategori" value={6} />
        <StatCard icon="warning" label="Stok Rendah" value={3} trend={{ value: '2', positive: false }} />
        <StatCard icon="local_shipping" label="Supplier" value={5} />
      </div>

      <QuickActions
        actions={[
          { icon: 'add_shopping_cart', label: 'Buat Restock', onClick: () => navigate(ROUTES.RESTOCK_LIST) },
          { icon: 'add_circle', label: 'Tambah Barang', onClick: () => navigate(ROUTES.KATALOG) },
          { icon: 'assessment', label: 'Lihat Laporan', onClick: () => navigate(ROUTES.LAPORAN) },
        ]}
      />

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Aktivitas Terakhir</h2>
        <ActivityFeed
          items={[
            { id: '1', icon: 'add', text: 'Stok masuk: Jilbab Merah +10', time: '2 jam lalu' },
            { id: '2', icon: 'remove', text: 'Stok keluar: Karton Kecil -5', time: '5 jam lalu' },
            { id: '3', icon: 'check_circle', text: 'Restock list "Belanja Minggu Ini" selesai', time: 'Kemarin' },
          ]}
        />
      </div>
    </main>
  );
};

export default DashboardPage;
