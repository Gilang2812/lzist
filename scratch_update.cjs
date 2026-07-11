const fs = require('fs');
let c = fs.readFileSync('src/data/restockInitialData.ts', 'utf8');
c = c.replace(/"uniqueKeyword":\s*"(.*?)"/g, 'skus: ["$1"]');
fs.writeFileSync('src/data/restockInitialData.ts', c);
