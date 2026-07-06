import fs from 'fs';

const svgPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\190d372b-2609-4b62-ab9e-bc0760580314\\.system_generated\\steps\\752\\content.md';
const content = fs.readFileSync(svgPath, 'utf8');

console.log("File length:", content.length);
console.log("Last 500 chars:", content.slice(-500));
