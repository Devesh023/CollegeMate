import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  console.log("Querying raw cutoff records for a few colleges...");
  
  // Let's get the first 50 cutoffs
  const { data: cutoffs, error } = await supabase
    .from('cutoffs')
    .select('*')
    .limit(50);
    
  if (error) {
    console.error("Error fetching cutoffs:", error);
    return;
  }
  
  console.log("Fetched", cutoffs.length, "rows.");
  console.log("First row columns:", Object.keys(cutoffs[0]));
  console.log("Sample rows:");
  console.log(cutoffs.slice(0, 5));
}

main();
