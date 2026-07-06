const fs = require('fs');

const content = fs.readFileSync('DashboardPage_full_original.txt', 'utf8');
const lines = content.split('\n');
const cleanLines = [];

let startCode = false;
for (const line of lines) {
  if (line.includes('1: import')) {
    startCode = true;
  }
  if (startCode) {
    // Match line number pattern e.g. "1: import ..."
    const match = line.match(/^\s*(\d+):\s(.*)$/);
    if (match) {
      cleanLines.push(match[2]);
    } else {
      // If it doesn't match, it could be a blank line or end of code
      // We can also check if it's just a line number followed by nothing (empty line)
      const emptyMatch = line.match(/^\s*(\d+):$/);
      if (emptyMatch) {
        cleanLines.push('');
      }
    }
  }
}

fs.writeFileSync('DashboardPage_original_clean.jsx', cleanLines.join('\n'), 'utf8');
console.log("Cleaned original DashboardPage written to DashboardPage_original_clean.jsx");
