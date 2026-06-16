const fs = require('fs');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\17130574-7a60-4089-b966-9917eee7e01d\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const json = JSON.parse(lines[i]);
    const str = JSON.stringify(json);
    if (str.includes('selectedId') && str.includes('technicianWorkload')) {
      console.log(`Step index: ${json.step_index}, Source: ${json.source}, Type: ${json.type}`);
      // Find where 'selectedId' and 'technicianWorkload' appear in text
      let text = str;
      if (json.content) text = json.content;
      else if (json.tool_calls) text = JSON.stringify(json.tool_calls);
      
      // Let's print around 'selectedId === tech.id'
      const idx = text.indexOf('selectedId === tech.id');
      if (idx !== -1) {
        console.log("Found selectedId === tech.id match:");
        console.log(text.substring(Math.max(0, idx - 200), Math.min(text.length, idx + 1000)));
      }
    }
  } catch (e) {}
}
