import fs from 'fs';
import path from 'path';

const svgPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\190d372b-2609-4b62-ab9e-bc0760580314\\.system_generated\\steps\\714\\content.md';
const content = fs.readFileSync(svgPath, 'utf8');

// Find all matches for <path id="..." d="..." /> or <g id="...">
const countryRegex = /<(path|g)\s+id="([^"]+)"([\s\S]*?)d="([^"]+)"/g;
let match;
const centers = {};

const parseD = (d) => {
  const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!coords) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    const x = parseFloat(coords[i]);
    const y = parseFloat(coords[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY
  };
};

// Also check for nested paths inside <g id="...">
const gRegex = /<g\s+id="([^"]+)"([\s\S]*?)<\/g>/g;
while ((match = gRegex.exec(content)) !== null) {
  const id = match[1];
  const gContent = match[2];
  const dMatch = /d="([^"]+)"/.exec(gContent);
  if (dMatch) {
    const center = parseD(dMatch[1]);
    if (center) centers[id] = center;
  }
}

// Reset regex
countryRegex.lastIndex = 0;
while ((match = countryRegex.exec(content)) !== null) {
  const id = match[2];
  const d = match[4];
  const center = parseD(d);
  if (center) centers[id] = center;
}

const targets = ['in', 'us', 'de', 'br', 'au', 'sg', 'gb', 'za'];
targets.forEach(id => {
  console.log(`Country: ${id}, Info:`, centers[id]);
});
