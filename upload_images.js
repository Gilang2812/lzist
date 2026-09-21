import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path'; 

// Load .env variables 

const supabaseUrl = "https://gykdsmzdfdopzcvlcmic.supabase.co";

// IMPORTANT: Ganti ini dengan Service Role Key dari Supabase Dashboard!
// Tempatnya ada di Project Settings -> API -> service_role secret
const supabaseKey =   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a2RzbXpkZmRvcHpjdmxjbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA0MDk4NSwiZXhwIjoyMTAyNjE2OTg1fQ.2htRcowfqjtEWEQx5ui8z_FG3BBOB8wKGDeF0Z2_po8'; 

const supabase = createClient(supabaseUrl, supabaseKey);

const imagesDir = './public/assets/images';

async function uploadSemuaGambar() {
  if (supabaseKey === 'MASUKKAN_SERVICE_ROLE_KEY_DI_SINI') {
    console.error("❌ ERROR: Kamu belum memasukkan Service Role Key!");
    console.error("Silakan buka file upload_images.js dan ubah 'MASUKKAN_SERVICE_ROLE_KEY_DI_SINI' dengan kunci rahasiamu.");
    return;
  }

  const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
  
  console.log(`Ditemukan ${files.length} gambar. Memulai proses upload...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imagePath = path.join(imagesDir, file);
    const imageBuffer = fs.readFileSync(imagePath);

    // Ambil nama warna dari nama file. Misalnya 'banviscose-abu-muda-02.jpg' jadi 'abu-muda' (disesuaikan)
    const colorId = file.replace('.jpg', '').replace('.png', '');

    const { error } = await supabase
      .from('color_img')
      .insert({
        color_img_id: `img_${i + 1}`,
        product_id: 'PROD_UMUM', // Kamu perlu memastikan product_id ini sudah ada di tabel product & product_color
        color_id: colorId,       // Kamu perlu memastikan color_id ini sudah ada di tabel color & product_color
        image_data: imageBuffer
      });

    if (error) {
      console.error(`Gagal upload ${file}:`, error.message);
    } else {
      console.log(`[${i + 1}/${files.length}] Berhasil menyimpan: ${file}`);
    }
  }
  console.log('Selesai!');
}

uploadSemuaGambar();
