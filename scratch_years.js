import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
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

async function main() {
  if (!dbService.cache) {
    dbService.cache = {
      colleges: null,
      branches: null,
      cutoffs: null,
      cutoffsFiltered: new Map()
    };
  }

  console.log("Fetching unique combinations from cutoffs...");
  const cutoffs = await dbService.getCutoffs();
  console.log("Total cutoffs grouped objects:", cutoffs.length);
  
  const combinations = {};
  cutoffs.forEach(c => {
    const key = `${c.admissionType}-${c.year}`;
    combinations[key] = (combinations[key] || 0) + 1;
  });
  
  console.log("AdmissionType - Year Counts:");
  console.log(combinations);
}

main();
