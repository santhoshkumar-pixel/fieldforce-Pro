import fs from 'fs';

const svgContent = fs.readFileSync('world-map.svg', 'utf8');

// Extract everything inside <svg ...> ... </svg>
const match = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(svgContent);
if (!match) {
  console.error("Could not find SVG content");
  process.exit(1);
}

let paths = match[1];

// Remove titles and metadata tags
paths = paths.replace(/<title>[\s\S]*?<\/title>/g, '');
paths = paths.replace(/<desc>[\s\S]*?<\/desc>/g, '');

// Convert attributes to React camelCase
paths = paths.replace(/class=/g, 'className=');
paths = paths.replace(/stroke-width=/g, 'strokeWidth=');
paths = paths.replace(/stroke-linecap=/g, 'strokeLinecap=');
paths = paths.replace(/stroke-linejoin=/g, 'strokeLinejoin=');
paths = paths.replace(/stroke-miterlimit=/g, 'strokeMiterlimit=');

fs.writeFileSync('world-map-jsx.txt', paths);
console.log("React JSX paths written to world-map-jsx.txt");
