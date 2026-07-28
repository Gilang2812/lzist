import fs from 'fs';

const filePath = 'e:/project/lzist/src/pages/ProfitCalculatorPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Destructure variables
content = content.replace(
  /adsFeeAmount, affiliateFeeAmount,/,
  'adsFeeAmount, adsTaxPercent, affiliateFeeAmount,'
);
content = content.replace(
  /setAdsFeeAmount, setAffiliateFeeAmount/,
  'setAdsFeeAmount, setAdsTaxPercent, setAffiliateFeeAmount'
);

// 2. Update useMemo logic
content = content.replace(
  /const tUntungBersih = tUntungKotor - tPlatformFee - \(adsFeeAmount \+ affiliateFeeAmount\);/,
  `const finalAdsFee = adsFeeAmount + (adsFeeAmount * adsTaxPercent / 100);\n    const tUntungBersih = tUntungKotor - tPlatformFee - (finalAdsFee + affiliateFeeAmount);`
);
content = content.replace(
  /\[orders, masterModal, overrides, adminFeePercent, serviceFeePercent, orderFeeAmount, adsFeeAmount, affiliateFeeAmount\]\)/,
  '[orders, masterModal, overrides, adminFeePercent, serviceFeePercent, orderFeeAmount, adsFeeAmount, adsTaxPercent, affiliateFeeAmount])'
);

// 3. UI Update for the PPN input
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-5 gap-4">/,
  '<div className="grid grid-cols-2 md:grid-cols-6 gap-3">'
);

// We need to inject the PPN Iklan input right after the Iklan input.
// Find the Iklan input block:
const iklanBlockRegex = /<div>\s*<label className="block text-\[10px\] font-medium text-gray-500 mb-1">Total Iklan \(Rp\)<\/label>[\s\S]*?<\/div>\s*<div>\s*<label className="block text-\[10px\] font-medium text-gray-500 mb-1">Total Affiliate \(Rp\)<\/label>/;

const replacement = `<div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Total Iklan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">Rp</span>
                  <input type="number" min="0" value={adsFeeAmount} onChange={(e) => setAdsFeeAmount(Math.max(0, Number(e.target.value)))} className="w-full pl-6 pr-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">PPN Iklan (%)</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={adsTaxPercent} onChange={(e) => setAdsTaxPercent(Math.max(0, Number(e.target.value)))} className="w-full pl-3 pr-6 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Total Affiliate (Rp)</label>`;

content = content.replace(iklanBlockRegex, replacement);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated ProfitCalculatorPage.tsx successfully.");
