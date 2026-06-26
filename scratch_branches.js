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
  const { data, error } = await supabase.from('branches').select('branch_name');
  if (error) {
    console.error("Error:", error);
    return;
  }
  const uniqueBranches = new Set(data.map(b => b.branch_name));
  console.log("Total unique branches in DB:", uniqueBranches.size);
  console.log(Array.from(uniqueBranches).sort().slice(0, 100));
}

main();
