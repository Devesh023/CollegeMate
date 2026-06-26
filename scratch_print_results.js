import fs from 'fs';

const logPath = 'C:/Users/deves/.gemini/antigravity/brain/cb0cbdbc-3845-4c05-8455-8121b56c20d5/.system_generated/tasks/task-754.log';
const log = fs.readFileSync(logPath, 'utf8');

const lines = log.split('\n');
let activeTest = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('TESTING: 98 Percentile') && line.includes('Pathway: DSE')) {
    activeTest = true;
    console.log(line);
    continue;
  }
  if (activeTest && line.includes('TESTING:')) {
    break;
  }
  
  if (activeTest) {
    if (line.includes('--- First 20 Colleges in')) {
      console.log(line);
      for (let j = 1; j <= 20; j++) {
        const nextLine = lines[i + j];
        if (nextLine && !nextLine.includes('---') && !nextLine.includes('TESTING:')) {
          console.log(nextLine);
        } else {
          break;
        }
      }
    }
  }
}
