import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 p-4 bg-surface-container text-on-surface rounded-xl shadow-lg border border-outline/20">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-title-md font-semibold text-primary">Update Tersedia!</h3>
          <p className="text-sm opacity-80 mt-1">
            Versi terbaru aplikasi telah siap. Muat ulang untuk memperbarui.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => close()}
            className="px-4 py-2 text-sm font-medium rounded-full hover:bg-surface-variant transition-colors"
          >
            Nanti
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-on-primary rounded-full shadow hover:bg-primary/90 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReloadPrompt;
