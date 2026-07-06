import fs from 'fs';

const svgPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\190d372b-2609-4b62-ab9e-bc0760580314\\.system_generated\\steps\\752\\content.md';
const content = fs.readFileSync(svgPath, 'utf8');

const idRegex = /id="([^"]+)"/g;
let match;
const ids = [];
while ((match = idRegex.exec(content)) !== null) {
  ids.push(match[1]);
}

console.log("All IDs found in SVG:", ids.sort());
