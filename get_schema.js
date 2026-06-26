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
  console.log("Checking colleges schema...");
  
  // Let's fetch the first college and inspect all keys in the object
  const { data, error } = await supabase.from('colleges').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log("First college keys:", Object.keys(data[0]));
    console.log("First college data:", data[0]);
  } else {
    console.log("No colleges found in the database.");
  }
}

main();
