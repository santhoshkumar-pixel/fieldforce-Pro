const fs = require('fs');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\17130574-7a60-4089-b966-9917eee7e01d\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const json = JSON.parse(lines[i]);
    if (json.tool_calls) {
      for (const tc of json.tool_calls) {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          if (JSON.stringify(tc.args).includes('DashboardPage.jsx')) {
            console.log(`--- Step ${json.step_index} (${tc.name}) ---`);
            console.log(JSON.stringify(tc.args, null, 2));
          }
        }
      }
    }
  } catch (e) {}
}
