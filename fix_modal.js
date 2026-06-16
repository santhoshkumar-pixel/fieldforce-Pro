const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'tickets', 'TicketDetailsModal.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the logs block and adjust the divs following it
// We search for logs map closing and the immediately following divs
const pattern = /Timeline \*\/\}[\s\S]+?<\/div>[\s\S]+?\}\)[\s\S]+?<\/div>[\s\S]*?\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*(\{\/\* Footer with Actions \*\/)/;

if (pattern.test(content)) {
  console.log("Found pattern! Replacing...");
  content = content.replace(pattern, (match, p1) => {
    // Replace the three closing divs with just one
    return match.replace(/<\/div>\s*<\/div>\s*<\/div>\s*(\{\/\* Footer with Actions \*\/)/, '</div>\n\n  $1');
  });
} else {
  // Alternative fallback approach using exact string search
  console.log("Pattern not matched directly. Trying generic regex...");
  // Let's replace the block specifically
  const targetStr = `  </div>
  )}
  </div>
  </div>`;
  if (content.includes(targetStr)) {
    console.log("Found target string! Replacing...");
    content = content.replace(targetStr, `  </div>
  )}
  </div>`);
  } else {
    console.log("Target string not found either. Let's dump the segment around logs map.");
    const index = content.indexOf('Ticket Logs');
    if (index !== -1) {
      console.log(content.substring(index, index + 800));
    }
  }
}

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log("Done!");
