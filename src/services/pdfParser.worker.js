import './workerPolyfill.js';
import * as pdfjsLib from 'pdfjs-dist';

// Parse CET text
function parseCetText(text) {
  const lines = text.split('\n');
  const results = [];
  
  let currentCollege = null;
  let currentBranch = null;
  let currentCategories = [];
  let currentPage = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Track current page
    const pageMatch = line.match(/^-- (\d+) of \d+ --$/);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1]);
      continue;
    }
    
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
            rank: m.rank,
            pageNumber: currentPage
          });
        }
      });
    }
  }
  
  return results;
}

// Parse DSE text
function parseDseText(text) {
  const lines = text.split('\n');
  const results = [];
  
  let currentCollege = null;
  let currentBranch = null;
  let currentCategories = [];
  let currentPage = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Track current page
    const pageMatch = line.match(/^-- (\d+) of \d+ --$/);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1]);
      continue;
    }
    
    // 1. Detect College header (e.g. "1002 Government College of Engineering, Amravati")
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
    
    // 4. Capture cutoffs (e.g. "Stage-I 1282 (92.74%) ...")
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
            rank: m.rank,
            pageNumber: currentPage
          });
        }
      });
    }
  }
  
  return results;
}
self.onmessage = async (e) => {
  const { arrayBuffer, fileName } = e.data;
  let currentPageNum = 1;
  
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    const startTime = Date.now();

    for (let i = 1; i <= totalPages; i++) {
      currentPageNum = i;
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const items = textContent?.items || [];
      items.sort((a, b) => {
        if (Math.abs(a.transform[5] - b.transform[5]) < 2) {
          return a.transform[4] - b.transform[4];
        }
        return b.transform[5] - a.transform[5];
      });

      let lastY = null;
      let pageText = '';
      for (const item of items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
      
      fullText += pageText + `\n-- ${i} of ${totalPages} --\n`;
      
      const elapsed = Date.now() - startTime;
      const avgTimePerPage = elapsed / i;
      const remainingPages = totalPages - i;
      const etaSeconds = Math.ceil((remainingPages * avgTimePerPage) / 1000);

      self.postMessage({
        type: 'progress',
        data: {
          percent: Math.round((i / totalPages) * 100),
          currentPage: i,
          totalPages: totalPages,
          etaSeconds: etaSeconds
        }
      });
    }

    // Determine admission type from text or filename
    let admissionType = 'CET';
    if (fullText.includes('Direct Second Year') || fullText.includes('DSE') || fileName.includes('DSE')) {
      admissionType = 'DSE';
    }

    // Determine standard admission type code (will map to custom format during db insert)
    const parsedRecords = admissionType === 'CET' 
      ? parseCetText(fullText) 
      : parseDseText(fullText);

    self.postMessage({
      type: 'success',
      data: {
        records: parsedRecords,
        totalPages,
        parsedPages: totalPages,
        admissionType
      }
    });
  } catch (err) {
    console.error('PDF Worker Error:', err);
    self.postMessage({
      type: 'error',
      error: {
        message: err.message,
        stack: err.stack,
        fileName: fileName,
        pageNumber: currentPageNum,
        reason: err.message
      }
    });
  }
};
