import { ROUTES } from '../routes';

export { ROUTES };
export const APP_NAME = 'Lzist';
export const APP_DESCRIPTION = 'Inventory & Restock Management';

export const OFFLINE_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: ROUTES.DASHBOARD },
  { label: 'Restock', icon: 'inventory_2', path: ROUTES.RESTOCK.INDEX },
  { label: 'Katalog', icon: 'book_2', path: ROUTES.KATALOG.INDEX },
  { label: 'Supplier', icon: 'local_shipping', path: ROUTES.SUPPLIER.INDEX },
  { label: 'Profit History', icon: 'history', path: ROUTES.PROFIT.HISTORY },
] as const;

export const ONLINE_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: ROUTES.DASHBOARD },
  { label: 'Restock', icon: 'inventory_2', path: ROUTES.RESTOCK.INDEX },
  { label: 'Katalog', icon: 'book_2', path: ROUTES.KATALOG.INDEX },
  { label: 'Supplier', icon: 'local_shipping', path: ROUTES.SUPPLIER.INDEX },
  { label: 'Profit History', icon: 'history', path: ROUTES.PROFIT.HISTORY },
] as const;

export const NAV_ITEMS = OFFLINE_NAV_ITEMS;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;
