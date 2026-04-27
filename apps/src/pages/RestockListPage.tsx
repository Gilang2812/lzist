import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';

const RestockListPage: React.FC = () => {
  const navigate = useNavigate();

  // Demo data — will be replaced with store data
  const lists = [
    { id: 'r1', title: 'Belanja Minggu Ini', status: 'draft' as const, itemCount: 6, date: '20 Apr 2026' },
    { id: 'r2', title: 'Restock Bulanan', status: 'completed' as const, itemCount: 12, date: '15 Apr 2026' },
  ];

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
        <button className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Baru
        </button>
      </div>

      {lists.length === 0 ? (
        <EmptyState
          icon="playlist_add"
          title="Belum ada restock list"
          description="Buat restock list pertama kamu untuk mulai mengelola belanja."
        />
      ) : (
        <div className="flex flex-col gap-md">
          {lists.map((list) => (
            <div
              key={list.id}
              onClick={() => navigate(`/restock/${list.id}`)}
              className="bg-surface-container-lowest rounded-xl border border-surface-variant p-lg cursor-pointer hover:shadow-md hover:border-primary-fixed-dim transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-h3 text-h3 text-on-surface">{list.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  {list.itemCount} item · {list.date}
                </p>
              </div>
              <span className={`px-md py-xs rounded-full font-label-md text-label-md ${statusStyles[list.status]}`}>
                {statusLabels[list.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default RestockListPage;
