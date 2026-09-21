import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { db } from '../db/database';
import type { RestockList } from '../types';
import { formatRupiah } from '../utils/formatCurrency';
import Toast from '../components/ui/Toast';
import Skeleton from '../components/ui/Skeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../stores/useAuthStore';
import { useAppModeStore } from '../stores/useAppModeStore';
import { ROUTES } from '../routes';

const RestockListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { mode } = useAppModeStore();
  const [lists, setLists] = useState<RestockList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listToDelete, setListToDelete] = useState<RestockList | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (message: string, type: 'info' | 'success' | 'error') => {
    setToast({ message, type });
    if (type !== 'info') {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      if (mode === 'online' && user?.id) {
        const { pullRestockFromSupabase } = await import('../utils/syncRestock');
        await pullRestockFromSupabase(user.id);
      }
      const data = await db.restockLists.toArray();
      // Filter lists belonging to the logged-in user in online mode, or all in offline mode
      const userLists = (mode === 'online' && user)
        ? data.filter(l => l.userId === user.id)
        : data;
      userLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setLists(userLists);
    } catch (error) {
      console.error('Failed to fetch restock lists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, mode]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleDelete = async () => {
    if (!listToDelete) return;
    try {
      // Delete locally
      await db.restockLists.delete(listToDelete.id);
      
      // Delete in Supabase only if in online mode
      if (mode === 'online') {
        const { supabase } = await import('../db/supabase');
        await supabase.from('restock').delete().eq('restock_id', listToDelete.id);
      }

      setLists(prev => prev.filter(l => l.id !== listToDelete.id));
    } catch (error) {
      console.error("Failed to delete list:", error);
    } finally {
      setListToDelete(null);
    }
  };

  // Draft means the local version still needs to be saved to the database.
  // Any local edit flow should set status back to 'draft' before persisting the list.
  const statusStyles = {
    draft: 'bg-error-container text-on-error-container',
    finalized: 'bg-primary-container text-on-primary-container',
    completed: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-xs">
            <h1 className="font-medium text-h1 text-on-surface">Restock List</h1>
            {mode === 'online' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                Online Supabase
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-surface-variant">
                <span className="material-symbols-outlined text-[14px]">cloud_off</span>
                Offline Lokal
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola daftar belanja restock.</p>
        </div>
        <div className="flex items-center gap-sm">
          {mode === 'online' && (
            <button 
              onClick={async () => {
                setIsSyncing(true);
                setToast({ message: 'Sedang menarik data dari Supabase...', type: 'info' });
                try {
                  const { pullRestockFromSupabase } = await import('../utils/syncRestock');
                  const res = await pullRestockFromSupabase(user?.id);
                  if (res.success) {
                    showToast(`Berhasil menarik ${res.count} daftar restock dari Supabase!`, 'success');
                    fetchLists(); // reload UI
                  } else {
                    showToast('Gagal menarik data: ' + res.error, 'error');
                  }
                } catch (err: any) {
                  showToast('Gagal menarik data: ' + err.message, 'error');
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="bg-surface-container-high text-primary px-md py-sm rounded-lg font-label-md hover:bg-surface-container-highest transition-colors flex items-center gap-xs cursor-pointer border border-surface-variant disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_download</span>
              Sync Data
            </button>
          )}
          <button 
            onClick={() => navigate(ROUTES.RESTOCK.NEW)}
            className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Buat Baru
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" count={4} />
      ) : lists.length === 0 ? (
        <EmptyState
          icon="playlist_add"
          title="Belum ada restock list"
          description="Buat restock list pertama kamu untuk mulai mengelola belanja."
        />
      ) : (
        <div className="flex flex-col gap-xs">
          {(() => {
            const groupedLists = lists.reduce((acc, list) => {
              const d = list.createdAt;
              const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push(list);
              return acc;
            }, {} as Record<string, RestockList[]>);

            const sortedDateKeys = Object.keys(groupedLists).sort((a, b) => b.localeCompare(a));
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const renderCard = (list: RestockList, today: boolean) => {
              const itemCount = list.categories.reduce((acc, cat) => acc + cat.variants.length, 0);
              const dateStr = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(list.createdAt);
              
              const uncheckedTotal = list.categories.reduce((acc, cat) => {
                return acc + cat.variants.reduce((vAcc, v) => {
                  if (!v.checked) {
                    return vAcc + (cat.price || 0) * (v.targetQuantity || 0);
                  }
                  return vAcc;
                }, 0);
              }, 0);

              return (
                <div
                  key={list.id}
                  onClick={() => navigate(ROUTES.RESTOCK.detail(list.id))}
                  className={`rounded-xl p-md cursor-pointer hover:shadow-md transition-all flex items-center justify-between ${
                    today
                      ? 'bg-primary-container/40 border-l-4 border-primary border-r border-t border-b border-r-primary/20 border-t-primary/20 border-b-primary/20 hover:border-r-primary/40 hover:border-t-primary/40 hover:border-b-primary/40'
                      : 'bg-surface-container-lowest border border-surface-variant hover:border-primary-fixed-dim'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-xs">
                      <h3 className="font-medium text-md text-on-surface">{list.title}</h3>
                      {today && (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-sm py-[2px] rounded-full uppercase tracking-wide">
                          Hari ini
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs flex-wrap">
                      <span>{itemCount} item</span>
                      <span>·</span>
                      <span>{dateStr}</span>
                      {uncheckedTotal > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-medium">Dana Belum Diceklis: {formatRupiah(uncheckedTotal)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-md">
                    <span
                      className={`${
                        list.status === 'finalized'
                          ? 'text-primary'
                          : `px-md py-xs rounded-full font-label-md text-label-md ${statusStyles[list.status]}`
                      }`}
                      title={list.status === 'finalized' ? 'Finalized' : list.status === 'draft' ? 'Draft' : 'Selesai'}
                    >
                      {list.status === 'finalized' ? (
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                      ) : (
                        list.status === 'draft' ? 'Draft' : 'Selesai'
                      )}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dataToExport = {
                          categories: list.categories,
                          importedFiles: list.importedFiles || [],
                          importHistory: list.importHistory || []
                        };
                        const jsonString = JSON.stringify(dataToExport, null, 2);
                        const blob = new Blob([jsonString], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `restock_backup_${list.id}_${new Date().toISOString().slice(0, 10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-xs text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-full transition-colors flex items-center justify-center cursor-pointer"
                      title="Export TXT"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        import('../utils/syncRestock').then(async ({ syncRestockToSupabase }) => {
                          setToast({ message: 'Sedang menyimpan ke Supabase...', type: 'info' });
                          const res = await syncRestockToSupabase(list, user?.id);
                          if (res.success) {
                            showToast('Berhasil disimpan ke Supabase!', 'success');
                            fetchLists();
                          } else {
                            showToast('Gagal menyimpan: ' + res.error, 'error');
                          }
                        });
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        list.status === 'draft'
                          ? 'bg-primary text-on-primary hover:bg-surface-tint'
                          : 'text-primary hover:bg-primary-container'
                      }`}
                      title="Save"
                    >
                      <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setListToDelete(list);
                      }}
                      className="p-xs text-on-surface-variant hover:text-error hover:bg-error-container rounded-full transition-colors flex items-center justify-center cursor-pointer"
                      title="Hapus Daftar"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <>
                {sortedDateKeys.map(dateKey => {
                  const dateLists = groupedLists[dateKey];
                  const isToday = dateKey === todayKey;
                  
                  let headerText = '';
                  let icon = '';
                  let iconColor = '';
                  
                  if (isToday) {
                    headerText = 'Hari Ini';
                    icon = 'today';
                    iconColor = 'text-primary';
                  } else {
                    const d = new Date(dateKey);
                    headerText = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
                    icon = 'calendar_month';
                    iconColor = 'text-on-surface-variant';
                  }

                  return (
                    <div key={dateKey} className="flex flex-col gap-xs mb-xs last:mb-0">
                      <div className="flex items-center gap-sm">
                        <span className={`material-symbols-outlined ${iconColor} text-[20px]`}>{icon}</span>
                        <h2 className={`font-label-lg text-label-lg ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{headerText}</h2>
                      </div>
                      {dateLists.map(l => renderCard(l, isToday))}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!listToDelete}
        title="Hapus Restock List"
        message={`Apakah kamu yakin ingin menghapus list "${listToDelete?.title}"? Semua data di dalamnya akan hilang.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onCancel={() => setListToDelete(null)}
        variant="danger"
      />

      <LoadingSpinner isOpen={isSyncing} title="Menarik data dari Supabase..." message="Harap tunggu sebentar." />
    </main>
  );
};

export default RestockListPage;
