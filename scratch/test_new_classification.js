import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { dbService } from '../src/services/dbService.js';

const envContent = fs.readFileSync('./.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function getMatchingCategoryKeys(category, gender, admissionType) {
  const isFemale = gender?.toLowerCase() === 'female';
  const openKeys = isFemale 
    ? ['LOPENH', 'LOPENO', 'LOPENS', 'GOPENH', 'GOPENO', 'GOPENS', 'LOPEN', 'GOPEN', 'OPEN'] 
    : ['GOPENH', 'GOPENO', 'GOPENS', 'GOPEN', 'OPEN']; // Exclude Ladies keys for Male

  if (admissionType === 'CET' || admissionType === 'FIRST_YEAR_ENGINEERING') {
    switch (category) {
      case 'OPEN':
        return openKeys;
      case 'OBC':
        return isFemale 
          ? ['LOBCH', 'LOBCO', 'LOBCS', 'GOBCH', 'GOBCO', 'GOBCS', 'LOBC', 'GOBC', 'OBC', ...openKeys] 
          : ['GOBCH', 'GOBCO', 'GOBCS', 'GOBC', 'OBC', ...openKeys];
      case 'SC':
        return isFemale 
          ? ['LSCH', 'LSCO', 'LSCS', 'GSCH', 'GSCO', 'GSCS', 'LSC', 'GSC', 'SC', ...openKeys] 
          : ['GSCH', 'GSCO', 'GSCS', 'GSC', 'SC', ...openKeys];
      case 'ST':
        return isFemale 
          ? ['LSTH', 'LSTO', 'LSTS', 'GSTH', 'GSTO', 'GSTS', 'LST', 'GST', 'ST', ...openKeys] 
          : ['GSTH', 'GSTO', 'GSTS', 'GST', 'ST', ...openKeys];
      default:
        return [category, ...openKeys];
    }
  } else {
    const dseOpenKeys = isFemale 
      ? ['LOPEN', 'GOPEN', 'OPEN', 'LOPENH', 'LOPENO', 'LOPENS', 'GOPENH', 'GOPENO', 'GOPENS'] 
      : ['GOPEN', 'OPEN', 'GOPENH', 'GOPENO', 'GOPENS'];

    switch (category) {
      case 'OPEN':
        return dseOpenKeys;
      case 'OBC':
        return isFemale 
          ? ['LOBC', 'GOBC', 'OBC', 'LOBCS', 'LOBCH', 'LOBCO', 'GOBCS', 'GOBCH', 'GOBCO', ...dseOpenKeys] 
          : ['GOBC', 'OBC', 'GOBCS', 'GOBCH', 'GOBCO', ...dseOpenKeys];
      case 'SC':
        return isFemale 
          ? ['LSC', 'GSC', 'SC', 'LSCS', 'LSCH', 'LSCO', 'GSCS', 'GSCH', 'GSCO', ...dseOpenKeys] 
          : ['GSC', 'SC', 'GSCS', 'GSCH', 'GSCO', ...dseOpenKeys];
      case 'ST':
        return isFemale 
          ? ['LST', 'GST', 'ST', 'LSTS', 'LSTH', 'LSTO', 'GSTS', 'GSTH', 'GSTO', ...dseOpenKeys] 
          : ['GST', 'ST', 'GSTS', 'GSTH', 'GSTO', ...dseOpenKeys];
      default:
        return [category, ...dseOpenKeys];
    }
  }
}

const normalizeBranchName = (name) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const branchMatchesPreference = (branchName, branchPreference) => {
  if (!branchPreference) return true;
  const cleanName = (branchName || '').toLowerCase();
  const cleanPref = branchPreference.toLowerCase();
  
  if (cleanName === cleanPref || cleanName.includes(cleanPref) || cleanPref.includes(cleanName)) {
    return true;
  }
  
  if (normalizeBranchName(branchName).includes(normalizeBranchName(branchPreference)) ||
      normalizeBranchName(branchPreference).includes(normalizeBranchName(branchName))) {
    return true;
  }

  // Smart group matches for Computer / IT
  const isComputerPref = cleanPref.includes('computer') || cleanPref.includes('information technology') || cleanPref.includes('comp') || cleanPref.includes('cse') || cleanPref.includes('it');
  const isComputerBranch = cleanName.includes('computer') || cleanName.includes('information technology') || cleanName.includes('comp') || cleanName.includes('cse') || cleanName.includes('it') || cleanName.includes('software');

  if (isComputerPref && isComputerBranch) {
    return true;
  }
  return false;
};

const homeUniversityMatches = (collegeUniversity, studentUniversity) => {
  if (!collegeUniversity || !studentUniversity) return false;
  const getTokens = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  };
  const collegeTokens = getTokens(collegeUniversity);
  const studentTokens = getTokens(studentUniversity);
  const abbreviations = ['sppu', 'rtmnu', 'dbatu', 'mu', 'shivaji'];
  for (const abbrev of abbreviations) {
    if (collegeTokens.includes(abbrev) && studentTokens.includes(abbrev)) {
      return true;
    }
  }
  return collegeUniversity.toLowerCase().includes(studentUniversity.toLowerCase()) || 
         studentUniversity.toLowerCase().includes(collegeUniversity.toLowerCase());
};

async function testPredictor(studentPercentile, admissionType) {
  console.log(`\n=========================================`);
  console.log(`TEST: Percentile ${studentPercentile} | OBC | CSE | Pathway: ${admissionType}`);
  console.log(`=========================================`);

  const colleges = await dbService.getColleges();
  const cutoffs = await dbService.getCutoffsFiltered({ admissionType });

  const category = 'OBC';
  const gender = 'Male';
  const branchPreference = 'Computer Science and Engineering';
  const homeUniversity = 'SPPU (Pune)';
  
  const numScore = parseFloat(studentPercentile);
  
  const targetYear = admissionType === 'CET' ? 2024 : 2025;
  const afterAdmission = cutoffs.filter(c => c.admissionType === (admissionType === 'CET' ? 'FIRST_YEAR_ENGINEERING' : 'DIRECT_SECOND_YEAR_ENGINEERING'));
  const afterYear = afterAdmission.filter(c => c.year === targetYear);
  const afterBranch = afterYear.filter(c => branchMatchesPreference(c.branch, branchPreference));

  const collegeByCode = new Map();
  colleges.forEach(col => {
    if (col.code != null && col.code !== '') collegeByCode.set(String(col.code), col);
  });

  const sortedCutoffs = [...afterBranch].sort((a, b) => {
    const parseRound = r => {
      const match = String(r).match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };
    return parseRound(b.round) - parseRound(a.round);
  });

  const predictedKeys = new Map();
  const results = { dream: [], reach: [], moderate: [], safe: [] };

  sortedCutoffs.forEach(cutoff => {
    const college = collegeByCode.get(String(cutoff.collegeCode || cutoff.college_code));
    if (!college) return;

    const uniqueKey = `${college.code}-${cutoff.branch}`;
    if (predictedKeys.has(uniqueKey)) return;

    const matchedCategoryKeys = getMatchingCategoryKeys(category, gender, admissionType);
    const isHomeDb = homeUniversity && homeUniversityMatches(college.university, homeUniversity);
    const eligibleCategoryKeys = matchedCategoryKeys.filter(key => {
      const cleanKey = key.toUpperCase();
      if (cleanKey.endsWith('H') && !cleanKey.endsWith('O H') && !cleanKey.endsWith('S H')) return isHomeDb;
      if (cleanKey.endsWith('O') || cleanKey.endsWith('O H') || cleanKey.endsWith('O S')) return !isHomeDb;
      return true;
    });

    let cutoffScore = null;
    let matchedCatKey = 'OPEN';
    for (const key of eligibleCategoryKeys) {
      if (cutoff[key] !== undefined && cutoff[key] !== null) {
        cutoffScore = parseFloat(cutoff[key]);
        matchedCatKey = key;
        break;
      }
    }

    if (cutoffScore === null || isNaN(cutoffScore)) return;

    const difference = numScore - cutoffScore; // positive means student score is higher

    let recommendation = 'safe';
    
    // New Classification Scheme:
    // Dream: cutoff is > 2% above student (difference < -2.0)
    // Reach: cutoff is 0 to 2% above student (-2.0 <= difference < 0)
    // Moderate: cutoff is 0 to 1% below student (0 <= difference <= 1.0)
    // Safe: cutoff is > 1% below student (difference > 1.0)
    if (difference < -2.0) {
      recommendation = 'dream';
    } else if (difference < 0) {
      recommendation = 'reach';
    } else if (difference <= 1.0) {
      recommendation = 'moderate';
    } else {
      recommendation = 'safe';
    }

    const prediction = {
      collegeName: college.name,
      branch: cutoff.branch,
      cutoffScore,
      difference,
      recommendation,
      code: college.code
    };

    predictedKeys.set(uniqueKey, prediction);
    results[recommendation].push(prediction);
  });

  console.log(`Counts:`);
  console.log(`  Dream: ${results.dream.length}`);
  console.log(`  Reach: ${results.reach.length}`);
  console.log(`  Moderate: ${results.moderate.length}`);
  console.log(`  Safe: ${results.safe.length}`);
  
  const printBucket = (name, list) => {
    console.log(`\n--- First 10 in ${name.toUpperCase()} ---`);
    list.sort((a, b) => b.cutoffScore - a.cutoffScore);
    list.slice(0, 10).forEach((item, idx) => {
      console.log(`  ${idx+1}: ${item.collegeName.slice(0, 60).padEnd(60)} | ${item.branch.slice(0, 30).padEnd(30)} | Cutoff: ${item.cutoffScore} | Diff: ${item.difference.toFixed(2)}`);
    });
  };

  printBucket('dream', results.dream);
  printBucket('reach', results.reach);
  printBucket('moderate', results.moderate);
  printBucket('safe', results.safe);
}

async function main() {
  if (!dbService.cache) {
    dbService.cache = { colleges: null, branches: null, cutoffs: null, cutoffsFiltered: new Map() };
  }
  await testPredictor(98, 'CET');
}

main();
