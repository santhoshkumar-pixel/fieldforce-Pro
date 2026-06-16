import fs from 'fs';

const svgPath = 'world-map.svg';
const content = fs.readFileSync(svgPath, 'utf8');

const parsePathToPoints = (d) => {
  // Tokenize the path: match command characters [a-zA-Z] or numbers
  const tokens = d.match(/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+/g);
  if (!tokens) return [];

  const points = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;
  let cmd = '';

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[a-zA-Z]/.test(token)) {
      cmd = token;
      i++;
    }

    if (cmd === 'M' || cmd === 'm') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === 'M') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      startX = cx;
      startY = cy;
      points.push({ x: cx, y: cy });
    } else if (cmd === 'L' || cmd === 'l') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === 'L') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      points.push({ x: cx, y: cy });
    } else if (cmd === 'H' || cmd === 'h') {
      const x = parseFloat(tokens[i++]);
      if (cmd === 'H') {
        cx = x;
      } else {
        cx += x;
      }
      points.push({ x: cx, y: cy });
    } else if (cmd === 'V' || cmd === 'v') {
      const y = parseFloat(tokens[i++]);
      if (cmd === 'V') {
        cy = y;
      } else {
        cy += y;
      }
      points.push({ x: cx, y: cy });
    } else if (cmd === 'C' || cmd === 'c') {
      // 3 control points (6 coords)
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === 'C') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      points.push({ x: cx, y: cy });
    } else if (cmd === 'S' || cmd === 's') {
      // 2 control points (4 coords)
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (cmd === 'S') {
        cx = x;
        cy = y;
      } else {
        cx += x;
        cy += y;
      }
      points.push({ x: cx, y: cy });
    } else if (cmd === 'Z' || cmd === 'z') {
      cx = startX;
      cy = startY;
      points.push({ x: cx, y: cy });
    } else {
      // Skip unknown token or coordinate
      i++;
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
    allPoints = allPoints.concat(parsePathToPoints(dMatch[1]));
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
    const bbox = getBBox(parsePathToPoints(d));
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
