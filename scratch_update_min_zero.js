import fs from 'fs';

const filePath = 'e:/project/lzist/src/pages/ProfitCalculatorPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Add min="0" to all number inputs
content = content.replace(/<input\s+type="number"/g, '<input type="number" min="0"');

// Ensure no negative state setters
content = content.replace(/setAdminFeePercent\(Number\(e\.target\.value\)\)/g, 'setAdminFeePercent(Math.max(0, Number(e.target.value)))');
content = content.replace(/setServiceFeePercent\(Number\(e\.target\.value\)\)/g, 'setServiceFeePercent(Math.max(0, Number(e.target.value)))');
content = content.replace(/setOrderFeeAmount\(Number\(e\.target\.value\)\)/g, 'setOrderFeeAmount(Math.max(0, Number(e.target.value)))');
content = content.replace(/setAdsFeeAmount\(Number\(e\.target\.value\)\)/g, 'setAdsFeeAmount(Math.max(0, Number(e.target.value)))');
content = content.replace(/setAffiliateFeeAmount\(Number\(e\.target\.value\)\)/g, 'setAffiliateFeeAmount(Math.max(0, Number(e.target.value)))');

content = content.replace(/Number\(e\.target\.value\) \|\| 0/g, 'Math.max(0, Number(e.target.value) || 0)');

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated inputs to disallow negative numbers.");
