import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { fetchCatalogAsCategories } from '../utils/dbHelpers';
import type { Category, ImportRecord, Variant } from '../types';
import RestockListCard from '../components/restock/RestockListCard';
import AddItemsForm from '../components/restock/AddItemsForm';
import { db } from '../db/database';
import type { RestockList } from '../types';
import { useUndoableState } from '../hooks/useUndoableState';

interface UnmatchedRow {
  productName: string;
  variantName: string;
  reason: string;
}

interface ImportSummary {
  isOpen: boolean;
  matched: Category[];
  unmatched: UnmatchedRow[];
  filename?: string;
}

const AUTOSAVE_DEBOUNCE_MS = 1500;
 
interface RestockState {
  categories: Category[];
  importedFiles: string[];
  importHistory: ImportRecord[];
}

const NewRestockEntryPage: React.FC = () => {
  const { 
    state: { categories: checklist, importedFiles, importHistory }, 
    setState, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useUndoableState<RestockState>({ categories: [], importedFiles: [], importHistory: [] });

  const setChecklist = useCallback((updater: Category[] | ((prev: Category[]) => Category[])) => {
    setState(prev => ({
      ...prev,
      categories: typeof updater === 'function' ? updater(prev.categories) : updater
    }));
  }, [setState]);


  const [isImportListOpen, setIsImportListOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const checkedVariants = React.useMemo(() => {
    const set = new Set<string>();
    checklist.forEach(cat => {
      cat.variants.forEach(v => {
        if (v.checked) set.add(v.id);
      });
    });
    return set;
  }, [checklist]);

  const sortedChecklist = React.useMemo(() => {
    return [...checklist].sort((a, b) => {
      const aDone = a.variants.length > 0 && a.variants.every(v => v.checked);
      const bDone = b.variants.length > 0 && b.variants.every(v => v.checked);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    });
  }, [checklist]);


  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveConflictModal, setSaveConflictModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean, 
    idToClear: string | 'all' | 'bulk' | 'import' | null,
    importId?: string,
    filename?: string
  }>({isOpen: false, idToClear: null});
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [importSummary, setImportSummary] = useState<ImportSummary>({ isOpen: false, matched: [], unmatched: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const getTodayId = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
    return `restock-${localISOTime}`;
  };

  // ─── Autosave: only when today's list doesn't exist yet ──────
  const performAutoSave = useCallback(async (data: Category[]) => {
    if (data.length === 0) return;
    try {
      const id = getTodayId();
      const existing = await db.restockLists.get(id);
      // If today's list already exists, skip autosave
      if (existing) return;

      setAutoSaveStatus('saving');
      const newList: RestockList = {
        id,
        title: `Restock ${id.replace('restock-', '')}`,
        categories: data,
        importedFiles,
        importHistory,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.restockLists.add(newList);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Autosave failed:', err);
      setAutoSaveStatus('idle');
    }
  }, [importedFiles, importHistory]);

  useEffect(() => {
    // Skip autosave on initial mount (empty list)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave(checklist);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [checklist, performAutoSave]);

  // ─── Keyboard shortcuts for Undo / Redo ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const confirmDelete = () => {
    if (deleteModal.idToClear === 'all') {
      setChecklist([]);
    } else if (deleteModal.idToClear === 'bulk') {
      setChecklist(prev => prev.map(cat => ({
        ...cat,
        variants: cat.variants.filter(v => !v.checked)
      })).filter(cat => cat.variants.length > 0));
    } else if (deleteModal.idToClear === 'import' && deleteModal.importId) {
      handleDeleteImport(deleteModal.importId);
    } else if (deleteModal.idToClear) {
      setChecklist(prev => prev.filter(c => c.id !== deleteModal.idToClear));
    }
    setDeleteModal({ isOpen: false, idToClear: null });
  };

  const handleChangeTargetQuantity = (categoryId: string, variantId: string, quantity: number) => {
    setChecklist(prev => prev.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          variants: c.variants.map(v => 
            v.id === variantId ? { ...v, targetQuantity: quantity } : v
          )
        };
      }
      return c;
    }));
  };

  const handleDeleteVariant = (categoryId: string, variantId: string) => {
    setChecklist(prev => prev.map(c => {
      if (c.id === categoryId) {
        return { ...c, variants: c.variants.filter(v => v.id !== variantId) };
      }
      return c;
    }).filter(cat => cat.variants.length > 0));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVariant = (id: string) => {
    setExpandedVariants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVariantCheck = (varId: string) => {
    setChecklist(prev => prev.map(cat => ({
      ...cat,
      variants: cat.variants.map(v => v.id === varId ? { ...v, checked: !v.checked } : v)
    })));
  };

  const toggleCategoryCheck = (category: Category) => {
    const availableVariants = category.variants;
    if (availableVariants.length === 0) return;

    setChecklist(prev => {
      const isAllChecked = availableVariants.every(variant => 
        prev.find(c => c.id === category.id)?.variants.find(v => v.id === variant.id)?.checked
      );

      return prev.map(cat => {
        if (cat.id === category.id) {
          return {
            ...cat,
            variants: cat.variants.map(v => ({ ...v, checked: !isAllChecked }))
          };
        }
        return cat;
      });
    });
  };

  const handleBulkDelete = () => {
    if (checkedVariants.size === 0) return;
    setDeleteModal({ isOpen: true, idToClear: 'bulk' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(checklist, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error("Failed to copy", err));
  };

  const handleReplace = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteContent);
      if (Array.isArray(parsed)) {
        setChecklist(parsed);
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category.");
      }
    } catch (e) {
      setPasteError("Format JSON tidak valid.");
    }
  };

  const handleAppend = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteContent);
      if (Array.isArray(parsed)) {
        handleAddItems(parsed);
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category.");
      }
    } catch (e) {
      setPasteError("Format JSON tidak valid.");
    }
  };

  const handleAddItems = (newItems: Category[]) => {
    setChecklist(prev => {
      let updated = [...prev];
      newItems.forEach(newCat => {
        const existingCatIndex = updated.findIndex(c => c.id === newCat.id);
        if (existingCatIndex >= 0) {
          const existingCat = { ...updated[existingCatIndex] };
          const existingVariants = [...existingCat.variants];
          
          newCat.variants.forEach(newVar => {
            const existingVarIndex = existingVariants.findIndex(v => v.id === newVar.id);
            if (existingVarIndex >= 0) {
              const existingVar = existingVariants[existingVarIndex];
              existingVariants[existingVarIndex] = {
                ...existingVar,
                targetQuantity: (existingVar.targetQuantity || 1) + (newVar.targetQuantity || 1)
              };
            } else {
              existingVariants.push(newVar);
            }
          });
          existingCat.variants = existingVariants;
          updated[existingCatIndex] = existingCat;
        } else {
          updated.push(newCat);
        }
      });
      return updated;
    });
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const catalogData = await fetchCatalogAsCategories();
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);
        
        const categoriesMap = new Map<string, Category>();
        const unmatchedRows: UnmatchedRow[] = [];
        
        data.forEach((row) => {
          const productInfoStr = row['product_info'] || row['Product Info'] || row['Product_Info'] || row['Info Produk'];
          if (!productInfoStr || typeof productInfoStr !== 'string') return;
          
          const itemsStr = productInfoStr.split(/\r?\n/).filter(line => line.trim().startsWith('['));
          
          itemsStr.forEach(itemStr => {
            const productNameMatch = itemStr.match(/Nama Produk:\s*([^;]+);/);
            const variantNameMatch = itemStr.match(/Nama Variasi:\s*([^;]+);/);
            const quantityMatch = itemStr.match(/Jumlah:\s*(\d+);/);

            if (!productNameMatch) return;

            const productName = productNameMatch[1].trim();
            const variantName = variantNameMatch ? variantNameMatch[1].trim() : '';
            const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

            const getWords = (str: string) => str.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
            const targetWords = getWords(productName);

            let bestCategoryMatch: Category | null = null;
            let maxWordMatch = 0;

            for (const cat of catalogData) {
              const catWords = getWords(cat.name);
              const matchCount = catWords.filter(w => targetWords.includes(w)).length;
              
              const hasVariant = cat.variants.some(v => v.name.toLowerCase() === variantName.toLowerCase());
              
              if (hasVariant && matchCount > maxWordMatch) {
                maxWordMatch = matchCount;
                bestCategoryMatch = cat;
              }
            }

            if (!bestCategoryMatch) {
              unmatchedRows.push({ productName, variantName, reason: 'Produk/Varian tidak ditemukan di master data' });
              return;
            }

            const initialVariant = bestCategoryMatch.variants.find(v => v.name.toLowerCase() === variantName.toLowerCase());
            if (!initialVariant) {
               unmatchedRows.push({ productName, variantName, reason: 'Varian tidak ditemukan di master data' });
               return;
            }

            const itemId = bestCategoryMatch.id;

            if (!categoriesMap.has(itemId)) {
              categoriesMap.set(itemId, {
                ...bestCategoryMatch,
                variants: []
              });
            }
            
            const category = categoriesMap.get(itemId)!;
            const existingVar = category.variants.find(v => v.id === initialVariant.id);
            if (existingVar) {
              existingVar.targetQuantity = (existingVar.targetQuantity || 0) + quantity;
            } else {
              category.variants.push({
                ...initialVariant,
                targetQuantity: quantity
              });
            }
          });
        });

        const matchedItems = Array.from(categoriesMap.values());
        
        setImportSummary({
          isOpen: true,
          matched: matchedItems,
          unmatched: unmatchedRows,
          filename: file.name
        });
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        console.error("Failed to parse Excel file", err);
        alert("Gagal membaca file Excel. Pastikan format file sesuai.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSave = async () => {
    if (checklist.length === 0) return;
    
    const id = getTodayId();
    const existing = await db.restockLists.get(id);
    
    if (existing) {
      setSaveConflictModal(true);
    } else {
      const newList: RestockList = {
        id,
        title: `Restock ${id.replace('restock-', '')}`,
        categories: checklist,
        importedFiles,
        importHistory,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.restockLists.add(newList);
      triggerSaveSuccess();
    }
  };

  const handleSaveReplace = async () => {
    const id = getTodayId();
    const existing = await db.restockLists.get(id);
    if (existing) {
      existing.categories = checklist;
      existing.importedFiles = importedFiles;
      existing.importHistory = importHistory;
      existing.updatedAt = new Date();
      await db.restockLists.put(existing);
    }
    setSaveConflictModal(false);
    triggerSaveSuccess();
  };

  const handleSaveCombine = async () => {
    const id = getTodayId();
    const existing = await db.restockLists.get(id);
    if (existing) {
      let updated = [...existing.categories];
      checklist.forEach(newCat => {
        const existingCatIndex = updated.findIndex(c => c.id === newCat.id);
        if (existingCatIndex >= 0) {
          const existingCat = { ...updated[existingCatIndex] };
          const existingVariants = [...existingCat.variants];
          
          newCat.variants.forEach(newVar => {
            const existingVarIndex = existingVariants.findIndex(v => v.id === newVar.id);
            if (existingVarIndex >= 0) {
              const existingVar = existingVariants[existingVarIndex];
              existingVariants[existingVarIndex] = {
                ...existingVar,
                targetQuantity: (existingVar.targetQuantity || 1) + (newVar.targetQuantity || 1)
              };
            } else {
              existingVariants.push(newVar);
            }
          });
          existingCat.variants = existingVariants;
          updated[existingCatIndex] = existingCat;
        } else {
          updated.push(newCat);
        }
      });
      existing.categories = updated;
      existing.importedFiles = Array.from(new Set([...(existing.importedFiles || []), ...importedFiles]));
      existing.importHistory = [...(existing.importHistory || []), ...importHistory];
      existing.updatedAt = new Date();
      await db.restockLists.put(existing);
    }
    setSaveConflictModal(false);
    triggerSaveSuccess();
  };

  const handleDeleteImport = (importId: string) => {
    setState(prev => {
      const recordToDelete = prev.importHistory.find(r => r.id === importId);
      if (!recordToDelete) return prev;

      const newHistory = prev.importHistory.filter(r => r.id !== importId);
      
      let newCategories = [...prev.categories];
      
      recordToDelete.categories.forEach((importCat: Category) => {
        const catIndex = newCategories.findIndex(c => c.id === importCat.id);
        if (catIndex >= 0) {
          const category = { ...newCategories[catIndex] };
          const variants = [...category.variants];
          
          importCat.variants.forEach((importVar: Variant) => {
            const varIndex = variants.findIndex(v => v.id === importVar.id);
            if (varIndex >= 0) {
              const variant = { ...variants[varIndex] };
              variant.targetQuantity = (variant.targetQuantity || 0) - (importVar.targetQuantity || 0);
              if (variant.targetQuantity <= 0) {
                variants.splice(varIndex, 1);
              } else {
                variants[varIndex] = variant;
              }
            }
          });
          
          if (variants.length === 0) {
            newCategories.splice(catIndex, 1);
          } else {
            category.variants = variants;
            newCategories[catIndex] = category;
          }
        }
      });

      return {
        ...prev,
        categories: newCategories,
        importHistory: newHistory,
        importedFiles: newHistory.map(h => h.filename)
      };
    });
  };

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl overflow-x-hidden">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-lowest border-y border-surface-variant p-md rounded-lg shadow-sm gap-sm">
          <div className="flex flex-col gap-1 flex-1">
            <p className="font-body-md text-body-md text-on-surface-variant">List entry baru untuk restock barang.</p>
          </div>
            {/* Autosave status indicator */}
            {autoSaveStatus !== 'idle' && (
              <span className={`flex items-center gap-[3px] text-[11px] font-medium px-sm py-[2px] rounded-full transition-all ${
                autoSaveStatus === 'saving'
                  ? 'text-on-surface-variant bg-surface-container animate-pulse'
                  : 'text-primary bg-primary-container/50'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {autoSaveStatus === 'saving' ? 'sync' : 'cloud_done'}
                </span>
                {autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan'}
              </span>
            )}
          <div className="flex gap-sm self-end sm:self-auto flex-wrap">
            {/* Undo / Redo */}
            <div className="flex items-center border border-surface-variant rounded-md overflow-hidden">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={`flex items-center justify-center w-8 h-8 transition-colors cursor-pointer ${
                  canUndo
                    ? 'text-primary hover:bg-surface-container'
                    : 'text-on-surface-variant/30 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">undo</span>
              </button>
              <div className="w-px h-4 bg-surface-variant"></div>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={`flex items-center justify-center w-8 h-8 transition-colors cursor-pointer ${
                  canRedo
                    ? 'text-primary hover:bg-surface-container'
                    : 'text-on-surface-variant/30 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">redo</span>
              </button>
            </div>
            {checkedVariants.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-xs px-sm py-xs rounded-md transition-colors border cursor-pointer text-error hover:bg-error/10 border-transparent hover:border-error/20"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span className="font-label-md text-label-md">Hapus ({checkedVariants.size})</span>
              </button>
            )}
            <button 
              onClick={() => setDeleteModal({ isOpen: true, idToClear: 'all' })}
              className="flex items-center gap-xs text-error hover:bg-error/10 px-sm py-xs rounded-md transition-colors border border-transparent hover:border-error/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span className="font-label-md text-label-md">Clear All</span>
            </button>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-xs text-primary hover:bg-surface-container px-sm py-xs rounded-md transition-colors border border-transparent hover:border-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copySuccess ? 'check' : 'content_copy'}
              </span>
              <span className="font-label-md text-label-md">
                {copySuccess ? 'Copied!' : 'Copy'}
              </span>
            </button>
            <button 
              onClick={() => setIsPasting(!isPasting)}
              className={`flex items-center gap-xs px-sm py-xs rounded-md transition-colors border cursor-pointer ${
                isPasting 
                  ? 'bg-primary-container text-on-primary-container border-primary-container' 
                  : 'text-primary hover:bg-surface-container border-transparent hover:border-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">content_paste</span>
              <span className="font-label-md text-label-md">Paste</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleExcelUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-xs text-primary hover:bg-surface-container px-sm py-xs rounded-md transition-colors border border-transparent hover:border-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span className="font-label-md text-label-md">Import Excel</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={checklist.length === 0}
              className={`flex items-center gap-xs px-sm py-xs rounded-md transition-colors border ${
                checklist.length === 0
                  ? 'text-on-surface-variant/40 cursor-not-allowed border-transparent'
                  : saveSuccess
                    ? 'bg-primary-container text-on-primary-container border-primary-container cursor-default'
                    : 'bg-primary text-on-primary hover:bg-primary/90 border-transparent shadow-sm cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {saveSuccess ? 'check_circle' : 'save'}
              </span>
              <span className="font-label-md text-label-md">
                {saveSuccess ? 'Tersimpan' : 'Simpan'}
              </span>
            </button>
          </div>
        </div>

        {/* Paste Area */}
        {isPasting && (
          <div className="bg-surface-container-lowest border border-surface-variant p-md rounded-lg flex flex-col gap-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="font-label-lg text-on-surface font-medium flex justify-between items-center">
              Paste JSON Data
              <span className="text-xs font-normal text-on-surface-variant border border-surface-variant px-2 py-0.5 rounded-full">Format Array of Category</span>
            </label>
            <textarea 
              className="w-full h-40 p-sm bg-surface rounded-md border border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow font-mono text-sm text-on-surface resize-y"
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder="[\n  {\n    &#34;id&#34;: &#34;c1&#34;,\n    &#34;name&#34;: &#34;Category Name&#34;,\n    &#34;variants&#34;: []\n  }\n]"
            />
            {pasteError && (
              <p className="text-error text-sm font-medium">{pasteError}</p>
            )}
            <div className="flex gap-sm justify-end mt-xs">
              <button 
                onClick={() => {
                  setIsPasting(false);
                  setPasteContent('');
                  setPasteError(null);
                }}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAppend}
                className="px-md py-xs rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-colors font-label-md cursor-pointer"
              >
                Append Data
              </button>
              <button 
                onClick={handleReplace}
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md shadow-sm cursor-pointer"
              >
                Replace Data
              </button>
            </div>
          </div>
        )}

        {/* Imported Files Section */}
        {importHistory.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsImportListOpen(!isImportListOpen)}
              className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="font-label-lg text-on-surface">File yang Diimpor ({importHistory.length})</h3>
              </div>
              <span className={`material-symbols-outlined transition-transform ${isImportListOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            
            {isImportListOpen && (
              <div className="px-md pb-md flex flex-col gap-sm">
                <div className="h-px bg-surface-variant mb-xs"></div>
                <div className="flex flex-wrap gap-sm">
                  {importHistory.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 bg-surface-container px-sm py-xs rounded-lg border border-surface-variant/30 group hover:border-primary/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-label-md text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                          {h.filename}
                        </span>
                        <span className="text-[10px] text-on-surface-variant opacity-60">
                          {new Date(h.importedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({
                            isOpen: true,
                            idToClear: 'import',
                            importId: h.id,
                            filename: h.filename
                          });
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-error opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-all cursor-pointer"
                        title="Hapus Import & Batalkan Perubahan"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist Canvas */}
        <div className="flex flex-col gap-0 bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden">
          {checklist.length === 0 ? (
            <div className="py-xl text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-surface-variant mb-sm">inventory_2</span>
              <p className="text-on-surface-variant font-body-lg">Tidak ada item restock.</p>
              <p className="text-on-surface-variant/70 font-body-md mt-xs">Gunakan tombol tambah atau paste data JSON.</p>
            </div>
          ) : (
            sortedChecklist.map(category => (
              <RestockListCard 
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggleExpand={() => toggleCategory(category.id)}
                expandedVariants={expandedVariants}
                onToggleVariant={toggleVariant}
                onImageClick={setSelectedImage}
                onDelete={(id) => setDeleteModal({ isOpen: true, idToClear: id })}
                onDeleteVariant={(vId) => handleDeleteVariant(category.id, vId)}
                onChangeVariantTargetQuantity={(vId, q) => handleChangeTargetQuantity(category.id, vId, q)}
                onToggleVariantCheck={toggleVariantCheck}
                onToggleCategoryCheck={() => toggleCategoryCheck(category)}
              />
            ))
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-md w-full py-md border-2 border-dashed border-primary-fixed-dim rounded-xl text-primary font-body-lg text-body-lg font-medium flex items-center justify-center gap-sm hover:bg-surface-container-low hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Barang
        </button>
        {isModalOpen && <AddItemsForm onClose={() => setIsModalOpen(false)} onAddItems={handleAddItems} />}
      </main>

      {/* Delete Validation Modal */}
      {deleteModal.isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setDeleteModal({ isOpen: false, idToClear: null })}
        >
          <div 
            className="bg-surface p-xl rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error">warning</span>
              Konfirmasi Hapus
            </h3>
            <p className="text-body-md text-on-surface-variant font-body-md">
              {deleteModal.idToClear === 'all' 
                ? "Apakah Anda yakin ingin menghapus semua list restock ini?" 
                : deleteModal.idToClear === 'bulk'
                  ? `Apakah Anda yakin ingin menghapus ${checkedVariants.size} varian yang dipilih?`
                  : deleteModal.idToClear === 'import'
                    ? `Apakah Anda yakin ingin menghapus import file "${deleteModal.filename}"? Ini akan mengurangi jumlah barang yang diimpor dari file ini.`
                    : "Apakah Anda yakin ingin menghapus kategori beserta semua isinya?"}
            </p>
            <div className="flex gap-sm justify-end mt-sm">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, idToClear: null })}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Conflict Modal */}
      {saveConflictModal && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setSaveConflictModal(false)}
        >
          <div 
            className="bg-surface p-xl rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-ms"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">info</span>
              List Hari Ini Sudah Ada
            </h3>
            <p className="text-body-md text-on-surface-variant font-body-md">
              Restock list untuk hari ini sudah pernah disimpan. Apakah Anda ingin menimpanya dengan list saat ini, atau menggabungkan datanya?
            </p>
            <div className="flex gap-sm justify-end mt-sm flex-wrap">
              <button 
                onClick={() => setSaveConflictModal(false)}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveReplace}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Timpa
              </button>
              <button 
                onClick={handleSaveCombine}
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Gabung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-on-surface/80 z-50 flex items-center justify-center p-md backdrop-blur-sm" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full max-h-[80vh] flex flex-col items-center justify-center pointer-events-none">
            <div className="relative bg-surface p-sm rounded-xl shadow-lg pointer-events-auto max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <button 
                className="absolute -top-3 -right-3 w-8 h-8 bg-error text-on-error rounded-full flex items-center justify-center shadow-md hover:bg-error/90 transition-colors z-10"
                onClick={() => setSelectedImage(null)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <img 
                src={selectedImage} 
                alt="Enlarged Reference" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}
      {/* Import Summary Modal */}
      {importSummary.isOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setImportSummary({ ...importSummary, isOpen: false })}
        >
          <div 
            className="bg-surface p-lg rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Ringkasan Import Excel
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-md">
              <div className="bg-surface-container-low p-sm rounded-lg flex gap-4 text-center">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-primary">{importSummary.matched.reduce((acc, cat) => acc + cat.variants.length, 0)}</div>
                  <div className="text-sm text-on-surface-variant">Varian Sesuai</div>
                </div>
                <div className="w-px bg-surface-variant"></div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-error">{importSummary.unmatched.length}</div>
                  <div className="text-sm text-on-surface-variant">Tidak Sesuai</div>
                </div>
              </div>

              {importSummary.matched.length > 0 && (
                <div>
                  <h4 className="font-label-lg text-on-surface mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    Data Sesuai (Akan Diimport)
                  </h4>
                  <ul className="text-sm text-on-surface-variant flex flex-col gap-1 list-disc pl-5">
                    {importSummary.matched.slice(0, 5).map(cat => (
                      <li key={cat.id}>{cat.name} ({cat.variants.length} varian)</li>
                    ))}
                    {importSummary.matched.length > 5 && (
                      <li className="italic text-on-surface-variant/70">...dan {importSummary.matched.length - 5} kategori lainnya</li>
                    )}
                  </ul>
                </div>
              )}

              {importSummary.unmatched.length > 0 && (
                <div>
                  <h4 className="font-label-lg text-on-surface mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
                    Data Tidak Sesuai (Diabaikan)
                  </h4>
                  <div className="bg-error-container text-on-error-container text-xs p-2 rounded-md mb-2">
                    Data berikut tidak ditemukan di master data sistem sehingga diabaikan.
                  </div>
                  <ul className="text-sm text-on-surface flex flex-col gap-2 max-h-40 overflow-y-auto border border-surface-variant rounded-md p-2">
                    {importSummary.unmatched.map((row, idx) => (
                      <li key={idx} className="flex flex-col border-b border-surface-variant/50 last:border-0 pb-1 last:pb-0">
                        <span className="font-medium">{row.productName || 'Tanpa Nama'} - {row.variantName || 'Tanpa Varian'}</span>
                        <span className="text-error text-xs">{row.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-sm justify-end mt-2 pt-4 border-t border-surface-variant flex-wrap">
              <button 
                onClick={() => setImportSummary({ ...importSummary, isOpen: false })}
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setState(prev => {
                    const newFiles = importSummary.filename 
                      ? Array.from(new Set([...prev.importedFiles, importSummary.filename]))
                      : prev.importedFiles;
                    
                    const newHistory = importSummary.filename ? [
                      ...prev.importHistory,
                      {
                        id: Date.now().toString(),
                        filename: importSummary.filename,
                        categories: importSummary.matched,
                        importedAt: new Date()
                      }
                    ] : prev.importHistory;

                    return {
                      categories: importSummary.matched,
                      importedFiles: newFiles,
                      importHistory: newHistory
                    };
                  });
                  setImportSummary({ ...importSummary, isOpen: false });
                }}
                disabled={importSummary.matched.length === 0}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace
              </button>
              <button 
                onClick={() => {
                  const newFilename = importSummary.filename;
                  
                  setImportSummary({ ...importSummary, isOpen: false });
                  
                  // We need to update both categories and importedFiles atomically to history
                  setState(prev => {
                    let updated = [...prev.categories];
                    importSummary.matched.forEach(newCat => {
                      const existingCatIndex = updated.findIndex(c => c.id === newCat.id);
                      if (existingCatIndex >= 0) {
                        const existingCat = { ...updated[existingCatIndex] };
                        const existingVariants = [...existingCat.variants];
                        
                        newCat.variants.forEach(newVar => {
                          const existingVarIndex = existingVariants.findIndex(v => v.id === newVar.id);
                          if (existingVarIndex >= 0) {
                            const existingVar = existingVariants[existingVarIndex];
                            existingVariants[existingVarIndex] = {
                              ...existingVar,
                              targetQuantity: (existingVar.targetQuantity || 1) + (newVar.targetQuantity || 1)
                            };
                          } else {
                            existingVariants.push(newVar);
                          }
                        });
                        existingCat.variants = existingVariants;
                        updated[existingCatIndex] = existingCat;
                      } else {
                        updated.push(newCat);
                      }
                    });

                    const nextFiles = newFilename 
                      ? Array.from(new Set([...prev.importedFiles, newFilename]))
                      : prev.importedFiles;

                    const nextHistory = newFilename ? [
                      ...prev.importHistory,
                      {
                        id: Date.now().toString(),
                        filename: newFilename,
                        categories: importSummary.matched,
                        importedAt: new Date()
                      }
                    ] : prev.importHistory;

                    return {
                      categories: updated,
                      importedFiles: nextFiles,
                      importHistory: nextHistory
                    };
                  });
                }}
                disabled={importSummary.matched.length === 0}
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Append
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewRestockEntryPage;
