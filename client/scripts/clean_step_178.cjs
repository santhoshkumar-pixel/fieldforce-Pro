const fs = require('fs');

const content = fs.readFileSync('step_178_content.txt', 'utf8');
const lines = content.split('\n');
const cleanLines = [];

for (const line of lines) {
  const match = line.match(/^\s*(\d+):\s(.*)$/);
  if (match) {
    cleanLines.push(match[2]);
  } else {
    const emptyMatch = line.match(/^\s*(\d+):$/);
    if (emptyMatch) {
      cleanLines.push('');
    }
  }
}

fs.writeFileSync('DashboardPage_original_clean_v2.jsx', cleanLines.join('\n'), 'utf8');
console.log("Cleaned original DashboardPage written to DashboardPage_original_clean_v2.jsx");
