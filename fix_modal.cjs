const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'tickets', 'TicketDetailsModal.jsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let returnStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (')) {
    returnStartIndex = i;
    break;
  }
}

let divStack = [];
for (let i = returnStartIndex; i < lines.length; i++) {
  const line = lines[i];
  
  const regex = /<\/?([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isClosing = fullTag.startsWith('</');
    
    const trackedTags = ['div', 'span', 'button', 'label', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];
    if (trackedTags.includes(tagName.toLowerCase())) {
      if (isClosing) {
        if (divStack.length === 0) {
          console.log(`Line ${i + 1}: Pop failed - Unexpected closing tag </${tagName}>`);
        } else {
          const top = divStack.pop();
          if (top.tag !== tagName) {
            console.log(`Line ${i + 1}: Pop mismatch! Closed </${tagName}> but expected </${top.tag}> (opened at line ${top.line})`);
            divStack.push(top);
          } else {
            console.log(`Line ${i + 1}: Popped </${tagName}> matching line ${top.line}`);
          }
        }
      } else {
        const tagIndex = match.index;
        const restOfLine = line.substring(tagIndex);
        const isSelfClosing = restOfLine.split('>')[0].trim().endsWith('/');
        if (!isSelfClosing) {
          divStack.push({ tag: tagName, line: i + 1 });
          console.log(`Line ${i + 1}: Pushed <${tagName}>`);
        }
      }
    }
  }
}

console.log("\nRemaining tag stack:");
console.log(divStack);
