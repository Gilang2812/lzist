import * as XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('e:/project/lzist/Order.all.20260701_20260728.xlsx');
const workbook = XLSX.read(buf);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Sheet Name:", sheetName);
console.log("Headers:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
