import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../db/supabase';
import { useAuthStore } from '../stores/useAuthStore';

export interface VariantImageItem {
  color_img_id?: string;
  image_path?: string;
  url: string;
}

export interface OnlineVariant {
  id: string;
  product_code: string;
  color_id: string;
  name: string;
  stock: number;
  harga: number;
  images: VariantImageItem[];
  isNew?: boolean;
}

export interface ColorOption {
  color_id: string;
  color: string;
}

interface UseEditKatalogBaruProps {
  productId?: string;
  onError?: (message: string) => void;
}

// Helper untuk men-decode data gambar dari tabel color_img (mendukung hex bytea, string data URL, dan array buffer)
export function formatImageData(imageData: any): string | null {
  if (!imageData) return null;

  // 1. Jika bertipe String
  if (typeof imageData === 'string') {
    // Jika format bytea Postgres berupa hex string (\x... atau 0x...)
    if (imageData.startsWith('\\x') || imageData.startsWith('0x')) {
      const hex = imageData.replace(/^(\\x|0x)/, '');
      try {
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
        }

        // Jika isi hex adalah data URI string ASCII ("data:image/...")
        if (str.startsWith('data:image/')) {
          return str;
        }
        if (str.startsWith('/9j/') || str.startsWith('iVBORw0KGgo') || str.startsWith('R0lGOD')) {
          return `data:image/jpeg;base64,${str}`;
        }

        // Jika isi hex adalah binary image bytes murni, convert bytea binary -> base64
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
        }
        return `data:image/jpeg;base64,${btoa(binary)}`;
      } catch (e) {
        console.error('Failed to parse hex image data:', e);
      }
    }

    if (imageData.startsWith('data:image/') || imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return imageData;
    }
    return `data:image/jpeg;base64,${imageData}`;
  }

  // 2. Jika bertipe Uint8Array, Buffer object { type: 'Buffer', data: number[] }, atau Array
  if (imageData instanceof Uint8Array || Array.isArray(imageData?.data) || Array.isArray(imageData)) {
    const rawBytes: number[] = Array.isArray(imageData?.data)
      ? imageData.data
      : Array.isArray(imageData)
      ? imageData
      : Array.from(imageData);

    // Cek sampel awal apakah ASCII data:image/...
    let sample = '';
    for (let i = 0; i < Math.min(rawBytes.length, 30); i++) {
      sample += String.fromCharCode(rawBytes[i]);
    }

    if (sample.startsWith('data:image/')) {
      let fullStr = '';
      const chunk = 8192;
      for (let i = 0; i < rawBytes.length; i += chunk) {
        fullStr += String.fromCharCode.apply(null, rawBytes.slice(i, i + chunk));
      }
      return fullStr;
    }

    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < rawBytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, rawBytes.slice(i, i + chunk));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  }

  return null;
}

export const useEditKatalogBaru = ({ productId, onError }: UseEditKatalogBaruProps) => {
  const { user, initialized } = useAuthStore();
  const userId = user?.id;

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formName, setFormName] = useState('');
  const [formSkus, setFormSkus] = useState<string[]>(['']);
  const [formPrice, setFormPrice] = useState<number | ''>('');

  const [variants, setVariants] = useState<OnlineVariant[]>([]);
  const [availableColors, setAvailableColors] = useState<ColorOption[]>([]);

  const fetchData = useCallback(async () => {
    if (!productId || !initialized) return;
    setIsLoading(true);
    setIsUnauthorized(false);
    setNotFound(false);

    try {
      const { data: product, error: productError } = await supabase
        .from('product')
        .select('*')
        .eq('product_code', productId)
        .maybeSingle();

      if (productError) throw productError;
      if (!product) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // Check ownership
      if (userId && product.user_id && product.user_id !== userId) {
        setIsUnauthorized(true);
        setIsLoading(false);
        return;
      }

      setFormName(product.nama || '');
      setFormPrice(product.price ?? '');

      const { data: skuData } = await supabase
        .from('sku')
        .select('*')
        .eq('product_code', productId);

      const skus = skuData?.map(s => s.id_sku) || [];
      setFormSkus(skus.length > 0 ? [...skus, ''] : ['']);

      const { data: allColors } = await supabase.from('color').select('*');
      setAvailableColors(allColors || []);

      // Ambil product_color
      const { data: productColors, error: colorsError } = await supabase
        .from('product_color')
        .select(`
          *,
          color:color_id (color)
        `)
        .eq('product_id', productId);

      if (colorsError) throw colorsError;

      // Ambil gambar varian dari tabel color_img
      const { data: colorImgs, error: imgError } = await supabase
        .from('color_img')
        .select('color_img_id, product_id, color_id, image_path, is_deleted')
        .eq('product_id', productId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (imgError) {
        console.warn('Warning fetching color_img:', imgError);
      }

      const enrichedVariants: OnlineVariant[] = (productColors || []).map((pc: any) => {
        const matchingImgs = (colorImgs || []).filter(
          (img: any) => String(img.color_id) === String(pc.color_id)
        );

        const decodedImages: VariantImageItem[] = matchingImgs
          .map((img: any): VariantImageItem | null => {
            if (!img.image_path) return null;
            let url = img.image_path;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              const { data } = supabase.storage.from('product_images').getPublicUrl(img.image_path);
              url = data.publicUrl;
            }
            return {
              color_img_id: img.color_img_id,
              image_path: img.image_path,
              url,
            };
          })
          .filter((img: VariantImageItem | null): img is VariantImageItem => img !== null);

        return {
          id: pc.product_id + '_' + pc.color_id,
          product_code: pc.product_id,
          color_id: pc.color_id,
          name: pc.color?.color || 'Unknown',
          stock: pc.stok || 0,
          harga: pc.harga || product?.price || 0,
          images: decodedImages,
        };
      });

      setVariants(enrichedVariants);
    } catch (err) {
      console.error('Failed to fetch product data:', err);
      onErrorRef.current?.('Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  }, [productId, userId, initialized]);

  useEffect(() => {
    fetchData(); 
  }, [fetchData]);

  const uploadVariantImages = async (variantIndex: number, files: File[]): Promise<boolean> => {
    if (!productId || files.length === 0) return false;
    const variant = variants[variantIndex];
    if (!variant) return false;

    const colorName = variant.name?.trim();
    if (!colorName) {
      onErrorRef.current?.('Harap isi nama warna varian terlebih dahulu sebelum mengunggah gambar.');
      return false;
    }

    setIsSubmitting(true);
    try {
      // 1. Resolve / Buat color_id jika belum ada
      let finalColorId = variant.color_id;
      const { data: freshColors } = await supabase.from('color').select('*');
      const currentColorsList: ColorOption[] = freshColors || availableColors;

      const matched = currentColorsList.find(
        c => c.color.toLowerCase() === colorName.toLowerCase()
      );

      if (matched) {
        finalColorId = matched.color_id;
      } else if (!finalColorId || finalColorId.startsWith('new_') || !matched) {
        const newColorId = typeof crypto !== 'undefined' && crypto.randomUUID
          ? `col_${crypto.randomUUID()}`
          : `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const { error: insertColorError } = await supabase.from('color').insert([
          {
            color_id: newColorId,
            color: colorName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
          },
        ]);

        if (insertColorError) throw insertColorError;
        finalColorId = newColorId;
        setAvailableColors(prev => [...prev, { color_id: newColorId, color: colorName }]);
      }

      // 2. Pastikan product_color ada untuk memenuhi foreign key di color_img
      const { error: pcError } = await supabase.from('product_color').upsert({
        product_id: productId,
        color_id: finalColorId,
        stok: Number(variant.stock) || 0,
        harga: Number(variant.harga) || Number(formPrice) || 0,
        updated_at: new Date().toISOString(),
        is_deleted: false,
      });

      if (pcError) throw pcError;

      // 3. Upload setiap file ke Storage & catat di tabel color_img
      const newImageItems: VariantImageItem[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const validExts = ['jpg', 'jpeg', 'png', 'webp'];
        const sanitizedExt = validExts.includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg';

        const colorImgId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const storagePath = `${productId}/${finalColorId}/${colorImgId}.${sanitizedExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product_images')
          .upload(storagePath, file, {
            contentType: file.type || `image/${sanitizedExt}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { error: insertImgError } = await supabase.from('color_img').insert([
          {
            color_img_id: colorImgId,
            product_id: productId,
            color_id: finalColorId,
            image_path: storagePath,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (insertImgError) throw insertImgError;

        const { data: publicData } = supabase.storage.from('product_images').getPublicUrl(storagePath);
        newImageItems.push({
          color_img_id: colorImgId,
          image_path: storagePath,
          url: publicData.publicUrl,
        });
      }

      // 4. Update state variants
      setVariants(prev => {
        const updated = [...prev];
        const v = { ...updated[variantIndex] };
        v.color_id = finalColorId;
        v.images = [...(v.images || []), ...newImageItems];
        updated[variantIndex] = v;
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error('Failed to upload images:', err);
      onErrorRef.current?.(`Gagal mengunggah gambar: ${err.message || 'Terjadi kesalahan'}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeVariantImage = async (variantIndex: number, imageIndex: number): Promise<boolean> => {
    const variant = variants[variantIndex];
    if (!variant || !variant.images) return false;

    const targetImage = variant.images[imageIndex];
    if (!targetImage) return false;

    try {
      if (targetImage.color_img_id) {
        await supabase
          .from('color_img')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('color_img_id', targetImage.color_img_id);

        if (targetImage.image_path) {
          await supabase.storage.from('product_images').remove([targetImage.image_path]);
        }
      }

      setVariants(prev => {
        const updated = [...prev];
        const v = { ...updated[variantIndex] };
        const newImgs = [...(v.images || [])];
        newImgs.splice(imageIndex, 1);
        v.images = newImgs;
        updated[variantIndex] = v;
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error('Failed to remove image:', err);
      onErrorRef.current?.('Gagal menghapus gambar');
      return false;
    }
  };

  

  const handleSkuChange = (index: number, value: string) => {
    const newSkus = [...formSkus];
    newSkus[index] = value;
    if (index === newSkus.length - 1 && value !== '') {
      newSkus.push('');
    }
    setFormSkus(newSkus);
  };

  const removeSku = (index: number) => {
    const newSkus = formSkus.filter((_, i) => i !== index);
    if (newSkus.length === 0) newSkus.push('');
    setFormSkus(newSkus);
  };

  const handleVariantChange = (index: number, field: keyof OnlineVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    if (!productId) return;
    setVariants([
      ...variants,
      {
        id: `new_${Date.now()}`,
        product_code: productId,
        color_id: '',
        name: '',
        stock: 0,
        harga: Number(formPrice) || 0,
        images: [],
        isNew: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const applyMassStock = (stockValue: number) => {
    setVariants(prev => prev.map(v => ({ ...v, stock: stockValue })));
  };

  const saveProduct = async (): Promise<boolean> => {
    if (!productId || !formName.trim()) return false;

    setIsSubmitting(true);
    try {
      // 1. Update Product
      const { error: updateProductError } = await supabase
        .from('product')
        .update({
          nama: formName.trim(),
          price: formPrice === '' ? 0 : Number(formPrice),
          updated_at: new Date().toISOString(),
        })
        .eq('product_code', productId);

      if (updateProductError) throw updateProductError;

      // 2. Update SKUs
      const activeSkus = formSkus.map(s => s.trim()).filter(Boolean);

      const { data: oldSkusData } = await supabase
        .from('sku')
        .select('id_sku')
        .eq('product_code', productId);

      const oldSkus = oldSkusData?.map(s => s.id_sku) || [];

      const toDelete = oldSkus.filter(s => !activeSkus.includes(s));
      if (toDelete.length > 0) {
        await supabase.from('sku').delete().in('id_sku', toDelete);
      }

      const toAdd = activeSkus.filter(s => !oldSkus.includes(s));
      if (toAdd.length > 0) {
        const skuPayloads = toAdd.map(s => ({
          id_sku: s,
          product_code: productId,
          name: formName.trim(),
        }));
        await supabase.from('sku').upsert(skuPayloads);
      }

      // 3. Resolve Colors & Update Product Colors
      // Ambil daftar warna terbaru dari Supabase untuk verifikasi
      const { data: freshColors } = await supabase.from('color').select('*');
      const currentColorsList: ColorOption[] = freshColors || availableColors;

      // Ambil product_color lama untuk tracking perubahan/penghapusan
      const { data: oldProductColors } = await supabase
        .from('product_color')
        .select('color_id')
        .eq('product_id', productId);

      const oldColorIds = (oldProductColors || []).map(pc => pc.color_id);
      const activeColorIds: string[] = [];

      for (const variant of variants) {
        const colorName = variant.name?.trim();
        if (!colorName) continue;

        let finalColorId = variant.color_id;

        // Cari apakah warna sudah ada di database (case-insensitive)
        const matched = currentColorsList.find(
          c => c.color.toLowerCase() === colorName.toLowerCase()
        );

        if (matched) {
          finalColorId = matched.color_id;
        } else if (!finalColorId || finalColorId.startsWith('new_') || !matched) {
          // Buat warna baru di tabel color
          const newColorId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? `col_${crypto.randomUUID()}`
            : `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

          const { error: insertColorError } = await supabase.from('color').insert([
            {
              color_id: newColorId,
              color: colorName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: false,
            },
          ]);

          if (insertColorError) {
            console.error('Failed to create new color:', insertColorError);
          } else {
            finalColorId = newColorId;
            currentColorsList.push({ color_id: newColorId, color: colorName });
          }
        }

        if (!finalColorId) continue;

        activeColorIds.push(finalColorId);

        // Jika color_id varian berubah dan memiliki foto di color_img, sinkronkan color_img
        if (variant.color_id && variant.color_id !== finalColorId) {
          await supabase
            .from('color_img')
            .update({ color_id: finalColorId })
            .eq('product_id', productId)
            .eq('color_id', variant.color_id);
        }

        // Upsert product_color
        const pcPayload = {
          product_id: productId,
          color_id: finalColorId,
          stok: Number(variant.stock) || 0,
          harga: Number(variant.harga) || Number(formPrice) || 0,
          updated_at: new Date().toISOString(),
          is_deleted: false,
        };

        const { error: pcError } = await supabase.from('product_color').upsert(pcPayload);
        if (pcError) {
          console.error('Failed to upsert product_color:', pcError);
          throw pcError;
        }
      }

      // Hapus product_color yang sudah tidak ada di form varian
      const colorsToDelete = oldColorIds.filter(cid => !activeColorIds.includes(cid));
      if (colorsToDelete.length > 0) {
        await supabase
          .from('product_color')
          .delete()
          .eq('product_id', productId)
          .in('color_id', colorsToDelete);
      }

      return true;
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    isSubmitting,
    isUnauthorized,
    notFound,
    formName,
    setFormName,
    formSkus,
    formPrice,
    setFormPrice,
    variants,
    setVariants,
    availableColors,
    handleSkuChange,
    removeSku,
    handleVariantChange,
    handleAddVariant,
    handleRemoveVariant,
    uploadVariantImages,
    removeVariantImage,
    applyMassStock,
    saveProduct,
    refetch: fetchData,
  };
};
