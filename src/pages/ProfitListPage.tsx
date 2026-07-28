import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { formatRupiah } from '../utils/formatCurrency';

const ProfitListPage: React.FC = () => {
  const navigate = useNavigate();
  const profitHistories = useLiveQuery(() => db.profitHistories.orderBy('createdAt').reverse().toArray());

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan profit ini?')) {
      await db.profitHistories.delete(id);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-inter">Profit History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Riwayat perhitungan profit Anda.</p>
        </div>
        <button
          onClick={() => navigate('/profit-calculator/new')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Hitung Profit Baru
        </button>
      </div>

      {!profitHistories ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : profitHistories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4 text-teal-500">
            <span className="material-symbols-outlined text-3xl">history</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum Ada Riwayat</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-ms mb-6">Mulai perhitungan profit baru untuk melacak keuntungan penjualan Anda.</p>
          <button
            onClick={() => navigate('/profit-calculator/new')}
            className="bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Mulai Hitung Profit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profitHistories.map((history) => {
            const totalOrders = history.orders.length;
            
            // Calculate a quick overview
            let tPenghasilan = 0;
            let tModal = 0;
            history.orders.forEach(order => {
              tPenghasilan += order.totalSubtotalBarang;
              order.items.forEach(item => {
                const modal = history.overrides[`${order.noPesanan}_${item.itemKey}`] ?? history.masterModal[item.namaProduk] ?? 0;
                tModal += modal * item.jumlah;
              });
            });

            const totalPlatformFee = history.orders.length > 0 
                ? history.orders.reduce((acc, order) => {
                  const p = order.totalSubtotalBarang;
                  return acc + (p * history.adminFeePercent / 100) + (p * history.serviceFeePercent / 100) + history.orderFeeAmount;
                }, 0)
                : 0;
            
            const omset = tPenghasilan - totalPlatformFee;
            const finalAdsFee = history.adsFeeAmount + (history.adsFeeAmount * history.adsTaxPercent / 100);
            const untungBersih = (tPenghasilan - tModal) - totalPlatformFee - (finalAdsFee + history.affiliateFeeAmount);

            return (
              <div 
                key={history.id}
                onClick={() => navigate(`/profit-calculator/${history.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => handleDelete(history.id, e)}
                    className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-sm block">delete</span>
                  </button>
                </div>

                <div className="flex items-start gap-3 mb-4 pr-8">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                    <span className="material-symbols-outlined">calculate</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {history.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {history.startDate.day}/{history.startDate.month}/{history.startDate.year} - {history.endDate.day}/{history.endDate.month}/{history.endDate.year}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Pesanan</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
                    <span className="text-gray-500 text-xs">Omset</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatRupiah(omset)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-teal-50 dark:bg-teal-900/20 p-2 rounded">
                    <span className="text-teal-700 dark:text-teal-300 text-xs">Untung Bersih</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">{formatRupiah(untungBersih)}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-[10px] text-gray-400 flex justify-between items-center">
                  <span>Dibuat: {new Date(history.createdAt).toLocaleDateString('id-ID')}</span>
                  <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-teal-500">arrow_forward</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfitListPage;
