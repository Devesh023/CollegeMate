import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';

// Define paths
const workspaceDir = 'c:/Users/deves/OneDrive/Desktop/CollegeMate';
const cetPath = path.join(workspaceDir, '2024ENGG_CAP1_CutOff.pdf');
const dsePath = path.join(workspaceDir, 'DSE_CAP1_CutOff_2025_26.pdf');
const outputPath = path.join(workspaceDir, 'src/db/realCutoffData.json');

// Parses lines from CET (First Year) PDF text
function parseCetText(text) {
  const lines = text.split('\n');
  const results = [];
  
  let currentCollege = null;
  let currentBranch = null;
  let currentCategories = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 1. Detect College header (e.g. "01002 - Government College of Engineering, Amravati")
    const colMatch = line.match(/^(\d{4,5})\s*-\s*([^\n]+)/);
    if (colMatch) {
      currentCollege = {
        code: colMatch[1],
        name: colMatch[2].trim(),
        city: '',
        type: 'Private',
        university: 'Default University'
      };
      
      const cities = ["Pune", "Mumbai", "Nagpur", "Nashik", "Sangli", "Amravati", "Aurangabad", "Karad", "Nanded", "Kolhapur", "Solapur", "Jalgaon", "Dhule", "Yavatmal", "Chandrapur", "Latur", "Akola", "Thane", "Navi Mumbai", "Palghar", "Ratnagiri", "Sindhudurg", "Raigad", "Noida", "Delhi"];
      for (const city of cities) {
        if (currentCollege.name.includes(city)) {
          currentCollege.city = city;
          break;
        }
      }
      if (!currentCollege.city) currentCollege.city = "Maharashtra";
      
      currentBranch = null;
      continue;
    }
    
    // 2. Detect Branch header (e.g. "0100219110 - Civil Engineering")
    const branchMatch = line.match(/^(\d{9,10})\s*-\s*([^\n]+)/);
    if (branchMatch && currentCollege) {
      currentBranch = {
        choiceCode: branchMatch[1],
        name: branchMatch[2].trim()
      };
      currentCategories = [];
      continue;
    }
    
    // 3. Detect Status line (e.g. "Status: Government Autonomous Home University : Autonomous Institute")
    if (line.startsWith('Status:') && currentCollege) {
      if (line.includes('Government')) {
        currentCollege.type = 'Government';
      }
      if (line.includes('Autonomous')) {
        currentCollege.type = currentCollege.type ? currentCollege.type + ' Autonomous' : 'Private Autonomous';
      }
      const univMatch = line.match(/Home University\s*:\s*([^\n]+)/);
      if (univMatch) {
        currentCollege.university = univMatch[1].trim();
      }
      continue;
    }
    
    // 4. Capture categories (GOPENS, GSCS, LOPENS, etc.)
    if (line.includes('GOPENS') || line.includes('LOPENS') || line.includes('EWS') || line.includes('TFWS') || line.includes('GOPENH') || line.includes('LOPENH')) {
      const items = line.split(/\s+/).filter(x => x.length >= 3 && /^[A-Z0-9]+$/.test(x));
      if (items.length > 0) {
        currentCategories = currentCategories.concat(items);
      }
      continue;
    }
    
    // 5. Detect cutoff line starts with "I " followed by ranks and percentiles
    if (line.startsWith('I ') && currentCollege && currentBranch && currentCategories.length > 0) {
      let valText = line.substring(2);
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().match(/^\d+$/) || lines[j].trim().match(/^\([\d\.]+\)$/) || lines[j].trim().startsWith('('))) {
        valText += ' ' + lines[j].trim();
        j++;
      }
      
      const matches = [];
      const regex = /(\d+)\s*\(([\d\.]+)\)/g;
      let match;
      while ((match = regex.exec(valText)) !== null) {
        matches.push({
          rank: parseInt(match[1]),
          percentile: parseFloat(match[2])
        });
      }
      
      matches.forEach((m, idx) => {
        const cat = currentCategories[idx];
        if (cat) {
          results.push({
            collegeCode: currentCollege.code,
            collegeName: currentCollege.name,
            city: currentCollege.city,
            type: currentCollege.type,
            university: currentCollege.university,
            choiceCode: currentBranch.choiceCode,
            branchName: currentBranch.name,
            admissionType: 'CET',
            year: 2024,
            round: 'CAP1',
            category: cat,
            percentile: m.percentile,
            rank: m.rank
          });
        }
      });
    }
  }
  
  return results;
}

// Parses lines from DSE (Direct Second Year) PDF text
function parseDseText(text) {
  const lines = text.split('\n');
  const results = [];
  
  let currentCollege = null;
  let currentBranch = null;
  let currentCategories = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 1. Detect College header (e.g. "1002 Government College of Engineering, Amravati (Government Autonomous)")
    const colMatch = line.match(/^(\d{4})\s+([^\n]+)/);
    if (colMatch && !line.includes('Choice Code') && !line.includes('Course Name') && !line.includes('Stage-I')) {
      currentCollege = {
        code: colMatch[1],
        name: colMatch[2].trim(),
        city: '',
        type: 'Private',
        university: 'Default University'
      };
      
      if (currentCollege.name.includes('Government')) {
        currentCollege.type = 'Government';
      }
      if (currentCollege.name.includes('Autonomous')) {
        currentCollege.type = currentCollege.type ? currentCollege.type + ' Autonomous' : 'Private Autonomous';
      }
      
      const cities = ["Pune", "Mumbai", "Nagpur", "Nashik", "Sangli", "Amravati", "Aurangabad", "Karad", "Nanded", "Kolhapur", "Solapur", "Jalgaon", "Dhule", "Yavatmal", "Chandrapur", "Latur", "Akola", "Thane", "Navi Mumbai", "Palghar", "Ratnagiri", "Sindhudurg", "Raigad", "Noida", "Delhi"];
      for (const city of cities) {
        if (currentCollege.name.includes(city)) {
          currentCollege.city = city;
          break;
        }
      }
      if (!currentCollege.city) currentCollege.city = "Maharashtra";
      
      currentBranch = null;
      continue;
    }
    
    // 2. Detect DSE Choice Code (e.g. "Choice Code : 100219110 Course Name : Civil Engineering")
    const choiceMatch = line.match(/Choice Code\s*:\s*(\d{9,10})\s*Course Name\s*:\s*([^\n]+)/);
    if (choiceMatch && currentCollege) {
      currentBranch = {
        choiceCode: choiceMatch[1],
        name: choiceMatch[2].trim()
      };
      currentCategories = [];
      continue;
    }
    
    // 3. Categories line (e.g. "GOPEN GST GOBC LOPEN LSC LSEBC EWS")
    if ((line.includes('GOPEN') || line.includes('LOPEN') || line.includes('EWS') || line.includes('GOBC') || line.includes('GSC')) && !line.includes('Choice Code') && !line.includes('Stage-I')) {
      const items = line.split(/\s+/).filter(x => x.length >= 3 && /^[A-Z0-9\-]+$/.test(x));
      if (items.length > 0) {
        currentCategories = items;
      }
      continue;
    }
    
    // 4. Capture cutoffs (e.g. "Stage-I 1282 (92.74%) 28609 (76.79%) ...")
    if (line.startsWith('Stage-I') && currentCollege && currentBranch && currentCategories.length > 0) {
      let valText = line.substring(7);
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().match(/^\d+$/) || lines[j].trim().match(/^\([\d\.\%]+\)$/) || lines[j].trim().startsWith('('))) {
        valText += ' ' + lines[j].trim();
        j++;
      }
      
      const matches = [];
      const regex = /(\d+)\s*\(([\d\.]+)\%\)/g;
      let match;
      while ((match = regex.exec(valText)) !== null) {
        matches.push({
          rank: parseInt(match[1]),
          percentile: parseFloat(match[2])
        });
      }
      
      matches.forEach((m, idx) => {
        const cat = currentCategories[idx];
        if (cat) {
          results.push({
            collegeCode: currentCollege.code,
            collegeName: currentCollege.name,
            city: currentCollege.city,
            type: currentCollege.type,
            university: currentCollege.university,
            choiceCode: currentBranch.choiceCode,
            branchName: currentBranch.name,
            admissionType: 'DSE',
            year: 2025,
            round: 'CAP1',
            category: cat,
            percentile: m.percentile,
            rank: m.rank
          });
        }
      });
    }
  }
  
  return results;
}

(async () => {
  console.log('Starting PDF extraction...');
  
  try {
    const allRecords = [];
    
    // 1. Process CET PDF
    if (fs.existsSync(cetPath)) {
      console.log(`Loading CET PDF: ${cetPath}`);
      const cetBuffer = fs.readFileSync(cetPath);
      const cetParser = new PDFParse(new Uint8Array(cetBuffer));
      
      // Extract entire text
      console.log('Extracting text from CET PDF...');
      const cetRes = await cetParser.getText();
      console.log('Parsing CET text records...');
      const cetRecords = parseCetText(cetRes.text);
      console.log(`Successfully parsed ${cetRecords.length} CET records.`);
      allRecords.push(...cetRecords);
    } else {
      console.warn(`CET PDF not found at ${cetPath}`);
    }
    
    // 2. Process DSE PDF
    if (fs.existsSync(dsePath)) {
      console.log(`Loading DSE PDF: ${dsePath}`);
      const dseBuffer = fs.readFileSync(dsePath);
      const dseParser = new PDFParse(new Uint8Array(dseBuffer));
      
      // Extract entire text
      console.log('Extracting text from DSE PDF...');
      const dseRes = await dseParser.getText();
      console.log('Parsing DSE text records...');
      const dseRecords = parseDseText(dseRes.text);
      console.log(`Successfully parsed ${dseRecords.length} DSE records.`);
      allRecords.push(...dseRecords);
    } else {
      console.warn(`DSE PDF not found at ${dsePath}`);
    }
    
    // Write out records
    console.log(`Writing ${allRecords.length} total records to ${outputPath}...`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(allRecords, null, 2), 'utf-8');
    console.log('Successfully completed PDF extraction and saved JSON!');
    
  } catch (err) {
    console.error('Error during extraction:', err);
    process.exit(1);
  }
})();
