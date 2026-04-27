export const APP_NAME = 'Lzist';
export const APP_DESCRIPTION = 'Inventory & Restock Management';

export const ROUTES = {
  DASHBOARD: '/dashboard',
  RESTOCK_LIST: '/restock',
  RESTOCK_DETAIL: '/restock/:id',
  KATALOG: '/katalog',
  BARANG_DETAIL: '/katalog/:id',
  SUPPLIER_LIST: '/supplier',
  SUPPLIER_DETAIL: '/supplier/:id',
  LAPORAN: '/laporan',
} as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: ROUTES.DASHBOARD },
  { label: 'Restock', icon: 'inventory_2', path: ROUTES.RESTOCK_LIST },
  { label: 'Katalog', icon: 'menu_book', path: ROUTES.KATALOG },
  { label: 'Supplier', icon: 'local_shipping', path: ROUTES.SUPPLIER_LIST },
  { label: 'Laporan', icon: 'assessment', path: ROUTES.LAPORAN },
] as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;
