import fs from 'fs';

const filePath = 'e:/project/lzist/src/pages/ProfitCalculatorPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Remove bold/semibold
content = content.replace(/font-bold/g, 'font-medium');
content = content.replace(/font-semibold/g, 'font-medium');

// Reduce text sizes
content = content.replace(/text-2xl/g, 'text-lg');
content = content.replace(/text-3xl/g, 'text-xl');
content = content.replace(/text-xl/g, 'text-base');
content = content.replace(/text-lg/g, 'text-sm');
content = content.replace(/text-sm/g, 'text-xs');
content = content.replace(/text-xs/g, 'text-[10px]');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("File updated successfully.");
