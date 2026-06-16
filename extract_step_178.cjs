const fs = require('fs');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\17130574-7a60-4089-b966-9917eee7e01d\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const json = JSON.parse(lines[i]);
    if (json.step_index === 178) {
      console.log("Found step 178!");
      fs.writeFileSync('step_178_content.txt', json.content || '', 'utf8');
      break;
    }
  } catch (e) {}
}
