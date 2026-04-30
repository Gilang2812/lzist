import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const stats = useLiveQuery(async () => {
    const [barangs, subBarangs, suppliers, restockLists] = await Promise.all([
      db.barang.count(),
      db.subBarang.toArray(),
      db.suppliers.count(),
      db.restockLists.orderBy('createdAt').reverse().limit(3).toArray(),
    ]);

    const totalVariants = subBarangs.length;
    const lowStock = subBarangs.filter(v => v.stock === 0).length;

    return { barangs, totalVariants, lowStock, suppliers, restockLists };
  });

  const activityItems = (stats?.restockLists ?? []).map(r => ({
    id: r.id,
    icon: r.status === 'completed' ? 'check_circle' : r.status === 'finalized' ? 'inventory' : 'edit_note',
    text: `Restock "${r.title}" — ${r.status === 'completed' ? 'Selesai' : r.status === 'finalized' ? 'Difinalisasi' : 'Draft'}`,
    time: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(r.updatedAt)),
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div>
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Dashboard</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Ringkasan inventaris kamu.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        <StatCard icon="inventory_2" label="Total Barang" value={stats?.barangs ?? 0} />
        <StatCard icon="style" label="Total Varian" value={stats?.totalVariants ?? 0} />
        <StatCard
          icon="warning"
          label="Stok Habis"
          value={stats?.lowStock ?? 0}
          trend={stats && stats.lowStock > 0 ? { value: String(stats.lowStock), positive: false } : undefined}
        />
        <StatCard icon="local_shipping" label="Supplier" value={stats?.suppliers ?? 0} />
      </div>

      <QuickActions
        actions={[
          { icon: 'add_shopping_cart', label: 'Buat Restock', onClick: () => navigate(ROUTES.RESTOCK_LIST) },
          { icon: 'add_circle', label: 'Tambah Barang', onClick: () => navigate(ROUTES.KATALOG) },
          { icon: 'local_shipping', label: 'Supplier', onClick: () => navigate(ROUTES.SUPPLIER_LIST) },
        ]}
      />

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Restock Terakhir</h2>
        {activityItems.length > 0 ? (
          <ActivityFeed items={activityItems} />
        ) : (
          <p className="text-body-sm text-on-surface-variant text-center py-md">Belum ada restock yang disimpan.</p>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
