import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Category, RestockList } from '../types';
import RestockListCard from '../components/restock/RestockListCard';
import AddItemsForm from '../components/restock/AddItemsForm';
import { db } from '../db/database';

const RestockDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<RestockList | null>(null);
  const [checklist, setChecklist] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [checkedVariants, setCheckedVariants] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, idToClear: string | 'bulk' | null}>({isOpen: false, idToClear: null});

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
    setCheckedVariants(prev => {
      const next = new Set(prev);
      if (next.has(varId)) next.delete(varId);
      else next.add(varId);
      return next;
    });
  };

  const toggleCategoryCheck = (category: Category) => {
    const availableVariants = category.variants;
    if (availableVariants.length === 0) return;

    setCheckedVariants(prev => {
      const next = new Set(prev);
      const isAllChecked = availableVariants.every(variant => prev.has(variant.id));
      
      if (isAllChecked) {
        availableVariants.forEach(variant => next.delete(variant.id));
      } else {
        availableVariants.forEach(variant => next.add(variant.id));
      }
      return next;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(checklist, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error("Failed to copy", err));
  };

  const updateListInDb = async (newCategories: Category[]) => {
    if (!list || !id) return;
    const updatedList = { ...list, categories: newCategories, updatedAt: new Date() };
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
          variants: cat.variants.filter(v => !checkedVariants.has(v.id))
        })).filter(cat => cat.variants.length > 0);
        updateListInDb(next);
        return next;
      });
      setCheckedVariants(new Set());
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
        const next = [...checklist, ...parsed];
        setChecklist(next);
        updateListInDb(next);
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
      updateListInDb(updated);
      return updated;
    });
  };

  const handleBulkDelete = () => {
    if (checkedVariants.size === 0) return;
    setDeleteModal({ isOpen: true, idToClear: 'bulk' });
  };

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-xl w-full flex flex-col gap-6 sm:gap-xl overflow-x-hidden">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-container-lowest border-y border-surface-variant p-md rounded-lg shadow-sm gap-sm">
          <p className="font-body-md text-body-md text-on-surface-variant flex-1">
            {list ? list.title : "Daftar restock"}
          </p>
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
            checklist.map(category => (
              <RestockListCard 
                key={category.id}
                category={category}
                isExpanded={expandedCategories.has(category.id)}
                onToggleExpand={() => toggleCategory(category.id)}
                expandedVariants={expandedVariants}
                onToggleVariant={toggleVariant}
                onImageClick={setSelectedImage}
                readOnly={!isEditing}
                checkedVariants={checkedVariants}
                onToggleVariantCheck={toggleVariantCheck}
                onToggleCategoryCheck={() => toggleCategoryCheck(category)}
                onChangeVariantTargetQuantity={(varId, qty) => handleTargetQuantityChange(category.id, varId, qty)}
                onDeleteVariant={(varId) => handleDeleteVariant(category.id, varId)}
                onDelete={() => handleDeleteCategory(category.id)}
              />
            ))
          )}
        </div>

        {/* Add Button */}
        {isEditing && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-md w-full py-md border-2 border-dashed border-primary-fixed-dim rounded-xl text-primary font-body-lg text-body-lg font-medium flex items-center justify-center gap-sm hover:bg-surface-container-low hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Tambah Barang
          </button>
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
            <p className="text-body-md text-on-surface-variant font-body-md">
              {deleteModal.idToClear === 'bulk'
                ? `Apakah Anda yakin ingin menghapus ${checkedVariants.size} varian yang dipilih?`
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
    </>
  );
};

export default RestockDetailPage;
