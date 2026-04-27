import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import RestockListPage from './pages/RestockListPage';
import RestockDetailPage from './pages/RestockDetailPage';
import NewRestockEntryPage from './pages/NewRestockEntryPage';
import KatalogPage from './pages/KatalogPage';
import BarangDetailPage from './pages/BarangDetailPage';
import SupplierListPage from './pages/SupplierListPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import LaporanPage from './pages/LaporanPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/restock" element={<RestockListPage />} />
          <Route path="/restock/new" element={<NewRestockEntryPage />} />
          <Route path="/restock/:id" element={<RestockDetailPage />} />
          <Route path="/katalog" element={<KatalogPage />} />
          <Route path="/katalog/:id" element={<BarangDetailPage />} />
          <Route path="/supplier" element={<SupplierListPage />} />
          <Route path="/supplier/:id" element={<SupplierDetailPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
