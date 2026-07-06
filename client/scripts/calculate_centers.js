import fs from 'fs';
import path from 'path';

const svgPath = 'world-map.svg';
const content = fs.readFileSync(svgPath, 'utf8');

// Bounding box parser from path data
const getPathCoords = (d) => {
  const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!coords) return [];
  const points = [];
  for (let i = 0; i < coords.length; i += 2) {
    const x = parseFloat(coords[i]);
    const y = parseFloat(coords[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  return points;
};

const getBBox = (points) => {
  if (points.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  return {
    minX, maxX, minY, maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY
  };
};

const countryData = {};

// 1. Parse all <g id="COUNTRY_ID">...</g> groups
const gRegex = /<g\s+id="([^"]+)"([\s\S]*?)<\/g>/g;
let match;
while ((match = gRegex.exec(content)) !== null) {
  const id = match[1];
  const gContent = match[2];
  const dRegex = /d="([^"]+)"/g;
  let dMatch;
  let allPoints = [];
  while ((dMatch = dRegex.exec(gContent)) !== null) {
    allPoints = allPoints.concat(getPathCoords(dMatch[1]));
  }
  const bbox = getBBox(allPoints);
  if (bbox) {
    countryData[id] = bbox;
  }
}

// 2. Parse all <path id="COUNTRY_ID" d="..." />
const pathRegex = /<path\s+id="([^"]+)"[\s\S]*?d="([^"]+)"/g;
while ((match = pathRegex.exec(content)) !== null) {
  const id = match[1];
  const d = match[2];
  if (!countryData[id]) {
    const bbox = getBBox(getPathCoords(d));
    if (bbox) {
      countryData[id] = bbox;
    }
  }
}

const targets = ['in', 'us', 'de', 'br', 'au', 'sg', 'gb', 'za'];
targets.forEach(id => {
  console.log(`Country: ${id}`);
  console.log(JSON.stringify(countryData[id], null, 2));
});
