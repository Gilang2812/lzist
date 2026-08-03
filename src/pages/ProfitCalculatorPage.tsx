import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useProfitStore } from '../stores/useProfitStore';
import type { OrderGroup, OrderItem } from '../stores/useProfitStore';
import { parseIndonesianNumber } from '../utils/numberParser';
import { db } from '../db/database';
import type { ProfitHistory } from '../types';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
};

const AUTOSAVE_DEBOUNCE_MS = 1500;

const ProfitCalculatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { 
    orders, masterModal, overrides, 
    setOrders, setMasterModal, setOverride, clearOrders, clearOverrides,
    adminFeePercent, serviceFeePercent, orderFeeAmount, adsFeeAmount, adsTaxPercent, affiliateFeeAmount,
    setAdminFeePercent, setServiceFeePercent, setOrderFeeAmount, setAdsFeeAmount, setAdsTaxPercent, setAffiliateFeeAmount
  } = useProfitStore();
  
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [uploadValidationModal, setUploadValidationModal] = useState<{isOpen: boolean, data: OrderGroup[] | null}>({isOpen: false, data: null});

  const today = new Date();
  const [startDate, setStartDate] = useState({
    day: today.getDate().toString().padStart(2, '0'),
    month: (today.getMonth() + 1).toString().padStart(2, '0'),
    year: today.getFullYear().toString(),
  });
  const [endDate, setEndDate] = useState({
    day: today.getDate().toString().padStart(2, '0'),
    month: (today.getMonth() + 1).toString().padStart(2, '0'),
    year: today.getFullYear().toString(),
  });

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const currentIdRef = useRef<string | null>(id === 'new' ? null : id || null);

  // Load existing data if ID is provided
  useEffect(() => {
    const loadData = async () => {
      if (id && id !== 'new') {
        try {
          const history = await db.profitHistories.get(id);
          if (history) {
            setTitle(history.title);
            setStartDate(history.startDate);
            setEndDate(history.endDate);
            setOrders(history.orders);
            useProfitStore.setState({
              masterModal: history.masterModal,
              overrides: history.overrides,
              adminFeePercent: history.adminFeePercent,
              serviceFeePercent: history.serviceFeePercent,
              orderFeeAmount: history.orderFeeAmount,
              adsFeeAmount: history.adsFeeAmount,
              adsTaxPercent: history.adsTaxPercent,
              affiliateFeeAmount: history.affiliateFeeAmount
            });
            currentIdRef.current = id;
          } else {
            // Not found
            navigate('/profit-history');
          }
        } catch (err) {
          console.error('Failed to load profit history:', err);
        }
      } else {
        // Reset state for new calculation
        setTitle(`Profit Calculation ${new Date().toLocaleDateString('id-ID')}`);
        clearOrders();
        clearOverrides();
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, navigate, setOrders, clearOrders, clearOverrides]);

  const performAutoSave = useCallback(async () => {
    if (orders.length === 0 && !currentIdRef.current) return;
    
    try {
      const recordId = currentIdRef.current || `profit-${Date.now()}`;
      if (!currentIdRef.current) {
        currentIdRef.current = recordId;
        // Optionally update URL without reloading
        window.history.replaceState(null, '', `/profit-calculator/${recordId}`);
      }

      setAutoSaveStatus('saving');
      
      const currentState = useProfitStore.getState();
      
      const newHistory: ProfitHistory = {
        id: recordId,
        title: title || `Profit Calculation ${new Date().toLocaleDateString('id-ID')}`,
        startDate,
        endDate,
        orders: currentState.orders,
        masterModal: currentState.masterModal,
        overrides: currentState.overrides,
        adminFeePercent: currentState.adminFeePercent,
        serviceFeePercent: currentState.serviceFeePercent,
        orderFeeAmount: currentState.orderFeeAmount,
        adsFeeAmount: currentState.adsFeeAmount,
        adsTaxPercent: currentState.adsTaxPercent,
        affiliateFeeAmount: currentState.affiliateFeeAmount,
        createdAt: currentIdRef.current === recordId ? (await db.profitHistories.get(recordId))?.createdAt || new Date() : new Date(),
        updatedAt: new Date(),
      };

      await db.profitHistories.put(newHistory);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Autosave failed:', err);
      setAutoSaveStatus('idle');
    }
  }, [orders, title, startDate, endDate]);

  useEffect(() => {
    if (isLoading) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [orders, masterModal, overrides, adminFeePercent, serviceFeePercent, orderFeeAmount, adsFeeAmount, adsTaxPercent, affiliateFeeAmount, title, startDate, endDate, isLoading, performAutoSave]);


  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    let val = e.target.value;
    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
      val = val.replace(/^0+/, '');
      if (val === '') val = '0';
      e.target.value = val;
    }
    const num = Number(val);
    setter(Math.max(0, isNaN(num) ? 0 : num));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result as ArrayBuffer;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const groups: Record<string, OrderItem[]> = {};
      
      data.forEach((row: any) => {
        const noPesanan = row['No. Pesanan'];
        if (!noPesanan) return;
        
        // Filter pesanan batal
        const statusPesanan = row['Status Pesanan'];
        if (statusPesanan && statusPesanan.toLowerCase() === 'batal') return;
        
        const namaProduk = row['Nama Produk'] || '-';
        const variasi = row['Nama Variasi'] || '-';
        const itemKey = `${namaProduk} | ${variasi}`;
        const hargaSetelahDiskon = parseIndonesianNumber(row['Harga Setelah Diskon']);
        const jumlah = parseIndonesianNumber(row['Jumlah']);
        const subtotalBarang = hargaSetelahDiskon * jumlah;
        
        const item: OrderItem = {
          noPesanan,
          namaProduk,
          variasi,
          hargaSetelahDiskon,
          jumlah,
          subtotalBarang,
          itemKey,
        };
        
        if (!groups[noPesanan]) {
          groups[noPesanan] = [];
        }
        groups[noPesanan].push(item);
      });
      
      const parsedOrders: OrderGroup[] = Object.keys(groups).map((orderId) => {
        const items = groups[orderId];
        const totalSubtotalBarang = items.reduce((sum, item) => sum + item.subtotalBarang, 0);
        return {
          noPesanan: orderId,
          items,
          totalSubtotalBarang,
        };
      });
      
      if (orders.length > 0) {
        setUploadValidationModal({ isOpen: true, data: parsedOrders });
      } else {
        setOrders(parsedOrders);
        clearOverrides();
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleCancelUpload = () => {
    setUploadValidationModal({ isOpen: false, data: null });
  };

  const handleReplaceUpload = () => {
    if (uploadValidationModal.data) {
      setOrders(uploadValidationModal.data);
      clearOverrides();
    }
    setUploadValidationModal({ isOpen: false, data: null });
  };

  const handleCombineUpload = () => {
    if (uploadValidationModal.data) {
      const combined = [...orders];
      for (const newOrder of uploadValidationModal.data) {
        const existingIndex = combined.findIndex(o => o.noPesanan === newOrder.noPesanan);
        if (existingIndex >= 0) {
          combined[existingIndex] = newOrder;
        } else {
          combined.push(newOrder);
        }
      }
      setOrders(combined);
    }
    setUploadValidationModal({ isOpen: false, data: null });
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    orders.forEach(o => { allExpanded[o.noPesanan] = true; });
    setExpandedOrders(allExpanded);
  };

  const collapseAll = () => {
    setExpandedOrders({});
  };

  const getModal = (orderId: string, itemKey: string, namaProduk: string) => {
    const overrideKey = `${orderId}_${itemKey}`;
    if (overrides[overrideKey] !== undefined) {
      return overrides[overrideKey];
    }
    return masterModal[namaProduk] || 0;
  };

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => products.add(item.namaProduk));
    });
    return Array.from(products).sort();
  }, [orders]);

  const filledMasterModalCount = useMemo(() => {
    return uniqueProducts.filter(productName => masterModal[productName] !== undefined).length;
  }, [uniqueProducts, masterModal]);

  const { totalOmset, totalUntungKotor, totalUntungBersih, totalPlatformFee, totalModal } = useMemo(() => {
    let tPenghasilan = 0;
    let tPlatformFee = 0;
    let tModal = 0;

    orders.forEach(order => {
      const penghasilan = order.totalSubtotalBarang;
      tPenghasilan += penghasilan;
      
      const adminFee = (penghasilan * adminFeePercent) / 100;
      const serviceFee = (penghasilan * serviceFeePercent) / 100;
      const totalOrderFee = adminFee + serviceFee + orderFeeAmount;
      
      tPlatformFee += totalOrderFee;
      
      order.items.forEach(item => {
        tModal += getModal(order.noPesanan, item.itemKey, item.namaProduk) * item.jumlah;
      });
    });

    const tOmset = tPenghasilan - tPlatformFee;
    const finalAdsFee = adsFeeAmount + (adsFeeAmount * adsTaxPercent / 100);
    const tUntungKotor = tOmset - (finalAdsFee + affiliateFeeAmount);
    const tUntungBersih = tUntungKotor - tModal;

    return { 
      totalOmset: tOmset, 
      totalUntungKotor: tUntungKotor, 
      totalUntungBersih: tUntungBersih, 
      totalPlatformFee: tPlatformFee,
      totalModal: tModal
    };
  }, [orders, masterModal, overrides, adminFeePercent, serviceFeePercent, orderFeeAmount, adsFeeAmount, adsTaxPercent, affiliateFeeAmount]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 flex flex-col gap-2 w-full">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/profit-history')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
               <span className="material-symbols-outlined text-xl">arrow_back</span>
             </button>
             <input 
               type="text" 
               value={title} 
               onChange={(e) => setTitle(e.target.value)}
               className="text-lg md:text-xl font-medium text-gray-900 dark:text-white font-inter bg-transparent outline-none border-b border-transparent focus:border-teal-500 transition-colors w-full md:w-1/2"
               placeholder="Nama Perhitungan Profit..."
             />
             
            <div className="flex items-center ml-2 h-6">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-medium">Menyimpan...</span>
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 animate-in fade-in duration-300">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span className="text-[10px] font-medium">Tersimpan</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs ml-10">
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1">
              <span className="text-gray-500 px-1">Dari:</span>
              <input type="text" maxLength={2} value={startDate.day} onChange={e => setStartDate({...startDate, day: e.target.value})} className="w-6 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="DD" />
              <span className="text-gray-300">/</span>
              <input type="text" maxLength={2} value={startDate.month} onChange={e => setStartDate({...startDate, month: e.target.value})} className="w-6 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="MM" />
              <span className="text-gray-300">/</span>
              <input type="text" maxLength={4} value={startDate.year} onChange={e => setStartDate({...startDate, year: e.target.value})} className="w-10 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="YYYY" />
            </div>
            <span className="text-gray-500">-</span>
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1">
              <span className="text-gray-500 px-1">Sampai:</span>
              <input type="text" maxLength={2} value={endDate.day} onChange={e => setEndDate({...endDate, day: e.target.value})} className="w-6 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="DD" />
              <span className="text-gray-300">/</span>
              <input type="text" maxLength={2} value={endDate.month} onChange={e => setEndDate({...endDate, month: e.target.value})} className="w-6 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="MM" />
              <span className="text-gray-300">/</span>
              <input type="text" maxLength={4} value={endDate.year} onChange={e => setEndDate({...endDate, year: e.target.value})} className="w-10 text-center bg-transparent outline-none dark:text-white focus:ring-1 focus:ring-teal-500 rounded" placeholder="YYYY" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="relative cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Unggah Excel</span>
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          {orders.length > 0 && (
            <button onClick={() => setIsResetModalOpen(true)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium transition-colors">
              Reset Data
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-3 text-teal-500">
            <span className="material-symbols-outlined text-2xl">analytics</span>
          </div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Belum Ada Data</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs max-w-full">Silakan unggah file Excel pesanan Shopee Anda untuk mulai menghitung.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-5"><span className="material-symbols-outlined text-4xl">payments</span></div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 relative z-10">Total Omset ({orders.length} Pesanan)</p>
              <h3 className="text-base font-medium text-gray-900 dark:text-white relative z-10">{formatCurrency(totalOmset)}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-5"><span className="material-symbols-outlined text-4xl">receipt_long</span></div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 relative z-10">Total Biaya Platform</p>
              <h3 className="text-base font-medium text-red-600 dark:text-red-400 relative z-10">-{formatCurrency(totalPlatformFee)}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-5"><span className="material-symbols-outlined text-4xl">trending_up</span></div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 relative z-10">Total Untung Kotor</p>
              <h3 className="text-base font-medium text-teal-600 dark:text-teal-400 relative z-10">{formatCurrency(totalUntungKotor)}</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-5"><span className="material-symbols-outlined text-4xl">inventory_2</span></div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1 relative z-10">Total Modal</p>
              <h3 className="text-base font-medium text-blue-600 dark:text-blue-400 relative z-10">-{formatCurrency(totalModal)}</h3>
            </div>
            <div className="bg-teal-600 p-4 rounded-xl border border-teal-500 shadow-md relative overflow-hidden text-white flex flex-col justify-center">
              <div className="absolute top-0 right-0 p-3 opacity-20"><span className="material-symbols-outlined text-4xl">account_balance_wallet</span></div>
              <p className="text-[10px] text-teal-100 font-medium mb-1 relative z-10">Total Untung Bersih</p>
              <h3 className="text-base font-medium relative z-10">{formatCurrency(totalUntungBersih)}</h3>
            </div>
          </div>

          {/* New Section: Pengaturan Biaya */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden p-4">
            <h2 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4 text-sm">
              <span className="material-symbols-outlined text-teal-600 text-sm">settings</span>
              Pengaturan Biaya Tambahan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Admin (%)</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={adminFeePercent} onChange={(e) => handleNumberInput(e, setAdminFeePercent)} className="w-full pl-3 pr-6 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Layanan (%) <span className='text-red-500'>(12% for extra plus)</span></label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={serviceFeePercent} onChange={(e) => handleNumberInput(e, setServiceFeePercent)} className="w-full pl-3 pr-6 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Perpesanan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Rp</span>
                  <input type="number" min="0" value={orderFeeAmount} onChange={(e) => handleNumberInput(e, setOrderFeeAmount)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Total Iklan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Rp</span>
                  <input type="number" min="0" value={adsFeeAmount} onChange={(e) => handleNumberInput(e, setAdsFeeAmount)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-medium">Total (+PPN): {formatCurrency(adsFeeAmount + (adsFeeAmount * adsTaxPercent / 100))}</div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">PPN Iklan (%)</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={adsTaxPercent} onChange={(e) => handleNumberInput(e, setAdsTaxPercent)} className="w-full pl-3 pr-6 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Total Affiliate (Rp)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Rp</span>
                  <input type="number" min="0" value={affiliateFeeAmount} onChange={(e) => handleNumberInput(e, setAffiliateFeeAmount)} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Left Column: Master Modal */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                  <h2 className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-teal-600 text-sm">inventory</span>
                    Master Modal
                  </h2>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                    {filledMasterModalCount}/{uniqueProducts.length}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-3 bg-white dark:bg-gray-800">
                  <div className="space-y-2">
                    {uniqueProducts.map((productName, idx) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-2.5 rounded border border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-medium text-gray-900 dark:text-white mb-1.5 leading-tight">
                          {productName}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Rp</span>
                          <input type="number" min="0" 
                            value={masterModal[productName] ?? ''}
                            onChange={(e) => handleNumberInput(e, (val) => setMasterModal(productName, val))}
                            className="w-full pl-7 pr-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Daftar Pesanan */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                  <div>
                    <h2 className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-teal-600 text-sm">receipt_long</span>
                      Daftar Pesanan ({orders.length})
                    </h2>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <button onClick={expandAll} className="text-teal-600 hover:text-teal-700 font-medium">Buka Semua</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={collapseAll} className="text-gray-500 hover:text-gray-700 font-medium">Tutup Semua</button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 w-8"></th>
                        <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700">Pesanan / Barang & Variasi</th>
                        <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 text-center w-12">Qty</th>
                        <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 text-right">Subtotal / Omset</th>
                        <th className="px-3 py-2 font-medium border-b border-gray-200 dark:border-gray-700 w-40 text-right pr-4">Override Modal (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {orders.map((order) => {
                        const isExpanded = expandedOrders[order.noPesanan];
                        const penghasilan = order.totalSubtotalBarang;
                        const adminFee = (penghasilan * adminFeePercent) / 100;
                        const serviceFee = (penghasilan * serviceFeePercent) / 100;
                        const totalPlatformOrder = adminFee + serviceFee + orderFeeAmount;
                        
                        const orderOmset = penghasilan - totalPlatformOrder;
                        
                        let orderModal = 0;
                        order.items.forEach(it => orderModal += getModal(order.noPesanan, it.itemKey, it.namaProduk) * it.jumlah);
                        
                        const orderUntungKotor = orderOmset - orderModal;
                        const orderUntungBersih = orderUntungKotor; // No ads/affiliate here, those are global
                        
                        return (
                          <React.Fragment key={order.noPesanan}>
                            <tr 
                              className="bg-gray-50 dark:bg-gray-800/80 cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group"
                              onClick={() => toggleOrder(order.noPesanan)}
                            >
                              <td className="px-3 py-2 text-center text-gray-400 group-hover:text-teal-600">
                                <span className="material-symbols-outlined text-sm transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}}>chevron_right</span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-900 dark:text-white">{order.noPesanan}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  <span className="text-red-500">biaya layanan: {formatCurrency(totalPlatformOrder)}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-400">{order.items.reduce((acc, it) => acc + it.jumlah, 0)}</td>
                              <td className="px-3 py-2 text-right">
                                <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(orderOmset)}</div>
                                <div className="text-[10px] text-gray-500">Utg Kotor: {formatCurrency(orderUntungKotor)}</div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <div className="font-medium text-teal-600 dark:text-teal-400">Utg Bersih: {formatCurrency(orderUntungBersih)}</div>
                              </td>
                            </tr>
                            
                            {isExpanded && order.items.map((item, idx) => {
                              const currentModal = getModal(order.noPesanan, item.itemKey, item.namaProduk);
                              const overrideKey = `${order.noPesanan}_${item.itemKey}`;
                              const isOverridden = overrides[overrideKey] !== undefined;

                              return (
                                <tr key={`${order.noPesanan}-${idx}`} className="bg-white dark:bg-gray-800">
                                  <td className="px-3 py-1.5"></td>
                                  <td className="px-3 py-1.5 pl-6">
                                    <div className="flex items-start gap-1.5">
                                      <span className="material-symbols-outlined text-gray-300 text-[10px] mt-0.5">subdirectory_arrow_right</span>
                                      <div>
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{item.namaProduk}</div>
                                        <div className="text-gray-500 mt-0.5">{item.variasi}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-1.5 text-center text-gray-600">{item.jumlah}</td>
                                  <td className="px-3 py-1.5 text-right text-gray-600 font-medium">{formatCurrency(item.subtotalBarang)}</td>
                                  <td className="px-3 py-1.5 text-right">
                                    <div className="relative inline-block w-32">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                      <input type="number" min="0" 
                                        value={currentModal ?? ''}
                                        onChange={(e) => handleNumberInput(e, (val) => setOverride(order.noPesanan, item.itemKey, val))}
                                        className={`w-full pl-7 pr-2 py-0.5 rounded border transition-all outline-none ${
                                          isOverridden 
                                            ? 'border-orange-300 bg-orange-50 text-orange-900 focus:ring-1 focus:ring-orange-500 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-100' 
                                            : 'border-gray-200 bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                                        }`}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-ms overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <span className="material-symbols-outlined text-2xl">warning</span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Reset Data</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Apakah Anda yakin ingin menghapus semua data pesanan dari perhitungan ini?
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end gap-2">
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  clearOrders();
                  setIsResetModalOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Validation Modal */}
      {uploadValidationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-dm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5">
              <div className="flex items-center gap-3 text-teal-600 mb-3">
                <span className="material-symbols-outlined text-2xl">file_copy</span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Sudah Ada</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Terdapat data pesanan yang sudah ada. Apa yang ingin Anda lakukan dengan data Excel yang baru diunggah?
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 list-disc pl-5 space-y-1">
                <li><strong>Ganti:</strong> Menghapus data lama dan menggantinya dengan data baru.</li>
                <li><strong>Gabung:</strong> Menambahkan data baru ke data lama (pesanan dengan nomor yang sama akan diperbarui).</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end gap-2">
              <button 
                onClick={handleCancelUpload}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleReplaceUpload}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              >
                Ganti
              </button>
              <button 
                onClick={handleCombineUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm ring-2 ring-teal-600 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-700"
              >
                Gabung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitCalculatorPage;
