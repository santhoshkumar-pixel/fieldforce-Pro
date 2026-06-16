const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\17130574-7a60-4089-b966-9917eee7e01d\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const json = JSON.parse(lines[i]);
    if (json.step_index === 76) {
      console.log("Found step 76!");
      fs.writeFileSync('DashboardPage_full_original.txt', json.content, 'utf8');
      break;
    }
  } catch (e) {
    console.error("Error parsing line " + i, e);
  }
}
