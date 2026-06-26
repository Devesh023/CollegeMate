/**
 * Predictor pipeline diagnostic — run against live Supabase data
 * Usage: node scripts/predictor-diag.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { predictColleges } from '../src/services/predictor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnv() {
  const envPath = join(root, '.env');
  let text = readFileSync(envPath, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function loadGroupedCutoffs(supabase) {
  const { data: yrs } = await supabase.from('cutoff_years').select('*');
  const yearMap = new Map((yrs || []).map(y => [y.id, y.year]));
  const { data: rawColleges } = await supabase.from('colleges').select('*');
  const { data: rawBranches } = await supabase.from('branches').select('*');
  const { count } = await supabase.from('cutoffs').select('*', { count: 'exact', head: true });

  let rawCutoffs = [];
  for (let i = 0; i < (count || 0); i += 1000) {
    const { data, error } = await supabase.from('cutoffs').select('*').range(i, i + 999);
    if (error) throw error;
    rawCutoffs = rawCutoffs.concat(data || []);
  }

  const grouped = {};
  rawCutoffs.forEach(row => {
    const college = rawColleges.find(c => c.id === row.college_id);
    const branch = rawBranches.find(b => b.id === row.branch_id);
    if (!college || !branch) return;
    const yearVal = yearMap.get(row.year_id) || 2025;
    const key = `${college.id}-${branch.id}-${yearVal}-${row.round}-${row.gender || 'Co-Ed'}-${row.admission_type}`;
    if (!grouped[key]) {
      grouped[key] = {
        collegeId: college.id,
        collegeCode: college.college_code,
        branch: branch.branch_name,
        admissionType: row.admission_type,
        year: yearVal,
        round: row.round
      };
    }
    grouped[key][row.category] = parseFloat(row.cutoff_percentile);
  });

  const colleges = rawColleges.map(c => ({
    id: c.id,
    name: c.college_name,
    code: c.college_code,
    city: c.city,
    university: c.university,
    fees: c.fees || 120000
  }));

  return { cutoffs: Object.values(grouped), colleges, rawCount: rawCutoffs.length };
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { count: colCount } = await supabase.from('colleges').select('*', { count: 'exact', head: true });
  const { count: brCount } = await supabase.from('branches').select('*', { count: 'exact', head: true });
  const { count: cutCount } = await supabase.from('cutoffs').select('*', { count: 'exact', head: true });

  console.log('\n=== DATABASE COUNTS ===');
  console.log({ colleges: colCount, branches: brCount, cutoffs: cutCount });

  const { cutoffs, colleges, rawCount } = await loadGroupedCutoffs(supabase);
  console.log('\n=== GROUPED CUTOFFS ===', cutoffs.length, 'from', rawCount, 'raw rows');

  const scenarios = [
    { label: 'CET OPEN 96% (any branch)', profile: { score: 96, category: 'OPEN', admissionType: 'CET', gender: 'Male', branchPreference: '' } },
    { label: 'CET OPEN 96% (Computer Engineering)', profile: { score: 96, category: 'OPEN', admissionType: 'CET', gender: 'Male', branchPreference: 'Computer Engineering' } },
    { label: 'DSE OPEN 88% (any branch)', profile: { score: 88, category: 'OPEN', admissionType: 'DSE', gender: 'Male', branchPreference: '' } },
    { label: 'CET OBC 90% Female', profile: { score: 90, category: 'OBC', admissionType: 'CET', gender: 'Female', branchPreference: '' } }
  ];

  console.log('\n=== PREDICTOR SCENARIOS ===');
  for (const { label, profile } of scenarios) {
    const result = predictColleges(profile, colleges, cutoffs);
    console.log(`\n${label}:`);
    console.log('  filterTrace:', result.filterTrace);
    console.log('  buckets:', result.filterTrace.buckets, '| total:', result.allPredicted.length);
  }
}

main().catch(err => {
  console.error('Diagnostic failed:', err.message);
  process.exit(1);
});
