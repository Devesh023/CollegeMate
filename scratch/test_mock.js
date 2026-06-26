import { predictColleges } from '../src/services/predictor.js';
import { MOCK_COLLEGES, MOCK_CUTOFFS, MOCK_BRANCHES } from '../src/db/mockData.js';

function main() {
  console.log("Running prediction on MOCK DATA...");
  
  const studentProfile = {
    score: 98,
    category: 'OBC',
    admissionType: 'CET',
    branchPreference: 'Computer Science and Engineering',
    gender: 'Male',
    homeUniversity: 'SPPU (Pune)'
  };
  
  // Format colleges and branches to match what dbService returns
  // For MOCK_COLLEGES, map database keys (e.g. college_name -> name, college_code -> code)
  const colleges = MOCK_COLLEGES.map(c => ({
    ...c,
    id: c.id,
    code: c.college_code,
    name: c.college_name,
    university: c.university,
    city: c.city
  }));
  
  // Format mock cutoffs to match grouped format:
  // getCutoffs() groups row elements into aggregated objects
  // Each mock cutoff row has: college_id, branch_id, year_id, round, admission_type, category, gender, cutoff_percentile
  const yearMap = { 1: 2023, 2: 2024, 3: 2025 };
  const branchMap = {};
  MOCK_BRANCHES.forEach(b => {
    branchMap[b.id] = b.branch_name;
  });
  
  const grouped = {};
  MOCK_CUTOFFS.forEach(row => {
    const col = colleges.find(c => c.id === row.college_id);
    const branchName = branchMap[row.branch_id];
    if (!col || !branchName) return;
    
    const yearVal = yearMap[row.year_id] || 2025;
    const key = `${col.id}-${row.branch_id}-${yearVal}-${row.round}-${row.gender || 'Co-Ed'}-${row.admission_type}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        collegeId: col.id,
        collegeCode: col.code,
        collegeName: col.name,
        branch: branchName,
        admissionType: row.admission_type,
        year: yearVal,
        round: row.round,
        gender: row.gender || 'Co-Ed'
      };
    }
    
    grouped[key][row.category] = parseFloat(row.cutoff_percentile);
  });
  
  const cutoffsList = Object.values(grouped);
  console.log("Total grouped mock cutoffs:", cutoffsList.length);
  
  const results = predictColleges(studentProfile, colleges, cutoffsList);
  
  console.log("Results:");
  console.log("Dream:", results.dream.length);
  console.log("Moderate:", results.moderate.length);
  console.log("Safe:", results.safe.length);
  console.log("Reach:", results.reach.length);
  
  console.log("\nAll recommendations:");
  results.allPredicted.forEach(r => {
    console.log(`- ${r.collegeName} | ${r.branch} | Cutoff: ${r.cutoffScore} | Category: ${r.matchedCategory} | recommendation: ${r.recommendation}`);
  });
}

main();
