const fs = require('fs');

const data = JSON.parse(fs.readFileSync('step_225_details.json', 'utf8'));
const tc = data.tool_calls[0];
fs.writeFileSync('step_225_target.txt', tc.args.TargetContent, 'utf8');
fs.writeFileSync('step_225_replacement.txt', tc.args.ReplacementContent, 'utf8');
console.log("Successfully extracted target and replacement content from step 225!");
