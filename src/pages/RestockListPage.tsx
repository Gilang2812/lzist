import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { db } from '../db/database';
import type { RestockList } from '../types';

const RestockListPage: React.FC = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<RestockList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listToDelete, setListToDelete] = useState<RestockList | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const data = await db.restockLists.toArray();
        data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setLists(data);
      } catch (error) {
        console.error("Failed to fetch restock lists:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLists();
  }, []);

  const handleDelete = async () => {
    if (!listToDelete) return;
    try {
      await db.restockLists.delete(listToDelete.id);
      setLists(prev => prev.filter(l => l.id !== listToDelete.id));
    } catch (error) {
      console.error("Failed to delete list:", error);
    } finally {
      setListToDelete(null);
    }
  };

  const statusStyles = {
    draft: 'bg-tertiary-container text-on-tertiary-container',
    finalized: 'bg-primary-container text-on-primary-container',
    completed: 'bg-surface-container text-on-surface-variant',
  };

  const statusLabels = {
    draft: 'Draft',
    finalized: 'Finalized',
    completed: 'Selesai',
  };

  return (
    <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Restock List</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola daftar belanja restock.</p>
        </div>
        <button 
          onClick={() => navigate('/restock/new')}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-xl">
          <p className="text-on-surface-variant">Memuat data...</p>
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          icon="playlist_add"
          title="Belum ada restock list"
          description="Buat restock list pertama kamu untuk mulai mengelola belanja."
        />
      ) : (
        <div className="flex flex-col gap-lg">
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

              return (
                <div
                  key={list.id}
                  onClick={() => navigate(`/restock/${list.id}`)}
                  className={`rounded-xl p-lg cursor-pointer hover:shadow-md transition-all flex items-center justify-between ${
                    today
                      ? 'bg-primary-container/40 border-l-4 border-primary border-r border-t border-b border-r-primary/20 border-t-primary/20 border-b-primary/20 hover:border-r-primary/40 hover:border-t-primary/40 hover:border-b-primary/40'
                      : 'bg-surface-container-lowest border border-surface-variant hover:border-primary-fixed-dim'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-sm">
                      <h3 className="font-h3 text-h3 text-on-surface">{list.title}</h3>
                      {today && (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-sm py-[2px] rounded-full uppercase tracking-wide">
                          Hari ini
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      {itemCount} item · {dateStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className={`px-md py-xs rounded-full font-label-md text-label-md ${statusStyles[list.status]}`}>
                      {statusLabels[list.status]}
                    </span>
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
                    <div key={dateKey} className="flex flex-col gap-md mb-lg last:mb-0">
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
    </main>
  );
};

export default RestockListPage;
