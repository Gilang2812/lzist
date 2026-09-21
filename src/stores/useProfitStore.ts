import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderItem {
  noPesanan: string;
  namaProduk: string;
  skuInduk: string;
  variasi: string;
  hargaSetelahDiskon: number;
  jumlah: number;
  subtotalBarang: number;
  itemKey: string;
  statusPesanan?: string;
}

export interface OrderGroup {
  noPesanan: string;
  statusPesanan?: string;
  items: OrderItem[];
  totalSubtotalBarang: number;
}

interface ProfitState {
  orders: OrderGroup[];
  masterModal: Record<string, number>;
  overrides: Record<string, number>;
  
  // Platform fees
  adminFeePercent: number;
  serviceFeePercent: number;
  orderFeeAmount: number;
  
  // Marketing fees
  adsFeeAmount: number;
  adsTaxPercent: number; // PPN Iklan
  affiliateFeeAmount: number;
  is_sinkron: boolean;
  
  setOrders: (orders: OrderGroup[]) => void;
  setMasterModal: (itemKey: string, price: number) => void;
  setOverride: (orderId: string, itemKey: string, price: number) => void;
  
  setAdminFeePercent: (val: number) => void;
  setServiceFeePercent: (val: number) => void;
  setOrderFeeAmount: (val: number) => void;
  setAdsFeeAmount: (val: number) => void;
  setAdsTaxPercent: (val: number) => void;
  setAffiliateFeeAmount: (val: number) => void;
  setIsSinkron: (val: boolean) => void;
  
  clearOrders: () => void;
  clearOverrides: () => void;
}

export const useProfitStore = create<ProfitState>()(
  persist(
    (set) => ({
      orders: [],
      masterModal: {},
      overrides: {},
      
      adminFeePercent: 8.25,
      serviceFeePercent: 10,
      orderFeeAmount: 1250,
      adsFeeAmount: 0,
      adsTaxPercent: 11,
      affiliateFeeAmount: 0,
      is_sinkron: false,

      setOrders: (orders) => set({ orders }),
      setMasterModal: (itemKey, price) => 
        set((state) => ({
          masterModal: { ...state.masterModal, [itemKey]: price }
        })),
      setOverride: (orderId, itemKey, price) =>
        set((state) => ({
          overrides: { ...state.overrides, [`${orderId}_${itemKey}`]: price }
        })),
        
      setAdminFeePercent: (val) => set({ adminFeePercent: val }),
      setServiceFeePercent: (val) => set({ serviceFeePercent: val }),
      setOrderFeeAmount: (val) => set({ orderFeeAmount: val }),
      setAdsFeeAmount: (val) => set({ adsFeeAmount: val }),
      setAdsTaxPercent: (val) => set({ adsTaxPercent: val }),
      setAffiliateFeeAmount: (val) => set({ affiliateFeeAmount: val }),
      setIsSinkron: (val) => set({ is_sinkron: val }),
      
      clearOrders: () => set({ orders: [], is_sinkron: false }),
      clearOverrides: () => set({ overrides: {} }),
    }),
    {
      name: 'profit-calculator-storage',
      partialize: (state) => ({ 
        masterModal: state.masterModal,
        adminFeePercent: state.adminFeePercent,
        serviceFeePercent: state.serviceFeePercent,
        orderFeeAmount: state.orderFeeAmount,
        adsTaxPercent: state.adsTaxPercent,
        is_sinkron: state.is_sinkron,
      }), // Persist modal, fee settings, and is_sinkron
    }
  )
);
