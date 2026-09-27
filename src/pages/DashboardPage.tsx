import React, { useEffect, useState, useCallback } from 'react';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import Skeleton from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppModeStore } from '../stores/useAppModeStore';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../db/supabase';

interface DashboardStats {
  barangs: number;
  totalVariants: number;
  lowStock: number;
  suppliers: number;
  recentRestocks: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string | Date;
  }>;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode } = useAppModeStore();
  const { user } = useAuthStore();

  const [onlineStats, setOnlineStats] = useState<DashboardStats | undefined>(undefined);

  // Offline stats via Dexie useLiveQuery
  const offlineStats = useLiveQuery(async () => {
    if (mode === 'online') return undefined;

    const [barangs, subBarangs, suppliers, restockLists] = await Promise.all([
      db.barang.count(),
      db.subBarang.toArray(),
      db.suppliers.count(),
      db.restockLists.orderBy('createdAt').reverse().limit(3).toArray(),
    ]);

    const totalVariants = subBarangs.length;
    const lowStock = subBarangs.filter(v => v.stock === 0).length;

    const recentRestocks = restockLists.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      updatedAt: r.updatedAt,
    }));

    return { barangs, totalVariants, lowStock, suppliers, recentRestocks };
  }, [mode]);

  // Online stats via Supabase Live query
  const fetchOnlineStats = useCallback(async () => {
    if (!user) {
      setOnlineStats({
        barangs: 0,
        totalVariants: 0,
        lowStock: 0,
        suppliers: 0,
        recentRestocks: [],
      });
      return;
    }

    try {
      const [productsRes, restocksRes] = await Promise.all([
        supabase
          .from('product')
          .select(`
            product_code,
            product_color (
              stok
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('restock')
          .select('restock_id, title, tanggal, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const products = productsRes.data || [];
      const totalBarangs = products.length;

      let totalVariants = 0;
      let lowStock = 0;

      for (const prod of products) {
        const pColors = prod.product_color || [];
        totalVariants += pColors.length;
        lowStock += pColors.filter((pc: any) => (pc.stok || 0) <= 0).length;
      }

      const recentRestocks = (restocksRes.data || []).map((r: any) => ({
        id: r.restock_id,
        title: r.title || `Restock ${r.tanggal || ''}`,
        status: 'completed',
        updatedAt: r.updated_at || r.created_at,
      }));

      setOnlineStats({
        barangs: totalBarangs,
        totalVariants,
        lowStock,
        suppliers: 0,
        recentRestocks,
      });
    } catch (err) {
      console.error('Failed to fetch online stats:', err);
      setOnlineStats({
        barangs: 0,
        totalVariants: 0,
        lowStock: 0,
        suppliers: 0,
        recentRestocks: [],
      });
    }
  }, [user]);

  useEffect(() => {
    if (mode === 'online') {
      fetchOnlineStats();
    }
  }, [mode, fetchOnlineStats]);

  const stats = mode === 'online' ? onlineStats : offlineStats;

  const activityItems = (stats?.recentRestocks ?? []).map(r => ({
    id: r.id,
    icon: r.status === 'completed' ? 'check_circle' : r.status === 'finalized' ? 'inventory' : 'edit_note',
    text: `Restock "${r.title}" — ${r.status === 'completed' ? 'Selesai' : r.status === 'finalized' ? 'Difinalisasi' : 'Draft'}`,
    time: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(r.updatedAt)),
  }));

  return (
    <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-xs">
            <h1 className="font-h1 text-h1 text-on-surface">Dashboard</h1>
            {mode === 'online' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                Online (Server)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-surface-variant">
                <span className="material-symbols-outlined text-[14px]">cloud_off</span>
                Offline Lokal
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {mode === 'online'
              ? 'Ringkasan inventaris real-time dari database server.'
              : 'Ringkasan inventaris tersimpan di perangkat lokal.'}
          </p>
        </div>
      </div>

      {stats === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          <StatCard icon="inventory_2" label="Total Barang" value={stats.barangs} />
          <StatCard icon="style" label="Total Varian" value={stats.totalVariants} />
          <StatCard
            icon="warning"
            label="Stok Habis"
            value={stats.lowStock}
            trend={stats.lowStock > 0 ? { value: String(stats.lowStock), positive: false } : undefined}
          />
          <StatCard icon="local_shipping" label="Supplier" value={stats.suppliers} />
        </div>
      )}

      <QuickActions
        actions={[
          { icon: 'add_shopping_cart', label: 'Buat Restock', onClick: () => navigate(ROUTES.RESTOCK.NEW) },
          { icon: 'add_circle', label: 'Tambah Barang', onClick: () => navigate(ROUTES.KATALOG.TAMBAH) },
          { icon: 'local_shipping', label: 'Supplier', onClick: () => navigate(ROUTES.SUPPLIER.INDEX) },
        ]}
      />

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg">
        <h2 className="font-h3 text-h3 text-on-surface mb-md">Restock Terakhir</h2>
        {stats === undefined ? (
          <Skeleton className="h-12 w-full" count={3} />
        ) : activityItems.length > 0 ? (
          <ActivityFeed items={activityItems} />
        ) : (
          <p className="text-body-sm text-on-surface-variant text-center py-md">Belum ada restock yang disimpan.</p>
        )}
      </div>
    </main>
  );
};

export default DashboardPage;
