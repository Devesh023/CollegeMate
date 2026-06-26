import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { predictColleges } from './src/services/predictor.js';
import { dbService } from './src/services/dbService.js';

const envContent = fs.readFileSync('./.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runTest(percentile, admissionType) {
  console.log(`\n======================================================================`);
  console.log(`TESTING: ${percentile} Percentile | Category: OBC | Branch: CSE | Pathway: ${admissionType}`);
  console.log(`======================================================================`);
  
  // Fetch colleges
  const colleges = await dbService.getColleges();
  
  // Fetch cutoffs
  const cutoffs = await dbService.getCutoffsFiltered({ admissionType });
  
  const studentProfile = {
    score: percentile,
    category: 'OBC',
    admissionType: admissionType,
    branchPreference: 'Computer Science and Engineering', // this matches CSE, CE, IT due to our smart group match
    gender: 'Male',
    homeUniversity: 'SPPU (Pune)'
  };
  
  const results = predictColleges(studentProfile, colleges, cutoffs);
  
  console.log(`Bucket Counts:`);
  console.log(`  - Dream: ${results.dream.length}`);
  console.log(`  - Moderate: ${results.moderate.length}`);
  console.log(`  - Safe: ${results.safe.length}`);
  console.log(`  - Reach: ${results.reach.length}`);
  console.log(`  - Total: ${results.allPredicted.length}`);
  
  const printBucket = (name, list) => {
    console.log(`\n--- First 20 Colleges in [${name.toUpperCase()}] Bucket ---`);
    if (list.length === 0) {
      console.log("  (None found)");
      return;
    }
    list.slice(0, 20).forEach((item, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}: ${item.collegeName.padEnd(80)} | ${item.branch.padEnd(40)} | Cutoff: ${item.cutoffScore} (Diff: ${item.difference >= 0 ? '+' : ''}${item.difference}) | Code: ${item.code}`);
    });
  };

  printBucket('Dream', results.dream);
  printBucket('Moderate', results.moderate);
  printBucket('Safe', results.safe);
  printBucket('Reach', results.reach);
}

async function main() {
  if (!dbService.cache) {
    dbService.cache = {
      colleges: null,
      branches: null,
      cutoffs: null,
      cutoffsFiltered: new Map()
    };
  }
  
  try {
    const percentiles = [98, 97, 95, 90, 85];
    for (const pct of percentiles) {
      await runTest(pct, 'CET');
    }
    for (const pct of percentiles) {
      await runTest(pct, 'DSE');
    }
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

main();
