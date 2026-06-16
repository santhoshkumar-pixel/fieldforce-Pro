import fs from 'fs';

const paths = fs.readFileSync('world-map-jsx.txt', 'utf8');

const componentContent = `import React from 'react';

export default function WorldMapPaths() {
  return (
    <g className="[&>path]:transition-colors [&>path]:duration-300 [&>path]:fill-slate-900/80 [&>path]:stroke-slate-800/80 hover:[&>path]:fill-sky-950/40 hover:[&>path]:stroke-sky-500/50 [&>g>path]:transition-colors [&>g>path]:duration-300 [&>g>path]:fill-slate-900/80 [&>g>path]:stroke-slate-800/80 hover:[&>g>path]:fill-sky-950/40 hover:[&>g>path]:stroke-sky-500/50">
      ${paths}
    </g>
  );
}
`;

fs.writeFileSync('src/components/WorldMapPaths.jsx', componentContent);
console.log("Component src/components/WorldMapPaths.jsx successfully created!");
