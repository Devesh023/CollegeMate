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
  console.log("Querying colleges where city is Maharashtra...");
  const { data: colleges, error } = await supabase
    .from('colleges')
    .select('college_code, college_name, city, university, district')
    .eq('city', 'Maharashtra');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Found ${colleges.length} colleges:`);
  colleges.forEach(c => {
    console.log(`- Code: ${c.college_code} | Name: ${c.college_name} | City: ${c.city} | University: ${c.university} | District: ${c.district}`);
  });
}

main();
