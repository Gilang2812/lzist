import fs from 'fs';

const filePath = 'e:/project/lzist/src/pages/ProfitCalculatorPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Insert handleNumberInput inside ProfitCalculatorPage component
const insertHelper = `const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: number) => void) => {
    let val = e.target.value;
    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
      val = val.replace(/^0+/, '');
      if (val === '') val = '0';
      e.target.value = val;
    }
    const num = Number(val);
    setter(Math.max(0, isNaN(num) ? 0 : num));
  };

  const handleFileUpload`;

content = content.replace(/const handleFileUpload/, insertHelper);

// 2. Replace all the onChange handlers
content = content.replace(/onChange=\{\(e\) => setAdminFeePercent\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setAdminFeePercent)}');
content = content.replace(/onChange=\{\(e\) => setServiceFeePercent\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setServiceFeePercent)}');
content = content.replace(/onChange=\{\(e\) => setOrderFeeAmount\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setOrderFeeAmount)}');
content = content.replace(/onChange=\{\(e\) => setAdsFeeAmount\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setAdsFeeAmount)}');
content = content.replace(/onChange=\{\(e\) => setAdsTaxPercent\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setAdsTaxPercent)}');
content = content.replace(/onChange=\{\(e\) => setAffiliateFeeAmount\(Math\.max\(0, Number\(e\.target\.value\)\)\)\}/g, 'onChange={(e) => handleNumberInput(e, setAffiliateFeeAmount)}');

content = content.replace(/onChange=\{\(e\) => setMasterModal\(productName, Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\}/g, 'onChange={(e) => handleNumberInput(e, (val) => setMasterModal(productName, val))}');
content = content.replace(/onChange=\{\(e\) => setOverride\(order\.noPesanan, item\.itemKey, Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\}/g, 'onChange={(e) => handleNumberInput(e, (val) => setOverride(order.noPesanan, item.itemKey, val))}');

// Also remove the `|| ''` from value={currentModal || ''} because it causes issues if they want to type 0.
// Wait! If value is 0, it renders '0'. If they want it blank, they can't. But at least they can type 0.5.
content = content.replace(/value=\{masterModal\[productName\] \|\| ''\}/g, 'value={masterModal[productName] ?? \'\'}');
content = content.replace(/value=\{currentModal \|\| ''\}/g, 'value={currentModal ?? \'\'}');

// Wait, the previous value props were:
// value={masterModal[productName] || ''}
// value={currentModal || ''}
// If I change to ?? '', if it's 0 it will render '0'. That's good!

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated handleNumberInput logic.");
