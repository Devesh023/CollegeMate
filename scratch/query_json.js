import fs from 'fs';

async function main() {
  console.log("Loading realCutoffData.json...");
  const rawData = fs.readFileSync('src/db/realCutoffData.json', 'utf8');
  const data = JSON.parse(rawData);
  
  console.log("Keys in realCutoffData:", Object.keys(data));
  console.log("Colleges count:", data.colleges?.length);
  console.log("Branches count:", data.branches?.length);
  console.log("Categories count:", data.categories?.length);
  console.log("Cutoffs count:", data.cutoffs?.length);
  
  console.log("\nSample college:");
  console.log(data.colleges?.[0]);
  
  console.log("\nSample branch:");
  console.log(data.branches?.[0]);
  
  console.log("\nSample cutoff:");
  console.log(data.cutoffs?.[0]);
}

main();
