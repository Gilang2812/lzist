import React, { useState } from 'react';
import { useAuthStore, type SavedAccount } from '../../stores/useAuthStore';
import AddAccountModal from './AddAccountModal';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
onClose,
}) => {
  const {
    user,
    savedAccounts,
    switchAccount,
    removeSavedAccount,
    logoutCurrent,
    logoutAll,
    isSwitching,
  } = useAuthStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUserId = user?.id;

  const handleSwitch = async (acc: SavedAccount) => {
    if (acc.id === currentUserId) return;
    setErrorMessage(null);
    setSwitchingId(acc.id);
    const { error } = await switchAccount(acc.id);
    setSwitchingId(null);
    if (!error) {
      onClose();
    } else {
      setErrorMessage(error.message);
    }
  };

  const handleRemove = async (accId: string) => {
    setConfirmDeleteId(null);
    await removeSavedAccount(accId);
    if (savedAccounts.length <= 1) {
      onClose();
    }
  };

  const handleLogoutCurrent = async () => {
    onClose();
    await logoutCurrent();
  };

  const handleLogoutAll = async () => {
    setConfirmLogoutAll(false);
    onClose();
    await logoutAll();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-2xl max-w-dm w-full p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">switch_account</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Kelola Akun</h3>
                <p className="text-xs text-on-surface-variant">Beralih cepat antar akun yang tersimpan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 shrink-0">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Accounts List */}
          <div className="my-4 space-y-2 overflow-y-auto pr-1 grow">
            {savedAccounts.map((acc) => {
              const isCurrent = acc.id === currentUserId;
              const isCurrentSwitching = switchingId === acc.id || (isSwitching && switchingId === acc.id);

              return (
                <div
                  key={acc.id}
                  onClick={() => !isCurrent && !isCurrentSwitching && handleSwitch(acc)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${isCurrent
                      ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700/60 shadow-xs'
                      : 'bg-surface-container-low/60 hover:bg-surface-container hover:border-outline-variant border-outline-variant/30 cursor-pointer'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0 overflow-hidden border border-teal-200 dark:border-teal-800">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-teal-600 text-lg">person</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface truncate">{acc.fullName}</p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-600 text-white rounded-full shrink-0">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{acc.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isCurrentSwitching ? (
                      <span className="material-symbols-outlined text-teal-600 animate-spin text-xl">
                        progress_activity
                      </span>
                    ) : isCurrent ? (
                      <span className="material-symbols-outlined text-teal-600 text-xl font-bold">
                        check_circle
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSwitch(acc)}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors cursor-pointer"
                        >
                          Pilih
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(acc.id)}
                          className="p-1.5 text-on-surface-variant/50 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Hapus sesi dari perangkat ini"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-outline-variant/30 space-y-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-teal-500/60 hover:border-teal-600 bg-teal-50/40 hover:bg-teal-50/80 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ Tambah Akun Lain</span>
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleLogoutCurrent}
                className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer py-1"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Keluar dari Akun Ini</span>
              </button>

              {savedAccounts.length > 1 && (
                <button
                  onClick={() => setConfirmLogoutAll(true)}
                  className="text-xs font-medium text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer py-1"
                >
                  Keluar Semua Akun
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Single Account Modal Confirmation */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-on-surface/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 max-w-xs w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-on-surface">Hapus Sesi Akun?</h4>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Sesi akun ini akan dihapus dari perangkat. Anda perlu login kembali jika ingin menggunakannya lagi.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleRemove(confirmDeleteId)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Accounts Modal Confirmation */}
      {confirmLogoutAll && (
        <div
          className="fixed inset-0 bg-on-surface/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setConfirmLogoutAll(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 max-w-xs w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-on-surface">Keluar dari Semua Akun?</h4>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Seluruh sesi akun ({savedAccounts.length} akun) akan dikeluarkan dari perangkat ini.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmLogoutAll(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-on-surface hover:bg-surface-variant cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogoutAll}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Keluar Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          onClose();
        }}
      />
    </>
  );
};

export default AccountSwitcherModal;
