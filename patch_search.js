const fs = require('fs');
const file = 'c:/Users/santhosh.kumar/Downloads/FieldForce Project/src/components/UniversalSearch.jsx';
let content = fs.readFileSync(file, 'utf8');

// Insert calculations before RENDER
content = content.replace(
  '// ── RENDER ────────────────────────────────────────────────────────────────',
  `const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 1024;
  const calculatedWidth = isMobile ? windowWidth - 32 : Math.min(Math.max(dropPos.width, 440), windowWidth - 32);
  const calculatedLeft = isTablet ? (windowWidth - calculatedWidth) / 2 : Math.min(dropPos.left, Math.max(16, windowWidth - calculatedWidth - 16));

  // ── RENDER ────────────────────────────────────────────────────────────────`
);

// Define regex safely to match the exact left/width style props regardless of whitespace
const styleRegex = /left:.*?\,\s*width:.*?,/s;
content = content.replace(styleRegex, 'left: calculatedLeft,\n  width: calculatedWidth,');

fs.writeFileSync(file, content);
