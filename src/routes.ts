/**
 * Sentralisasi seluruh path dan helper route dalam aplikasi.
 * Mendukung akses hierarkis (contoh: ROUTES.RESTOCK.NEW, ROUTES.RESTOCK.detail(id))
 * serta alias datar (contoh: ROUTES.DASHBOARD, ROUTES.LOGIN).
 */

export const ROUTES = {
  // Static root & auth routes
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',

  // Restock routes
  RESTOCK: {
    INDEX: '/restock',
    NEW: '/restock/new',
    DETAIL: '/restock/:id',
    detail: (id: string | number) => `/restock/${id}`,
  },
  RESTOCK_LIST: '/restock',
  RESTOCK_NEW: '/restock/new',
  RESTOCK_DETAIL: '/restock/:id',

  // Katalog routes (offline & online standard)
  KATALOG: {
    INDEX: '/katalog',
    TAMBAH: '/katalog/tambah',
    EDIT: '/katalog/edit/:id',
    DETAIL: '/katalog/:id',
    detail: (id: string | number) => `/katalog/${id}`,
    edit: (id: string | number) => `/katalog/edit/${id}`,
  },
  KATALOG_INDEX: '/katalog',
  KATALOG_TAMBAH: '/katalog/tambah',
  KATALOG_EDIT: '/katalog/edit/:id',
  BARANG_DETAIL: '/katalog/:id',

  // Katalog Baru routes (online Supabase mode)
  KATALOG_BARU: {
    INDEX: '/katalog-baru',
    EDIT: '/katalog-baru/edit/:id',
    edit: (id: string | number) => `/katalog-baru/edit/${id}`,
  },
  KATALOG_BARU_INDEX: '/katalog-baru',
  KATALOG_BARU_EDIT: '/katalog-baru/edit/:id',

  // Supplier routes
  SUPPLIER: {
    INDEX: '/supplier',
    DETAIL: '/supplier/:id',
    detail: (id: string | number) => `/supplier/${id}`,
  },
  SUPPLIER_LIST: '/supplier',
  SUPPLIER_DETAIL: '/supplier/:id',

  // Profit routes
  PROFIT: {
    HISTORY: '/profit-history',
    CALCULATOR: '/profit-calculator/:id',
    CALCULATOR_NEW: '/profit-calculator/new',
    calculator: (id: string | number = 'new') => `/profit-calculator/${id}`,
  },
  PROFIT_HISTORY: '/profit-history',
  PROFIT_CALCULATOR_ID: '/profit-calculator/:id',
  PROFIT_CALCULATOR_NEW: '/profit-calculator/new',

  // Profile routes
  PROFILE: {
    INDEX: '/profile',
    PASSWORD: '/profile/password',
  },
  PROFILE_INDEX: '/profile',
  PROFILE_PASSWORD: '/profile/password',
} as const;

export default ROUTES;
