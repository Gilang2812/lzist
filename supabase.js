import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Ganti dengan URL dan API Key proyek Supabasemu
const supabaseUrl = 'https://gykdsmzdfdopzcvlcmic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a2RzbXpkZmRvcHpjdmxjbWljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA0MDk4NSwiZXhwIjoyMTAyNjE2OTg1fQ.2htRcowfqjtEWEQx5ui8z_FG3BBOB8wKGDeF0Z2_po8';
const supabase = createClient(supabaseUrl, supabaseKey);

const imagesDir = './public/assets/images';

async function uploadSemuaGambar() {
  const files = fs.readdirSync(imagesDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
  
  console.log(`Ditemukan ${files.length} gambar. Memulai proses upload...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imagePath = path.join(imagesDir, file);
    
    // Membaca file sebagai Buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // TODO: Sesuaikan ID dengan datamu
    // Di sini saya pakai nama file sebagai color_id sementara
    const { error } = await supabase
      .from('color_img')
      .insert({
        color_img_id: `img_${i + 1}`,
        product_id: 'PROD_UMUM', // Sesuaikan
        color_id: file.replace('.jpg', ''), // Sesuaikan
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