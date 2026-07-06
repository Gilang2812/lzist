import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { fetchCatalogAsCategories } from '../utils/dbHelpers';
import type { Category, ImportRecord, Variant, UnmatchedRow } from '../types';
import RestockListCard from '../components/restock/RestockListCard';
import AddItemsForm from '../components/restock/AddItemsForm';
import { db } from '../db/database';
import type { RestockList } from '../types';
import { useUndoableState } from '../hooks/useUndoableState';
import { formatRupiah } from '../utils/formatCurrency';

interface ImportSummary {
  isOpen: boolean;
  matched: Category[];
  unmatched: UnmatchedRow[];
  filenames?: string[];
  fileRecords?: Array<{ filename: string; categories: Category[]; unmatchedRows: UnmatchedRow[] }>;
  filename?: string;
}

const AUTOSAVE_DEBOUNCE_MS = 1500;

interface RestockState {
  categories: Category[];
  importedFiles: string[];
  importHistory: ImportRecord[];
}

const NewRestockEntryPage: React.FC = () => {
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

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


  const [isImportListOpen, setIsImportListOpen] = useState(false);
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

  const { totalUncheckedPrice, totalCheckedPrice, totalAllPrice } = React.useMemo(() => {
    let unchecked = 0;
    let checked = 0;
    let total = 0;
    checklist.forEach(cat => {
      cat.variants.forEach(v => {
        const itemCost = (v.price || 0) * (v.targetQuantity || 0);
        total += itemCost;
        if (v.checked) {
          checked += itemCost;
        } else {
          unchecked += itemCost;
        }
      });
    });
    return { totalUncheckedPrice: unchecked, totalCheckedPrice: checked, totalAllPrice: total };
  }, [checklist]);

  const unregisteredItems = React.useMemo(() => {
    const list: UnmatchedRow[] = [];
    importHistory.forEach(record => {
      if (record.unmatchedRows) {
        list.push(...record.unmatchedRows);
      }
    });
    return list;
  }, [importHistory]);

  const { totalUnregisteredPrice, totalCheckedUnregisteredPrice, totalUncheckedUnregisteredPrice } = React.useMemo(() => {
    let total = 0;
    let checkedTotal = 0;
    let uncheckedTotal = 0;
    unregisteredItems.forEach(item => {
      const cost = (item.price || 0) * (item.quantity || 0);
      total += cost;
      if (item.checked) {
        checkedTotal += cost;
      } else {
        uncheckedTotal += cost;
      }
    });
    return {
      totalUnregisteredPrice: total,
      totalCheckedUnregisteredPrice: checkedTotal,
      totalUncheckedUnregisteredPrice: uncheckedTotal
    };
  }, [unregisteredItems]);


  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // remove saveConflictModal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean,
    idToClear: string | 'all' | 'bulk' | 'import' | null,
    importId?: string,
    filename?: string
  }>({ isOpen: false, idToClear: null });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [importSummary, setImportSummary] = useState<ImportSummary>({ isOpen: false, matched: [], unmatched: [] });
  const [importDetailsModal, setImportDetailsModal] = useState<{ isOpen: boolean, record: ImportRecord | null }>({ isOpen: false, record: null });
  const [currentListId, setCurrentListId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // ─── Autosave: session based ──────
  const performAutoSave = useCallback(async (data: Category[]) => {
    if (data.length === 0) return;
    try {
      const id = currentListId || `restock-${Date.now()}`;
      if (!currentListId) setCurrentListId(id);
      const existing = await db.restockLists.get(id);

      setAutoSaveStatus('saving');
      const newList: RestockList = {
        id,
        title: existing?.title || `Restock List ${today}`,
        categories: data,
        importedFiles,
        importHistory,
        status: existing?.status || 'draft',
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date()
      };
      await db.restockLists.put(newList);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Autosave failed:', err);
      setAutoSaveStatus('idle');
    }
  }, [importedFiles, importHistory, currentListId]);

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

  const toggleUnregisteredItemCheck = (filename: string, productName: string, variantName: string) => {
    setState(prev => {
      const newHistory = prev.importHistory.map(record => {
        if (record.filename === filename && record.unmatchedRows) {
          return {
            ...record,
            unmatchedRows: record.unmatchedRows.map(row => {
              if (row.productName === productName && row.variantName === variantName) {
                return { ...row, checked: !row.checked };
              }
              return row;
            })
          };
        }
        return record;
      });
      return {
        ...prev,
        importHistory: newHistory
      };
    });
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

  const handleExportTxt = () => {
    const dataToExport = {
      categories: checklist,
      importedFiles: importedFiles || [],
      importHistory: importHistory || []
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock_backup_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReplace = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteContent);
      if (Array.isArray(parsed)) {
        setChecklist(parsed);
        setIsPasting(false);
        setPasteContent('');
      } else if (parsed && Array.isArray(parsed.categories)) {
        setState(prev => ({
          ...prev,
          categories: parsed.categories,
          importHistory: parsed.importHistory || prev.importHistory,
          importedFiles: parsed.importedFiles || (parsed.importHistory ? parsed.importHistory.map((h: ImportRecord) => h.filename) : prev.importedFiles)
        }));
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category atau object dengan properties categories.");
      }
    } catch {
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
      } else if (parsed && Array.isArray(parsed.categories)) {
        handleAddItems(parsed.categories);

        if (parsed.importHistory) {
          setState(prev => {
            const existingIds = new Set(prev.importHistory.map(h => h.id));
            const newRecordsToAdd = (parsed.importHistory as ImportRecord[]).filter(h => !existingIds.has(h.id));
            const newHistory = [...prev.importHistory, ...newRecordsToAdd];
            return {
              ...prev,
              importHistory: newHistory,
              importedFiles: [...new Set(newHistory.map(h => h.filename))]
            };
          });
        } else if (parsed.importedFiles) {
          setState(prev => ({
            ...prev,
            importedFiles: [...new Set([...prev.importedFiles, ...parsed.importedFiles])]
          }));
        }
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category atau object dengan properties categories.");
      }
    } catch {
      setPasteError("Format JSON tidak valid.");
    }
  };

  const handleAddItems = (newItems: Category[]) => {
    setChecklist(prev => {
      const updated = [...prev];
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

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const catalogData = await fetchCatalogAsCategories();

      const filePromises = Array.from(files).map((file) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Promise<{ filename: string; rawData: any[] }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = XLSX.utils.sheet_to_json<any>(ws);
              resolve({ filename: file.name, rawData: data });
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsBinaryString(file);
        });
      });

      const parsedFiles = await Promise.all(filePromises);

      const fileRecords: Array<{ filename: string; categories: Category[]; unmatchedRows: UnmatchedRow[] }> = [];
      const allUnmatchedRows: UnmatchedRow[] = [];
      const globalCategoriesMap = new Map<string, Category>();

      parsedFiles.forEach(({ filename, rawData }) => {
        const fileCategoriesMap = new Map<string, Category>();
        const fileUnmatchedRows: UnmatchedRow[] = [];

        rawData.forEach((row) => {
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

            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            const nProduct = normalize(productName);

            let bestCategoryMatch: Category | null = null;

            // 1. Prioritas: uniqueKeyword (Strict Match)
            const keywordMatch = catalogData.find(cat => {
              if (!cat.uniqueKeyword) return false;
              const nKeyword = normalize(cat.uniqueKeyword);
              return nProduct.includes(nKeyword) &&
                cat.variants.some(v => v.name.toLowerCase() === variantName.toLowerCase());
            });

            if (keywordMatch) {
              bestCategoryMatch = keywordMatch;
            } else {
              // 2. Fallback: Nama Barang (Strict Match)
              let longestMatchLen = 0;
              for (const cat of catalogData) {
                const nName = normalize(cat.name);
                if (nProduct.includes(nName) &&
                  cat.variants.some(v => v.name.toLowerCase() === variantName.toLowerCase())) {
                  if (nName.length > longestMatchLen) {
                    longestMatchLen = nName.length;
                    bestCategoryMatch = cat;
                  }
                }
              }
            }

            if (!bestCategoryMatch) {
              let matchedPrice = 0;
              // 1. Try matching by uniqueKeyword (consecutive words)
              let matchingCat = catalogData.find(cat => {
                if (!cat.uniqueKeyword) return false;
                const nKeyword = normalize(cat.uniqueKeyword);
                return nProduct.includes(nKeyword);
              });

              // 2. Fallback: Try matching by product name (consecutive words, longest match)
              if (!matchingCat) {
                let longestMatchLen = 0;
                for (const cat of catalogData) {
                  const nName = normalize(cat.name);
                  if (nProduct.includes(nName)) {
                    if (nName.length > longestMatchLen) {
                      longestMatchLen = nName.length;
                      matchingCat = cat;
                    }
                  }
                }
              }

              if (matchingCat && matchingCat.variants.length > 0) {
                const matchingVar = matchingCat.variants.find(v => v.name.toLowerCase() === variantName.toLowerCase()) || matchingCat.variants[0];
                if (matchingVar && matchingVar.price) {
                  matchedPrice = matchingVar.price;
                }
              }

              const unmatched: UnmatchedRow = {
                productName,
                variantName,
                quantity,
                price: matchedPrice,
                checked: false,
                reason: 'Produk tidak ditemukan di master data',
                filename
              };
              allUnmatchedRows.push(unmatched);
              fileUnmatchedRows.push(unmatched);
              return;
            }

            const initialVariant = bestCategoryMatch.variants.find(v => v.name.toLowerCase() === variantName.toLowerCase());
            if (!initialVariant) {
              let matchedPrice = 0;
              if (bestCategoryMatch.variants.length > 0) {
                const firstVarWithPrice = bestCategoryMatch.variants.find(v => v.price && v.price > 0) || bestCategoryMatch.variants[0];
                if (firstVarWithPrice && firstVarWithPrice.price) {
                  matchedPrice = firstVarWithPrice.price;
                }
              }

              const unmatched: UnmatchedRow = {
                productName,
                variantName,
                quantity,
                price: matchedPrice,
                checked: false,
                reason: `Varian '${variantName}' tidak ditemukan di produk ${bestCategoryMatch.name}`,
                filename
              };
              allUnmatchedRows.push(unmatched);
              fileUnmatchedRows.push(unmatched);
              return;
            }

            const itemId = bestCategoryMatch.id;

            // Add to file-specific map
            if (!fileCategoriesMap.has(itemId)) {
              fileCategoriesMap.set(itemId, {
                ...bestCategoryMatch,
                variants: []
              });
            }

            const fileCategory = fileCategoriesMap.get(itemId)!;
            const existingFileVar = fileCategory.variants.find(v => v.id === initialVariant.id);
            if (existingFileVar) {
              existingFileVar.targetQuantity = (existingFileVar.targetQuantity || 0) + quantity;
            } else {
              fileCategory.variants.push({
                ...initialVariant,
                targetQuantity: quantity
              });
            }

            // Add to global aggregated map
            if (!globalCategoriesMap.has(itemId)) {
              globalCategoriesMap.set(itemId, {
                ...bestCategoryMatch,
                variants: []
              });
            }

            const globalCategory = globalCategoriesMap.get(itemId)!;
            const existingGlobalVar = globalCategory.variants.find(v => v.id === initialVariant.id);
            if (existingGlobalVar) {
              existingGlobalVar.targetQuantity = (existingGlobalVar.targetQuantity || 0) + quantity;
            } else {
              globalCategory.variants.push({
                ...initialVariant,
                targetQuantity: quantity
              });
            }
          });
        });

        const fileMatchedItems = Array.from(fileCategoriesMap.values());
        if (fileMatchedItems.length > 0 || fileUnmatchedRows.length > 0) {
          fileRecords.push({
            filename,
            categories: fileMatchedItems,
            unmatchedRows: fileUnmatchedRows
          });
        }
      });

      const matchedItems = Array.from(globalCategoriesMap.values());
      const filenames = Array.from(files).map(f => f.name);

      setImportSummary({
        isOpen: true,
        matched: matchedItems,
        unmatched: allUnmatchedRows,
        filenames,
        fileRecords
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Failed to parse Excel file", err);
      alert("Gagal membaca file Excel. Pastikan format file sesuai.");
    }
  };

  const triggerSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSave = async () => {
    if (checklist.length === 0) return;

    const id = currentListId || `restock-${Date.now()}`;
    if (!currentListId) setCurrentListId(id);

    const existing = await db.restockLists.get(id);

    const newList: RestockList = {
      id,
      title: existing ? existing.title : `Restock List`,
      categories: checklist,
      importedFiles,
      importHistory,
      status: existing?.status || 'draft',
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };
    await db.restockLists.put(newList);
    triggerSaveSuccess();
  };

  const handleDeleteImport = (importId: string) => {
    setState(prev => {
      const recordToDelete = prev.importHistory.find(r => r.id === importId);
      if (!recordToDelete) return prev;

      const newHistory = prev.importHistory.filter(r => r.id !== importId);

      const newCategories = [...prev.categories];

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
      <main className="max-w-lx4 mx-auto px-3 sm:px-3 py-1 sm:py-4 w-full flex flex-col gap-2 sm:gap-3 overflow-x-hidden bg-slate-100 rounded-lg">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm pb-xs border-b border-surface-variant/30">
          <div>
            <h1 className="text-base sm:text-base text-on-surface font-semibold">Entry Restock {`${today}`}</h1>
            <p className="text-[11px] sm:text-xs text-on-surface-variant mt-xs">
              List entry baru untuk restock barang.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer "
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tambah Barang
            </button>
            {checklist.length > 0 && (
              <div className="flex items-center gap-xs bg-surface-container-high px-2.5 py-[2px] rounded-full border-surface-variant/40">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-primary">inventory_2</span>
                <span className="text-[10px] sm:text-[11px] text-on-surface font-semibold">
                  {checklist.reduce((acc, cat) => acc + cat.variants.length, 0)} Item
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white  p-2 rounded-xl  gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Undo / Redo */}
            <div className="flex items-center rounded-md overflow-hidden bg-white">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 transition-colors cursor-pointer ${canUndo
                  ? 'text-primary hover:bg-surface-container'
                  : 'text-on-surface-variant/30 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">undo</span>
              </button>
              <div className="w-px h-3 sm:h-4 bg-surface-variant"></div>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 transition-colors cursor-pointer ${canRedo
                  ? 'text-primary hover:bg-surface-container'
                  : 'text-on-surface-variant/30 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">redo</span>
              </button>
            </div>
            {checkedVariants.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer text-error hover:bg-error/10 border-transparent hover:border-error/20"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete</span>
                <span className="text-[11px] sm:text-xs font-semibold">Hapus ({checkedVariants.size})</span>
              </button>
            )}
            {checklist.length > 0 && (
              <button
                onClick={() => setDeleteModal({ isOpen: true, idToClear: 'all' })}
                className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors border-transparent hover:border-error/20 cursor-pointer text-error hover:bg-error/10"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete_sweep</span>
                <span className="text-[11px] sm:text-xs font-semibold">Clear All</span>
              </button>
            )}
          </div>
          <div className="flex gap-1.5 self-end sm:self-auto flex-wrap items-center">
            <button
              onClick={handleExportTxt}
              className="flex items-center gap-1 text-primary hover:bg-surface-container px-2 py-1 rounded-md transition-colors border-transparent hover:border-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                download
              </span>
              <span className="text-[11px] sm:text-xs font-semibold">
                Export TXT
              </span>
            </button>
            <button
              onClick={() => setIsPasting(!isPasting)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${isPasting
                ? 'bg-primary-container text-on-primary-container border-primary-container'
                : 'text-primary hover:bg-surface-container border-transparent hover:border-surface-variant'
                }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">content_paste</span>
              <span className="text-[11px] sm:text-xs font-semibold">Paste</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              multiple={true}
              className="hidden"
              onChange={handleExcelUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-primary hover:bg-surface-container px-2 py-1 rounded-md transition-colors border-transparent hover:border-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">upload_file</span>
              <span className="text-[11px] sm:text-xs font-semibold">Import Excel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={checklist.length === 0}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${checklist.length === 0
                ? 'text-on-surface-variant/40 cursor-not-allowed border-transparent'
                : saveSuccess
                  ? 'bg-primary-container text-on-primary-container border-primary-container cursor-default'
                  : 'bg-primary text-on-primary hover:bg-primary/90 border-transparent  cursor-pointer'
                }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                {saveSuccess ? 'check_circle' : 'save'}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold">
                {saveSuccess ? 'Tersimpan' : 'Simpan'}
              </span>
            </button>
          </div>
        </div>

        {/* Paste Area */}
        {isPasting && (
          <div className="bg-surface-container-lowest border-surface-variant p-2 rounded-lg flex flex-col gap-sm  transition-all animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="font-label-lg text-on-surface font-medium flex justify-between items-center">
              Paste JSON Data
              <span className="text-xs font-normal text-on-surface-variant border-surface-variant px-2 py-0.5 rounded-full">Format Array of Category</span>
            </label>
            <div className="relative">
              <textarea
                className="w-full h-40 p-sm bg-surface rounded-md border-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow font-mono text-sm text-on-surface resize-y"
                value={pasteContent}
                onChange={e => setPasteContent(e.target.value)}
                placeholder="input json here"
              />
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setPasteContent(text);
                  } catch (err) {
                    console.error("Failed to read clipboard contents: ", err);
                    alert("Gagal membaca clipboard. Pastikan browser memberikan izin.");
                  }
                }}
                className="absolute top-2 right-2 p-1.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-md border-outline/50  flex items-center justify-center transition-colors cursor-pointer"
                title="Paste from Clipboard"
              >
                <span className="material-symbols-outlined text-[18px]">content_paste_go</span>
              </button>
            </div>
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
                className="px-md py-xs rounded-full border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
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
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md  cursor-pointer"
              >
                Replace Data
              </button>
            </div>
          </div>
        )}

        {/* Imported Files Section */}
        {importHistory.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border-surface-variant overflow-hidden ">
            <button
              onClick={() => setIsImportListOpen(!isImportListOpen)}
              className="w-full flex items-center justify-between p-sm hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="text-xs font-semibold text-on-surface">File yang Diimpor ({importHistory.length})</h3>
              </div>
              <span className={`material-symbols-outlined transition-transform ${isImportListOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isImportListOpen && (
              <div className="px-sm pb-md flex flex-col gap-sm">
                <div className="h-px bg-surface-variant mb-xs"></div>
                <div className="flex flex-wrap gap-xs">
                  {importHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2 bg-surface-container px-sm py-xs border rounded-lg border-surface-variant/30 group hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setImportDetailsModal({ isOpen: true, record: h })}
                    >
                      <div className="flex flex-col">
                        <span className="text-[0.5rem] font-medium text-on-surface flex items-center gap-1">
                          {h.filename}
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
                        className="w-2 h-2 flex items-center justify-center rounded-full text-error   group-hover:opacity-100 hover:bg-error/10 transition-all cursor-pointer"
                        title="Hapus Import & Batalkan Perubahan"
                      >
                        <span className="material-symbols-outlined text-[1px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estimasi Dana Section */}
        {(checklist.length > 0 || unregisteredItems.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-surface-container-lowest border-surface-variant p-2 sm:p-3 rounded-xl ">
            <div className="bg-surface-container-low p-2 rounded-lg flex items-center gap-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-outline-variant/30 flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">payments</span>
              </div>
              <div>
                <p className="font-label-sm text-[8px] sm:text-[9px] text-on-surface-variant uppercase tracking-wider">Estimasi Seluruh Barang</p>
                <p className="text-[10px] sm:text-xs text-on-surface font-semibold mt-0.5">{formatRupiah(totalAllPrice + totalUnregisteredPrice)}</p>
              </div>
            </div>

            <div className="bg-success-container/10 border-success/10 p-2 rounded-lg flex items-center gap-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">check_circle</span>
              </div>
              <div>
                <p className="font-label-sm text-[8px] sm:text-[9px] text-success uppercase tracking-wider">Barang Sudah Diceklis</p>
                <p className="text-[10px] sm:text-xs text-success font-semibold mt-0.5">{formatRupiah(totalCheckedPrice + totalCheckedUnregisteredPrice)}</p>
              </div>
            </div>

            <div className="bg-primary-container/20 border-primary/10 p-2 rounded-lg flex items-center gap-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">pending</span>
              </div>
              <div>
                <p className="font-label-sm text-[8px] sm:text-[9px] text-primary uppercase tracking-wider">Barang Belum Diceklis</p>
                <p className="text-[10px] sm:text-xs text-primary font-semibold mt-0.5">{formatRupiah(totalUncheckedPrice + totalUncheckedUnregisteredPrice)}</p>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && <AddItemsForm onClose={() => setIsModalOpen(false)} onAddItems={handleAddItems} />}

        {/* Checklist Canvas */}
        <div className="flex flex-col gap-0 bg-surface-container-lowest rounded-xl border-surface-variant overflow-hidden">
          {checklist.length === 0 ? (
            <div className="py-xl text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-surface-variant mb-sm">inventory_2</span>
              <p className="text-on-surface-variant font-body-lg">Tidak ada item restock.</p>
              <p className="text-on-surface-variant/70 font-body-md mt-xs">Gunakan tombol tambah atau paste data JSON.</p>
            </div>
          ) : (
            sortedChecklist.map((category, index) => (
              <RestockListCard
                key={category.id}
                category={category}
                isLast={index === sortedChecklist.length - 1}
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

        {/* Section Barang Tidak Terdaftar */}
        {unregisteredItems.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border-error/30 overflow-hidden  mt-md">
            <div className="p-md bg-error-container/10 border-b border-error/20 flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-error">warning</span>
                <div>
                  <h3 className="text-xs text-on-surface font-semibold">
                    Barang Tidak Terdaftar ({unregisteredItems.length})
                  </h3>
                  <p className="text-[9px] text-on-surface-variant font-body-sm">
                    Barang dari file Excel berikut tidak ditemukan di master data (katalog) dan diabaikan saat import.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-surface-variant max-h-80 overflow-y-auto">
              {unregisteredItems.map((item, index) => (
                <div key={index} className="p-sm flex items-center gap-sm hover:bg-surface-container-low/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={() => toggleUnregisteredItemCheck(item.filename || '', item.productName, item.variantName)}
                    className="w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
                  />

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-grow min-w-0">
                      <div className={`text-xs font-medium text-on-surface truncate ${item.checked ? 'line-through opacity-60' : ''}`}>
                        {item.productName || 'Tanpa Nama'}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                        {item.variantName && (
                          <span className="bg-surface-container px-1.5 py-0.5 rounded text-[9px] font-medium text-secondary">
                            Variasi: {item.variantName}
                          </span>
                        )}
                        {item.quantity !== undefined && (
                          <span className="bg-primary-container/20 text-primary px-1.5 py-0.5 rounded text-[9px] font-medium">
                            Jumlah: {item.quantity} pcs
                          </span>
                        )}
                        {item.price ? (
                          <span className="bg-success-container/20 text-success px-1.5 py-0.5 rounded text-[9px] font-medium">
                            Harga: {formatRupiah(item.price)}
                          </span>
                        ) : null}
                        {item.price && item.quantity ? (
                          <span className="bg-outline-variant/30 text-on-surface-variant px-1.5 py-0.5 rounded text-[9px] font-medium">
                            Subtotal: {formatRupiah(item.price * item.quantity)}
                          </span>
                        ) : null}
                        {item.reason && !item.reason.toLowerCase().includes('tidak ditemukan di master data') && (
                          <span className="text-error font-medium">
                            {item.reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.filename && (
                      <div className="flex items-center self-start sm:self-auto">
                        <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] font-mono border-surface-variant flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[10px] text-primary">description</span>
                          {item.filename}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>


          </div>
        )}
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
            <div className="text-body-md text-on-surface-variant font-body-md">
              {deleteModal.idToClear === 'all'
                ? <p>Apakah Anda yakin ingin menghapus semua list restock ini?</p>
                : deleteModal.idToClear === 'bulk'
                  ? <p>Apakah Anda yakin ingin menghapus {checkedVariants.size} varian yang dipilih?</p>
                  : deleteModal.idToClear === 'import'
                    ? (
                      <>
                        <p className="mb-2">Apakah Anda yakin ingin menghapus import file "{deleteModal.filename}"? Ini akan mengurangi jumlah barang yang diimpor dari file ini.</p>
                        <div className="bg-surface-container-low text-sm p-3 rounded-md max-h-40 overflow-y-auto border-surface-variant">
                          {importHistory.find(r => r.id === deleteModal.importId)?.categories?.map(cat => (
                            <div key={cat.id} className="mb-2 last:mb-0">
                              <strong className="text-on-surface block mb-1">{cat.name}</strong>
                              <ul className="list-disc pl-5 text-xs text-on-surface-variant flex flex-col gap-0.5">
                                {cat.variants.map(v => (
                                  <li key={v.id}>{v.name} ({v.targetQuantity} qty)</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                    : <p>Apakah Anda yakin ingin menghapus kategori beserta semua isinya?</p>}
            </div>
            <div className="flex gap-sm justify-end mt-sm">
              <button
                onClick={() => setDeleteModal({ isOpen: false, idToClear: null })}
                className="px-md py-xs rounded-full border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer "
              >
                Hapus
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
          <div className="relative max-w-lx4 w-full h-full max-h-[80vh] flex flex-col items-center justify-center pointer-events-none">
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
            className="bg-surface p-lg rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-lx2 w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Ringkasan Import Excel
            </h3>

            {importSummary.filenames && importSummary.filenames.length > 0 && (
              <div className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-2 rounded-lg flex flex-col gap-1 border-surface-variant/50">
                <span className="font-medium text-[11px] text-on-surface-variant/85">File yang diimpor:</span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {importSummary.filenames.map((name, i) => (
                    <span key={i} className="bg-surface px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 border-surface-variant/30 shadow-xs">
                      <span className="material-symbols-outlined text-[12px] text-primary">description</span>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                  <ul className="text-sm text-on-surface flex flex-col gap-2 max-h-40 overflow-y-auto border-surface-variant rounded-md p-2">
                    {importSummary.unmatched.map((row, idx) => (
                      <li key={idx} className="flex flex-col border-b border-surface-variant/50 last:border-0 pb-1 last:pb-0">
                        <div className="flex justify-between items-start gap-sm">
                          <span className="font-medium text-xs">{row.productName || 'Tanpa Nama'} - {row.variantName || 'Tanpa Varian'}</span>
                          {row.filename && (
                            <span className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant border-surface-variant/30 flex items-center gap-0.5 whitespace-nowrap">
                              <span className="material-symbols-outlined text-[10px]">description</span>
                              {row.filename}
                            </span>
                          )}
                        </div>
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
                className="px-md py-xs rounded-full border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setState(prev => {
                    const nextFiles = importSummary.filenames
                      ? Array.from(new Set([...prev.importedFiles, ...importSummary.filenames]))
                      : prev.importedFiles;

                    const newRecords: ImportRecord[] = [];
                    if (importSummary.fileRecords) {
                      importSummary.fileRecords.forEach((record, index) => {
                        newRecords.push({
                          id: `${Date.now()}-${index}-${Math.random()}`,
                          filename: record.filename,
                          categories: record.categories,
                          unmatchedRows: record.unmatchedRows,
                          importedAt: new Date()
                        });
                      });
                    }

                    return {
                      categories: importSummary.matched,
                      importedFiles: nextFiles,
                      importHistory: [...prev.importHistory, ...newRecords]
                    };
                  });
                  setImportSummary({ ...importSummary, isOpen: false });
                }}
                disabled={importSummary.matched.length === 0}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace
              </button>
              <button
                onClick={() => {
                  setImportSummary({ ...importSummary, isOpen: false });

                  setState(prev => {
                    const updated = [...prev.categories];
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

                    const nextFiles = importSummary.filenames
                      ? Array.from(new Set([...prev.importedFiles, ...importSummary.filenames]))
                      : prev.importedFiles;

                    const newRecords: ImportRecord[] = [];
                    if (importSummary.fileRecords) {
                      importSummary.fileRecords.forEach((record, index) => {
                        newRecords.push({
                          id: `${Date.now()}-${index}-${Math.random()}`,
                          filename: record.filename,
                          categories: record.categories,
                          unmatchedRows: record.unmatchedRows,
                          importedAt: new Date()
                        });
                      });
                    }

                    return {
                      categories: updated,
                      importedFiles: nextFiles,
                      importHistory: [...prev.importHistory, ...newRecords]
                    };
                  });
                }}
                disabled={importSummary.matched.length === 0}
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md cursor-pointer  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Append
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import Details Modal */}
      {importDetailsModal.isOpen && importDetailsModal.record && (
        <div
          className="fixed inset-0 bg-on-surface/50 z-50 flex items-center justify-center p-md backdrop-blur-sm"
          onClick={() => setImportDetailsModal({ isOpen: false, record: null })}
        >
          <div
            className="bg-surface p-lg rounded-xl shadow-lg flex flex-col gap-md animate-in zoom-in-95 duration-200 max-w-gl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              Barang Diimpor: {importDetailsModal.record.filename}
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-sm">
              <p className="text-sm text-on-surface-variant mb-2">Daftar barang yang ditambahkan dari file ini:</p>
              {importDetailsModal.record.categories.map(cat => (
                <div key={cat.id} className="bg-surface-container-lowest border-surface-variant rounded-lg p-3">
                  <strong className="text-on-surface block mb-1 text-sm">{cat.name}</strong>
                  <ul className="list-disc pl-5 text-xs text-on-surface-variant flex flex-col gap-1">
                    {cat.variants.map(v => (
                      <li key={v.id}>{v.name} <span className="font-medium text-primary">({v.targetQuantity} qty)</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 pt-4 border-t border-surface-variant">
              <button
                onClick={() => setImportDetailsModal({ isOpen: false, record: null })}
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md cursor-pointer "
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Autosave indicator */}
      <div className={`fixed top-[72px] right-4 sm:right-6 z-100 flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-md transition-all duration-300 transform ${autoSaveStatus !== 'idle'
        ? 'opacity-100 translate-y-0 scale-100'
        : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        } ${autoSaveStatus === 'saving'
          ? 'bg-surface-container text-on-surface border-surface-variant'
          : 'bg-primary-container text-on-primary-container border-primary/20 shadow-md'
        }`}>
        <span className={`material-symbols-outlined text-[14px] sm:text-[16px] ${autoSaveStatus === 'saving' ? 'animate-spin' : ''}`}>
          {autoSaveStatus === 'saving' ? 'sync' : 'check_circle'}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
          {autoSaveStatus === 'saving' ? 'Menyimpan...' : 'Perubahan tersimpan'}
        </span>
      </div>
    </>
  );
};

export default NewRestockEntryPage;
