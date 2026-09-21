import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RestockListPage from './pages/RestockListPage';
import RestockDetailPage from './pages/RestockDetailPage';
import NewRestockEntryPage from './pages/NewRestockEntryPage';
import KatalogPage from './pages/KatalogPage';
import EditKatalogBaruPage from './pages/EditKatalogBaruPage';
import BarangDetailPage from './pages/BarangDetailPage';
import SupplierListPage from './pages/SupplierListPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import ProfitCalculatorPage from './pages/ProfitCalculatorPage';
import ProfitListPage from './pages/ProfitListPage';
import EditKatalogPage from './pages/EditKatalogPage';
import TambahKatalogPage from './pages/TambahKatalogPage';
import { initDb } from './utils/initDb';
import { SyncEngine } from './db/syncEngine';
import { useAuthStore } from './stores/useAuthStore';
import { useAppModeStore } from './stores/useAppModeStore';
import ProfilePage from './pages/ProfilePage';
import ProfilePasswordPage from './pages/ProfilePasswordPage';
import { ROUTES } from './routes';

function App() {
  const { initAuth } = useAuthStore();
  const { mode } = useAppModeStore();

  useEffect(() => {
    // Inisialisasi Database IndexedDB Lokal
    initDb();

    // Inisialisasi Autentikasi Supabase & Sync jika di mode Online
    if (mode === 'online') {
      initAuth();
      SyncEngine.pull();
      SyncEngine.push();
    }

    // Jika internet putus lalu nyambung lagi saat mode Online, otomatis trigger sync
    const handleOnline = () => {
      if (useAppModeStore.getState().mode === 'online') {
        SyncEngine.push();
        SyncEngine.pull();
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [initAuth, mode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected / App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.RESTOCK.INDEX} element={<RestockListPage />} />
            <Route path={ROUTES.RESTOCK.NEW} element={<NewRestockEntryPage />} />
            <Route path={ROUTES.RESTOCK.DETAIL} element={<RestockDetailPage />} />
            <Route path={ROUTES.KATALOG.INDEX} element={<KatalogPage />} />
            <Route path={ROUTES.KATALOG_BARU.INDEX} element={<Navigate to={ROUTES.KATALOG.INDEX} replace />} />
            <Route path={ROUTES.KATALOG_BARU.EDIT} element={<EditKatalogBaruPage />} />
            <Route path={ROUTES.KATALOG.TAMBAH} element={<TambahKatalogPage />} />
            <Route path={ROUTES.KATALOG.EDIT} element={<EditKatalogPage />} />
            <Route path={ROUTES.KATALOG.DETAIL} element={<BarangDetailPage />} />
            <Route path={ROUTES.SUPPLIER.INDEX} element={<SupplierListPage />} />
            <Route path={ROUTES.SUPPLIER.DETAIL} element={<SupplierDetailPage />} />
            <Route path={ROUTES.PROFIT.HISTORY} element={<ProfitListPage />} />
            <Route path={ROUTES.PROFIT.CALCULATOR} element={<ProfitCalculatorPage />} />
            <Route path={ROUTES.PROFILE.INDEX} element={<ProfilePage />} />
            <Route path={ROUTES.PROFILE.PASSWORD} element={<ProfilePasswordPage />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
