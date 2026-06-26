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
  console.log("Querying unique universities from Supabase...");
  const { data, error } = await supabase
    .from('colleges')
    .select('university');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  const unis = new Set(data.map(c => c.university).filter(Boolean));
  console.log("Unique universities count:", unis.size);
  console.log("Values:");
  console.log(Array.from(unis).sort());
}

main();
