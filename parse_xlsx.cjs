const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('e:/project/lzist/Online_products_20260512009197.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Print first few rows to understand layout
console.log('=== FIRST 5 ROWS (raw) ===');
for (let i = 0; i < Math.min(5, rows.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(rows[i]));
}

// Find header row index
let headerRow = -1;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row && row.some(cell => typeof cell === 'string' && (cell.includes('Nama Produk') || cell.includes('Item ID')))) {
    headerRow = i;
    break;
  }
}

console.log('\n=== HEADER ROW INDEX ===', headerRow);
if (headerRow >= 0) {
  console.log('Headers:', rows[headerRow]);
}

// Find column indices
const headers = rows[headerRow] || [];
const colNamaProduk = headers.findIndex(h => typeof h === 'string' && h.includes('Nama Produk'));
const colItemId = headers.findIndex(h => typeof h === 'string' && h.includes('Item ID'));
const colVariasi = headers.findIndex(h => typeof h === 'string' && h.trim() === 'Variasi');
const colVariasiId = headers.findIndex(h => typeof h === 'string' && h.includes('Variasi ID'));
const colStok = headers.findIndex(h => typeof h === 'string' && h.includes('Stok'));

console.log('\n=== COLUMN INDICES ===');
console.log(`Nama Produk: ${colNamaProduk}, Item ID: ${colItemId}, Variasi: ${colVariasi}, Variasi ID: ${colVariasiId}, Stok: ${colStok}`);

// Parse categories from excel
const categoriesMap = new Map();

for (let i = headerRow + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length < 2) continue;

  const productName = String(row[colNamaProduk] || '').trim();
  const itemId = String(row[colItemId] || '').trim();
  const variantName = String(row[colVariasi] || '').trim();
  const variantId = String(row[colVariasiId] || '').trim();
  const stock = parseInt(row[colStok], 10) || 0;

  if (!itemId || itemId === 'undefined') continue;

  if (!categoriesMap.has(itemId)) {
    categoriesMap.set(itemId, { id: itemId, name: productName, variants: [] });
  }

  categoriesMap.get(itemId).variants.push({ id: variantId, name: variantName, stock });
}

console.log('\n=== CATEGORIES FROM EXCEL ===');
for (const [id, cat] of categoriesMap) {
  console.log(`  ID: ${id} | ${cat.name} | Variants: ${cat.variants.length}`);
}

// Read existing TS file
const tsContent = fs.readFileSync('e:/project/lzist/src/data/restockInitialData.ts', 'utf8');

// Extract existing CATEGORY ids (lines like: "id": "12345",\n  "name": "...)
const existingCategoryIds = new Set();
const catMatches = [...tsContent.matchAll(/"id": "(\d+)",\r?\n\s+"name": "[^"]+",\r?\n\s+"uniqueKeyword"/g)];
for (const m of catMatches) existingCategoryIds.add(m[1]);

// Extract existing variant ids (lines like: "id": "12345",\n  "name": "...",\n  "stock":)
const existingVariantIds = new Set();
const varMatches = [...tsContent.matchAll(/"id": "(\d+)",\r?\n\s+"name": "[^"]+",\r?\n\s+"stock":/g)];
for (const m of varMatches) existingVariantIds.add(m[1]);

console.log('\n=== EXISTING CATEGORY IDs ===');
console.log([...existingCategoryIds].join(', '));

// Detect differences
const newCategories = [];
const updatedCategories = [];

for (const [id, cat] of categoriesMap) {
  if (!existingCategoryIds.has(id)) {
    newCategories.push(cat);
  } else {
    const newVariants = cat.variants.filter(v => !existingVariantIds.has(v.id));
    if (newVariants.length > 0) {
      updatedCategories.push({ ...cat, variants: newVariants });
    }
  }
}

console.log('\n=== NEW CATEGORIES ===');
if (newCategories.length === 0) console.log('None');
else {
  for (const cat of newCategories) {
    console.log(`  ${cat.id}: ${cat.name} (${cat.variants.length} variants)`);
    for (const v of cat.variants) console.log(`    - ${v.id}: ${v.name} (stock: ${v.stock})`);
  }
}

console.log('\n=== EXISTING CATEGORIES WITH NEW VARIANTS ===');
if (updatedCategories.length === 0) console.log('None');
else {
  for (const cat of updatedCategories) {
    console.log(`  ${cat.id}: ${cat.name}`);
    for (const v of cat.variants) console.log(`    NEW: ${v.id}: ${v.name} (stock: ${v.stock})`);
  }
}

// Generate TS for new categories
if (newCategories.length > 0) {
  console.log('\n=== TS SNIPPET FOR NEW CATEGORIES ===');
  for (const cat of newCategories) {
    const obj = {
      id: cat.id,
      name: cat.name,
      uniqueKeyword: "",
      variants: cat.variants.map(v => ({
        id: v.id,
        name: v.name,
        stock: v.stock,
        targetQuantity: 0,
        color: "bg-primary-fixed-dim",
        images: []
      }))
    };
    console.log(JSON.stringify(obj, null, 2) + ',');
  }
}
