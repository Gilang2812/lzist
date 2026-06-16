import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { Category, RestockList, ImportRecord, UnmatchedRow } from '../types';
import RestockListCard from '../components/restock/RestockListCard';
import AddItemsForm from '../components/restock/AddItemsForm';
import { db } from '../db/database';
import { formatRupiah } from '../utils/formatCurrency';
import { fetchCatalogAsCategories } from '../utils/dbHelpers';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportSummaryData {
  isOpen: boolean;
  matched: Category[];
  unmatched: UnmatchedRow[];
  filenames?: string[];
  fileRecords?: Array<{ filename: string; categories: Category[]; unmatchedRows: UnmatchedRow[] }>;
  filename?: string;
}

const RestockDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<RestockList | null>(null);
  const [checklist, setChecklist] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const listItems: UnmatchedRow[] = [];
    list?.importHistory?.forEach(record => {
      if (record.unmatchedRows) {
        listItems.push(...record.unmatchedRows);
      }
    });
    return listItems;
  }, [list?.importHistory]);

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

  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImportListOpen, setIsImportListOpen] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean, 
    idToClear: string | 'bulk' | 'import' | null,
    importId?: string,
    filename?: string
  }>({isOpen: false, idToClear: null});
  const [importSummary, setImportSummary] = useState<ImportSummaryData>({ isOpen: false, matched: [], unmatched: [] });
  const [importDetailsModal, setImportDetailsModal] = useState<{ isOpen: boolean, record: ImportRecord | null }>({ isOpen: false, record: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchList = async () => {
      if (!id) return;
      try {
        const data = await db.restockLists.get(id);
        if (data) {
          setList(data);
          setChecklist(data.categories);
          
          // By default, keep categories and variants collapsed
          setExpandedCategories(new Set());
          setExpandedVariants(new Set());
        }
      } catch (error) {
        console.error("Failed to fetch restock list:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, [id]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleVariant = (varId: string) => {
    setExpandedVariants(prev => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  };

  const toggleVariantCheck = (varId: string) => {
    setChecklist(prev => {
      const next = prev.map(cat => ({
        ...cat,
        variants: cat.variants.map(v => v.id === varId ? { ...v, checked: !v.checked } : v)
      }));
      updateListInDb(next);
      return next;
    });
  };

  const toggleUnregisteredItemCheck = (filename: string, productName: string, variantName: string) => {
    if (!list || !id) return;
    const newHistory = list.importHistory?.map(record => {
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
    }) || [];
    
    updateListInDb(checklist, list.importedFiles, newHistory);
  };

  const toggleCategoryCheck = (category: Category) => {
    const availableVariants = category.variants;
    if (availableVariants.length === 0) return;

    setChecklist(prev => {
      const isAllChecked = availableVariants.every(variant => 
        prev.find(c => c.id === category.id)?.variants.find(v => v.id === variant.id)?.checked
      );
      
      const next = prev.map(cat => {
        if (cat.id === category.id) {
          return {
            ...cat,
            variants: cat.variants.map(v => ({ ...v, checked: !isAllChecked }))
          };
        }
        return cat;
      });
      updateListInDb(next);
      return next;
    });
  };

  const handleCopy = () => {
    const dataToCopy = {
      categories: checklist,
      importedFiles: list?.importedFiles || [],
      importHistory: list?.importHistory || []
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error("Failed to copy", err));
  };

  const updateListInDb = async (newCategories: Category[], newImportedFiles?: string[], newImportHistory?: ImportRecord[]) => {
    if (!list || !id) return;
    const updatedList: RestockList = { 
      ...list, 
      categories: newCategories || list.categories, 
      importedFiles: newImportedFiles || list.importedFiles,
      importHistory: newImportHistory || list.importHistory,
      updatedAt: new Date() 
    };
    try {
      await db.restockLists.put(updatedList);
      setList(updatedList);
    } catch (error) {
      console.error("Failed to update list in DB", error);
    }
  };

  const handleTargetQuantityChange = (categoryId: string, variantId: string, quantity: number) => {
    setChecklist(prev => {
      const next = prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            variants: cat.variants.map(v => v.id === variantId ? { ...v, targetQuantity: quantity } : v)
          };
        }
        return cat;
      });
      updateListInDb(next);
      return next;
    });
  };

  const handleDeleteVariant = (categoryId: string, variantId: string) => {
    setChecklist(prev => {
      const next = prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            variants: cat.variants.filter(v => v.id !== variantId)
          };
        }
        return cat;
      }).filter(cat => cat.variants.length > 0);
      updateListInDb(next);
      return next;
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    setDeleteModal({ isOpen: true, idToClear: categoryId });
  };

  const confirmDelete = () => {
    if (deleteModal.idToClear === 'bulk') {
      setChecklist(prev => {
        const next = prev.map(cat => ({
          ...cat,
          variants: cat.variants.filter(v => !v.checked)
        })).filter(cat => cat.variants.length > 0);
        updateListInDb(next);
        return next;
      });
    } else if (deleteModal.idToClear === 'import' && deleteModal.importId) {
      handleDeleteImport(deleteModal.importId);
    } else if (deleteModal.idToClear) {
      setChecklist(prev => {
        const next = prev.filter(cat => cat.id !== deleteModal.idToClear);
        updateListInDb(next);
        return next;
      });
    }
    setDeleteModal({ isOpen: false, idToClear: null });
  };

  const handleReplace = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteContent);
      if (Array.isArray(parsed)) {
        setChecklist(parsed);
        updateListInDb(parsed);
        setIsPasting(false);
        setPasteContent('');
      } else if (parsed && Array.isArray(parsed.categories)) {
        setChecklist(parsed.categories);
        updateListInDb(parsed.categories, parsed.importedFiles, parsed.importHistory);
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category atau object dengan properties categories.");
      }
    } catch {
      setPasteError("Format JSON tidak valid.");
    }
  };

  const handleDeleteImport = (importId: string) => {
    if (!list) return;
    const recordToDelete = list.importHistory?.find(r => r.id === importId);
    if (!recordToDelete) return;

    const newHistory = list.importHistory?.filter(r => r.id !== importId) || [];
    
    const newCategories = [...checklist];
    
    recordToDelete.categories.forEach(importCat => {
      const catIndex = newCategories.findIndex(c => c.id === importCat.id);
      if (catIndex >= 0) {
        const category = { ...newCategories[catIndex] };
        const variants = [...category.variants];
        
        importCat.variants.forEach(importVar => {
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

    setChecklist(newCategories);
    updateListInDb(newCategories, newHistory.map(h => h.filename), newHistory);
  };

  const handleAppend = () => {
    setPasteError(null);
    try {
      const parsed = JSON.parse(pasteContent);
      if (Array.isArray(parsed)) {
        const next = [...checklist, ...parsed];
        setChecklist(next);
        updateListInDb(next);
        setIsPasting(false);
        setPasteContent('');
      } else if (parsed && Array.isArray(parsed.categories)) {
        const next = [...checklist, ...parsed.categories];
        setChecklist(next);
        
        let nextImportedFiles = list?.importedFiles || [];
        let nextImportHistory = list?.importHistory || [];

        if (parsed.importHistory) {
          const existingIds = new Set(nextImportHistory.map(h => h.id));
          const newRecordsToAdd = (parsed.importHistory as ImportRecord[]).filter(h => !existingIds.has(h.id));
          nextImportHistory = [...nextImportHistory, ...newRecordsToAdd];
          nextImportedFiles = [...new Set(nextImportHistory.map(h => h.filename))];
        } else if (parsed.importedFiles) {
          nextImportedFiles = [...new Set([...nextImportedFiles, ...parsed.importedFiles])];
        }
        
        updateListInDb(next, nextImportedFiles, nextImportHistory);
        setIsPasting(false);
        setPasteContent('');
      } else {
        setPasteError("Data JSON harus berupa array of category atau object dengan properties categories.");
      }
    } catch {
      setPasteError("Format JSON tidak valid.");
    }
  };

  const handleAddItems = (newItems: Category[], newImportedFiles?: string[], newImportHistory?: ImportRecord[]) => {
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
      updateListInDb(updated, newImportedFiles, newImportHistory);
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
                reason: 'Produk/Varian tidak ditemukan di master data', 
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
                reason: 'Varian tidak ditemukan di master data', 
                filename 
              };
              allUnmatchedRows.push(unmatched);
              fileUnmatchedRows.push(unmatched);
              return;
            }

            const itemId = bestCategoryMatch.id;

            // Add to file-specific map
            if (!fileCategoriesMap.has(itemId)) {
              fileCategoriesMap.set(itemId, { ...bestCategoryMatch, variants: [] });
            }

            const fileCategory = fileCategoriesMap.get(itemId)!;
            const existingFileVar = fileCategory.variants.find(v => v.id === initialVariant.id);
            if (existingFileVar) {
              existingFileVar.targetQuantity = (existingFileVar.targetQuantity || 0) + quantity;
            } else {
              fileCategory.variants.push({ ...initialVariant, targetQuantity: quantity });
            }

            // Add to global aggregated map
            if (!globalCategoriesMap.has(itemId)) {
              globalCategoriesMap.set(itemId, { ...bestCategoryMatch, variants: [] });
            }

            const globalCategory = globalCategoriesMap.get(itemId)!;
            const existingGlobalVar = globalCategory.variants.find(v => v.id === initialVariant.id);
            if (existingGlobalVar) {
              existingGlobalVar.targetQuantity = (existingGlobalVar.targetQuantity || 0) + quantity;
            } else {
              globalCategory.variants.push({ ...initialVariant, targetQuantity: quantity });
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

      setImportSummary({ isOpen: true, matched: matchedItems, unmatched: allUnmatchedRows, filenames, fileRecords });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error("Failed to parse Excel file", err);
      alert("Gagal membaca file Excel. Pastikan format file sesuai.");
    }
  };

  const handleBulkDelete = () => {
    if (checkedVariants.size === 0) return;
    setDeleteModal({ isOpen: true, idToClear: 'bulk' });
  };

  return (
    <>
      <main className="max-w-lx4 mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex flex-col gap-4 sm:gap-6 overflow-x-hidden">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-lowest border-y border-surface-variant p-md rounded-lg shadow-sm gap-sm">
          <div className="flex-grow min-w-0">
            <h2 className="font-h3 text-h3 text-on-surface truncate">
              {list ? list.title : "Daftar restock"}
            </h2>
            {list && (
              <div className="flex items-center gap-2 mt-xs flex-wrap">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {list.categories.reduce((acc, cat) => acc + cat.variants.length, 0)} item · Kelola daftar belanja restock.
                </p>
                {isEditing && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Tambah Barang
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-sm self-end sm:self-auto flex-wrap">
            {isEditing && checkedVariants.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-xs px-sm py-xs rounded-md transition-colors border cursor-pointer text-error hover:bg-error/10 border-transparent hover:border-error/20"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span className="font-label-md text-label-md">Hapus ({checkedVariants.size})</span>
              </button>
            )}
            {isEditing && (
              <>
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
                  className="flex items-center gap-xs text-primary hover:bg-surface-container px-sm py-xs rounded-md transition-colors border border-transparent hover:border-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span className="font-label-md text-label-md">Import Excel</span>
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
              </>
            )}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-xs px-sm py-xs rounded-md transition-colors border ${isEditing ? 'bg-primary-container text-on-primary-container border-transparent' : 'text-primary border-transparent hover:bg-surface-container hover:border-surface-variant'} cursor-pointer`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? 'done' : 'edit'}
              </span>
              <span className="font-label-md text-label-md">
                {isEditing ? 'Selesai Edit' : 'Edit'}
              </span>
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
          </div>
        </div>

        {/* Paste Area */}
        {isEditing && isPasting && (
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
        {list?.importHistory && list.importHistory.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsImportListOpen(!isImportListOpen)}
              className="w-full flex items-center justify-between p-md hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="text-xs font-semibold text-on-surface">File yang Diimpor ({list.importHistory.length})</h3>
              </div>
              <span className={`material-symbols-outlined transition-transform ${isImportListOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            
            {isImportListOpen && (
              <div className="px-md pb-md flex flex-col gap-sm">
                <div className="h-px bg-surface-variant mb-xs"></div>
                <div className="flex flex-wrap gap-sm">
                  {list.importHistory.map((h) => (
                    <div 
                      key={h.id} 
                      className="flex items-center gap-2 bg-surface-container px-sm py-xs rounded-lg border border-surface-variant/30 group hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => setImportDetailsModal({ isOpen: true, record: h })}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                          {h.filename}
                        </span>
                        <span className="text-[9px] text-on-surface-variant opacity-60">
                          {new Date(h.importedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {isEditing && (
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
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estimasi Dana Section */}
        {checklist.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md bg-surface-container-lowest border border-surface-variant p-md rounded-xl shadow-sm">
            <div className="bg-surface-container-low p-sm rounded-lg flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-outline-variant/30 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
              <div>
                <p className="font-label-sm text-[9px] text-on-surface-variant uppercase tracking-wider">Estimasi Seluruh Barang</p>
                <p className="text-xs font-semibold text-on-surface mt-xs">{formatRupiah(totalAllPrice)}</p>
              </div>
            </div>
            
            <div className="bg-success-container/10 border border-success/10 p-sm rounded-lg flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
              <div>
                <p className="font-label-sm text-[9px] text-success uppercase tracking-wider">Barang Sudah Diceklis</p>
                <p className="text-xs font-semibold text-success mt-xs">{formatRupiah(totalCheckedPrice)}</p>
              </div>
            </div>

            <div className="bg-primary-container/20 border border-primary/10 p-sm rounded-lg flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[24px]">pending</span>
              </div>
              <div>
                <p className="font-label-sm text-[9px] text-primary uppercase tracking-wider">Barang Belum Diceklis</p>
                <p className="text-xs font-semibold text-primary mt-xs">{formatRupiah(totalUncheckedPrice)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Canvas */}
        <div className="flex flex-col gap-0 bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden">
          {isLoading ? (
            <div className="py-xl text-center flex flex-col items-center justify-center">
              <p className="text-on-surface-variant font-body-lg">Memuat data...</p>
            </div>
          ) : checklist.length === 0 ? (
            <div className="py-xl text-center flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-surface-variant mb-sm">inventory_2</span>
              <p className="text-on-surface-variant font-body-lg">Tidak ada item restock.</p>
              <p className="text-on-surface-variant/70 font-body-md mt-xs">Data tidak ditemukan atau list kosong.</p>
            </div>
          ) : (
            <AnimatePresence>
              {sortedChecklist.map(category => (
                <motion.div
                  key={category.id}
                  layout="position"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <RestockListCard 
                    category={category}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggleExpand={() => toggleCategory(category.id)}
                    expandedVariants={expandedVariants}
                    onToggleVariant={toggleVariant}
                    onImageClick={setSelectedImage}
                    readOnly={!isEditing}
                    onToggleVariantCheck={toggleVariantCheck}
                    onToggleCategoryCheck={() => toggleCategoryCheck(category)}
                    onChangeVariantTargetQuantity={(varId, qty) => handleTargetQuantityChange(category.id, varId, qty)}
                    onDeleteVariant={(varId) => handleDeleteVariant(category.id, varId)}
                    onDelete={() => handleDeleteCategory(category.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Section Barang Tidak Terdaftar */}
        {unregisteredItems.length > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-error/30 overflow-hidden shadow-sm mt-md">
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
                        <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] font-mono border border-surface-variant flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[10px] text-primary">description</span>
                          {item.filename}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Banner */}
            <div className="p-md bg-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-surface-variant gap-4 text-xs text-on-surface font-medium">
              <div>
                Total Barang Tidak Terdaftar: <span className="text-primary font-bold">{unregisteredItems.length} item</span>
              </div>
              <div className="flex-1 max-w-gl grid grid-cols-1 sm:grid-cols-3 gap-sm w-full">
                <div className="bg-surface-container-low/50 p-xs px-sm rounded border border-surface-variant/20 flex flex-col justify-center">
                  <p className="text-[10px] text-on-surface-variant uppercase font-medium leading-none">Estimasi Seluruhnya</p>
                  <p className="text-xs font-bold text-on-surface mt-1">{formatRupiah(totalUnregisteredPrice)}</p>
                </div>
                <div className="bg-success-container/5 p-xs px-sm rounded border border-success/10 flex flex-col justify-center">
                  <p className="text-[10px] text-success uppercase font-medium leading-none">Sudah Diceklis</p>
                  <p className="text-xs font-bold text-success mt-1">{formatRupiah(totalCheckedUnregisteredPrice)}</p>
                </div>
                <div className="bg-primary-container/10 p-xs px-sm rounded border border-primary/10 flex flex-col justify-center">
                  <p className="text-[10px] text-primary uppercase font-medium leading-none">Belum Diceklis</p>
                  <p className="text-xs font-bold text-primary mt-1">{formatRupiah(totalUncheckedUnregisteredPrice)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Add Items */}
      {isModalOpen && <AddItemsForm onClose={() => setIsModalOpen(false)} onAddItems={handleAddItems} />}

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
              {deleteModal.idToClear === 'bulk'
                ? <p>Apakah Anda yakin ingin menghapus {checkedVariants.size} varian yang dipilih?</p>
                : deleteModal.idToClear === 'import'
                  ? (
                      <>
                        <p className="mb-2">Apakah Anda yakin ingin menghapus import file "{deleteModal.filename}"? Ini akan mengurangi jumlah barang yang diimpor dari file ini.</p>
                        <div className="bg-surface-container-low text-sm p-3 rounded-md max-h-40 overflow-y-auto border border-surface-variant">
                          {list?.importHistory?.find(r => r.id === deleteModal.importId)?.categories?.map(cat => (
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
              <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg flex flex-col gap-1 border border-surface-variant/50">
                <span className="font-medium text-[11px] text-on-surface-variant/85">File yang diimpor:</span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                  {importSummary.filenames.map((name, i) => (
                    <span key={i} className="bg-surface px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 border border-surface-variant/30 shadow-xs">
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
                  <ul className="text-sm text-on-surface flex flex-col gap-2 max-h-40 overflow-y-auto border border-surface-variant rounded-md p-2">
                    {importSummary.unmatched.map((row, idx) => (
                      <li key={idx} className="flex flex-col border-b border-surface-variant/50 last:border-0 pb-1 last:pb-0">
                        <div className="flex justify-between items-start gap-sm">
                          <span className="font-medium text-xs">{row.productName || 'Tanpa Nama'} - {row.variantName || 'Tanpa Varian'}</span>
                          {row.filename && (
                            <span className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface-variant border border-surface-variant/30 flex items-center gap-0.5 whitespace-nowrap">
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
                className="px-md py-xs rounded-full border border-outline text-on-surface hover:bg-surface-variant transition-colors font-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const newFiles = list?.importedFiles ? [...list.importedFiles] : [];
                  if (importSummary.filenames) {
                    importSummary.filenames.forEach(f => {
                      if (!newFiles.includes(f)) newFiles.push(f);
                    });
                  }
                  
                  const newHistory = list?.importHistory ? [...list.importHistory] : [];
                  if (importSummary.fileRecords) {
                    importSummary.fileRecords.forEach((record, index) => {
                      newHistory.push({
                        id: `${Date.now()}-${index}-${Math.random()}`,
                        filename: record.filename,
                        categories: record.categories,
                        unmatchedRows: record.unmatchedRows,
                        importedAt: new Date()
                      });
                    });
                  }
                  
                  setChecklist(importSummary.matched);
                  updateListInDb(importSummary.matched, newFiles, newHistory);
                  setImportSummary({ ...importSummary, isOpen: false });
                }}
                disabled={importSummary.matched.length === 0}
                className="px-md py-xs rounded-full bg-error text-on-error hover:bg-error/90 transition-colors font-label-md cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace
              </button>
              <button 
                onClick={() => {
                  const newFiles = list?.importedFiles ? [...list.importedFiles] : [];
                  if (importSummary.filenames) {
                    importSummary.filenames.forEach(f => {
                      if (!newFiles.includes(f)) newFiles.push(f);
                    });
                  }

                  const newHistory = list?.importHistory ? [...list.importHistory] : [];
                  if (importSummary.fileRecords) {
                    importSummary.fileRecords.forEach((record, index) => {
                      newHistory.push({
                        id: `${Date.now()}-${index}-${Math.random()}`,
                        filename: record.filename,
                        categories: record.categories,
                        unmatchedRows: record.unmatchedRows,
                        importedAt: new Date()
                      });
                    });
                  }

                  handleAddItems(importSummary.matched, newFiles, newHistory);
                  setImportSummary({ ...importSummary, isOpen: false });
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
                <div key={cat.id} className="bg-surface-container-lowest border border-surface-variant rounded-lg p-3">
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
                className="px-md py-xs rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md cursor-pointer shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RestockDetailPage;
