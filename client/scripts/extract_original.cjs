const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\santhosh.kumar\\.gemini\\antigravity\\brain\\17130574-7a60-4089-b966-9917eee7e01d\\.system_generated\\logs\\transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

let found = false;
for (let i = 0; i < lines.length; i++) {
  if (!lines[i]) continue;
  try {
    const json = JSON.parse(lines[i]);
    // Let's find any view_file content for DashboardPage.jsx
    if (json.tool_calls && json.tool_calls.some(tc => tc.name === 'view_file' && tc.args.AbsolutePath && tc.args.AbsolutePath.includes('DashboardPage.jsx'))) {
      // Find the next step or the response that contains the file contents.
      // Wait, let's just find the step with step_index that had the response. Let's look for output from step_index = 76 or let's search in all steps for the response of the view_file tool.
      // Actually, step 76 was the view_file step or the response. Let's print steps matching view_file.
    }
    // Alternatively, let's search if the content has 'DashboardPage.jsx' and starts with the file structure.
    if (json.content && json.content.includes('File Path:') && json.content.includes('DashboardPage.jsx')) {
      console.log("Found DashboardPage.jsx content in step " + json.step_index);
      fs.writeFileSync('DashboardPage_full_original.txt', json.content, 'utf8');
      found = true;
      break;
    }
  } catch (e) {
    // Ignore parse errors
  }
}
if (!found) {
  console.log("Could not find content by simple check, listing step_indices containing DashboardPage.jsx...");
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;
    try {
      const json = JSON.parse(lines[i]);
      if (JSON.stringify(json).includes('DashboardPage.jsx')) {
        console.log("Step Index: " + json.step_index + ", Type: " + json.type);
      }
    } catch(e){}
  }
}
