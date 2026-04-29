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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl">
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
        <div className="flex flex-col gap-md">
          {lists.map((list) => {
            const itemCount = list.categories.reduce((acc, cat) => acc + cat.variants.length, 0);
            const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(list.createdAt);

            return (
              <div
                key={list.id}
                onClick={() => navigate(`/restock/${list.id}`)}
                className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">{list.title}</h3>
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
          })}
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
