const fs = require('fs');
let content = fs.readFileSync('src/data/restockInitialData.ts', 'utf8');
const keywords = {
  'Pashmina TENCEL | Basic Tencel Shawl': 'pashmina tencel',
  'Pashmina Modal Viscose | Modal Viscose Shawl': 'modal viscose',
  'Pashmina Kaos Rayon Premium | Turkish Shawl': 'pashmina kaos',
  'Pashmina Voal | Arabian Voal Shawl': 'pashmina voal',
  'Pashmina Viscose Textured | Viscose Highlight': 'viscose textured',
  'Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara': 'paris jadul',
  'Hijab Segi Empat Paris Premium': 'paris premium',
  'Ciput Kaos Premium': 'ciput kaos'
};

for (const [name, kw] of Object.entries(keywords)) {
  const searchStr = `"name": "${name}",`;
  const replaceStr = `"name": "${name}",\n    "uniqueKeyword": "${kw}",`;
  content = content.replace(searchStr, replaceStr);
}

fs.writeFileSync('src/data/restockInitialData.ts', content);
console.log("Done");
