// Mock Database Seed Data - CollegeMate
// Matches the exact 10-table PostgreSQL/Supabase database schema

export const MOCK_USERS = [
  {
    id: "user-student-1",
    email: "student@collegemate.com",
    password: "student123",
    role: "student",
    profile: {
      id: "user-student-1",
      full_name: "Rajesh Kumar",
      email: "student@collegemate.com",
      role: "student",
      admission_type: "CET",
      category: "OBC",
      gender: "Male",
      home_university: "SPPU (Pune)",
      branch_preference: "Computer Engineering",
      savedColleges: [2, 3] // reference ids
    }
  },
  {
    id: "user-admin-1",
    email: "admin@collegemate.com",
    password: "admin123",
    role: "admin",
    profile: {
      id: "user-admin-1",
      full_name: "Professor Deshmukh",
      email: "admin@collegemate.com",
      role: "admin",
      admission_type: "CET",
      category: "OPEN",
      gender: "Male"
    }
  }
];

export const MOCK_BRANCHES = [
  { id: 1, branch_name: "Computer Engineering", branch_code: "CS" },
  { id: 2, branch_name: "Information Technology", branch_code: "IT" },
  { id: 3, branch_name: "Electronics & Telecommunication", branch_code: "ENTC" },
  { id: 4, branch_name: "Mechanical Engineering", branch_code: "MECH" },
  { id: 5, branch_name: "Civil Engineering", branch_code: "CIVIL" },
  { id: 6, branch_name: "Artificial Intelligence & Data Science", branch_code: "AIDS" }
];

export const MOCK_YEARS = [
  { id: 1, year: 2023 },
  { id: 2, year: 2024 },
  { id: 3, year: 2025 }
];

export const MOCK_COLLEGES = [
  {
    id: 1,
    college_code: "6006",
    college_name: "COEP Technological University, Pune",
    city: "Pune",
    district: "Pune",
    university: "Savitribai Phule Pune University (SPPU)",
    college_type: "Government Autonomous",
    website: "https://www.coep.org.in",
    placement_percentage: 92,
    average_package: 11.5,
    fees: 135000,
    hostel_available: true,
    description: "COEP Technological University is one of the oldest engineering colleges in Asia, established in 1854. Located in Pune, it is highly prestigious with state-of-the-art facilities and top-tier placements.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 2,
    college_code: "3012",
    college_name: "Veermata Jijabai Technological Institute (VJTI), Mumbai",
    city: "Mumbai",
    district: "Mumbai",
    university: "Mumbai University (MU)",
    college_type: "Government Aided",
    website: "https://www.vjti.ac.in",
    placement_percentage: 95,
    average_package: 12.0,
    fees: 85000,
    hostel_available: true,
    description: "Established in 1887, VJTI is a premier academic institution in Mumbai known for its highly competitive admissions and brilliant academic standards.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 3,
    college_code: "6271",
    college_name: "Pune Institute of Computer Technology (PICT), Pune",
    city: "Pune",
    district: "Pune",
    university: "Savitribai Phule Pune University (SPPU)",
    college_type: "Private Unaided",
    website: "https://pict.edu",
    placement_percentage: 96,
    average_package: 9.8,
    fees: 110000,
    hostel_available: true,
    description: "PICT is an elite private institution widely regarded as the Mecca of Software Engineers in Pune. It is extremely focused on computer science and electronics fields.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 4,
    college_code: "3199",
    college_name: "Sardar Patel Institute of Technology (SPIT), Mumbai",
    city: "Mumbai",
    district: "Mumbai",
    university: "Mumbai University (MU)",
    college_type: "Private Autonomous",
    website: "https://www.spit.ac.in",
    placement_percentage: 94,
    average_package: 10.2,
    fees: 172000,
    hostel_available: false,
    description: "Located in Andheri, Mumbai, SPIT is an autonomous institute outstanding in technical research and placements, drawing top companies annually.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 5,
    college_code: "6171",
    college_name: "Vishwakarma Institute of Technology (VIT), Pune",
    city: "Pune",
    district: "Pune",
    university: "Savitribai Phule Pune University (SPPU)",
    college_type: "Private Autonomous",
    website: "https://www.vit.edu",
    placement_percentage: 88,
    average_package: 7.2,
    fees: 185000,
    hostel_available: false,
    description: "VIT Pune is a leading private autonomous college featuring a choice-based credit system and very strong connections to local industries.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 6,
    college_code: "6282",
    college_name: "Walchand College of Engineering (WCE), Sangli",
    city: "Sangli",
    district: "Sangli",
    university: "Shivaji University",
    college_type: "Government Aided",
    website: "http://www.walchandsangli.ac.in",
    placement_percentage: 89,
    average_package: 8.5,
    fees: 88000,
    hostel_available: true,
    description: "Walchand College of Engineering is a heritage college in Sangli with a massive green campus and exceptionally strong cutoff trends for outer-city students.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 7,
    college_code: "4115",
    college_name: "Shri Ramdeobaba College of Engineering (RCOEM), Nagpur",
    city: "Nagpur",
    district: "Nagpur",
    university: "Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)",
    college_type: "Private Autonomous",
    website: "https://www.rknec.edu",
    placement_percentage: 87,
    average_package: 6.8,
    fees: 160000,
    hostel_available: true,
    description: "The top-ranked private engineering institute in the Vidarbha region, known for discipline, excellent faculty, and highly organized placements.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 8,
    college_code: "5121",
    college_name: "K. K. Wagh Institute of Engineering (KKWIEER), Nashik",
    city: "Nashik",
    district: "Nashik",
    university: "Savitribai Phule Pune University (SPPU)",
    college_type: "Private Unaided",
    website: "https://engg.kkwagh.edu.in",
    placement_percentage: 82,
    average_package: 5.2,
    fees: 128000,
    hostel_available: true,
    description: "KK Wagh is the oldest and most respected engineering college in Nashik, maintaining excellent academic standards and student environments.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 9,
    college_code: "6005",
    college_name: "Government College of Engineering, Karad",
    city: "Karad",
    district: "Satara",
    university: "Shivaji University",
    college_type: "Government Autonomous",
    website: "http://www.gcekarad.ac.in",
    placement_percentage: 83,
    average_package: 6.0,
    fees: 72000,
    hostel_available: true,
    description: "An autonomous institute of the Government of Maharashtra, widely recognized for quality teaching and affordable education.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 10,
    college_code: "3196",
    college_name: "Dwarkadas J. Sanghvi College of Engineering (DJSCE), Mumbai",
    city: "Mumbai",
    district: "Mumbai",
    university: "Mumbai University (MU)",
    college_type: "Private Autonomous",
    website: "https://www.djsce.ac.in",
    placement_percentage: 91,
    average_package: 8.9,
    fees: 195000,
    hostel_available: false,
    description: "Managed by Vile Parle Kelavani Mandal (SVKM), DJSCE is a premium private autonomous institute in Mumbai with elite coding culture.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 11,
    college_code: "6175",
    college_name: "Pimpri Chinchwad College of Engineering (PCCOE), Pune",
    city: "Pune",
    district: "Pune",
    university: "Savitribai Phule Pune University (SPPU)",
    college_type: "Private Autonomous",
    website: "https://www.pccoe.com",
    placement_percentage: 90,
    average_package: 7.0,
    fees: 135000,
    hostel_available: true,
    description: "PCCOE is highly reputed in Pune for its placement rates and academic discipline, consistently featuring high cutoff percentages.",
    logo_url: "/src/assets/logocm.png"
  },
  {
    id: 12,
    college_code: "2008",
    college_name: "Government College of Engineering, Aurangabad",
    city: "Aurangabad",
    district: "Aurangabad",
    university: "Dr. Babasaheb Ambedkar Marathwada University (BAMU)",
    college_type: "Government Autonomous",
    website: "https://geca.ac.in",
    placement_percentage: 84,
    average_package: 6.2,
    fees: 65000,
    hostel_available: true,
    description: "GECA is a prominent government autonomous engineering college established in 1864, serving as a hub of technical education in Marathwada.",
    logo_url: "/src/assets/logocm.png"
  }
];

// Helper to expand a structured cutoff object into individual category rows
const expandCutoff = (collegeId, branchId, yearId, admissionType, cutoffOpen, cutoffObc, cutoffSc, cutoffSt, round = 'CAP1') => {
  return [
    { college_id: collegeId, branch_id: branchId, year_id: yearId, round, admission_type: admissionType, category: 'OPEN', gender: 'Co-Ed', cutoff_percentile: cutoffOpen },
    { college_id: collegeId, branch_id: branchId, year_id: yearId, round, admission_type: admissionType, category: 'OBC', gender: 'Co-Ed', cutoff_percentile: cutoffObc },
    { college_id: collegeId, branch_id: branchId, year_id: yearId, round, admission_type: admissionType, category: 'SC', gender: 'Co-Ed', cutoff_percentile: cutoffSc },
    { college_id: collegeId, branch_id: branchId, year_id: yearId, round, admission_type: admissionType, category: 'ST', gender: 'Co-Ed', cutoff_percentile: cutoffSt }
  ];
};

export const MOCK_CUTOFFS = [
  // --- COEP (collegeId: 1) ---
  ...expandCutoff(1, 1, 3, 'CET', 99.85, 99.72, 98.45, 96.12), // CS, 2025
  ...expandCutoff(1, 3, 3, 'CET', 99.25, 98.90, 97.10, 94.00), // ENTC, 2025
  ...expandCutoff(1, 4, 3, 'CET', 98.10, 97.30, 94.50, 90.20), // MECH, 2025
  ...expandCutoff(1, 5, 3, 'CET', 96.50, 95.20, 91.80, 87.00), // CIVIL, 2025
  
  ...expandCutoff(1, 1, 2, 'CET', 99.80, 99.68, 98.30, 95.90), // CS, 2024
  ...expandCutoff(1, 3, 2, 'CET', 99.10, 98.75, 96.80, 93.50), // ENTC, 2024
  ...expandCutoff(1, 4, 2, 'CET', 97.80, 97.00, 94.10, 89.80), // MECH, 2024
  ...expandCutoff(1, 5, 2, 'CET', 96.20, 94.80, 91.30, 86.50), // CIVIL, 2024

  ...expandCutoff(1, 1, 1, 'CET', 99.78, 99.60, 98.15, 95.50), // CS, 2023
  ...expandCutoff(1, 3, 1, 'CET', 98.95, 98.50, 96.40, 93.00), // ENTC, 2023

  ...expandCutoff(1, 1, 3, 'DSE', 96.80, 95.90, 93.20, 89.50), // CS DSE, 2025
  ...expandCutoff(1, 3, 3, 'DSE', 94.50, 93.10, 91.00, 87.00), // ENTC DSE, 2025
  ...expandCutoff(1, 1, 2, 'DSE', 96.20, 95.40, 92.80, 88.90), // CS DSE, 2024

  // --- VJTI (collegeId: 2) ---
  ...expandCutoff(2, 1, 3, 'CET', 99.91, 99.78, 98.70, 96.50), // CS, 2025
  ...expandCutoff(2, 2, 3, 'CET', 99.75, 99.55, 98.20, 95.10), // IT, 2025
  ...expandCutoff(2, 3, 3, 'CET', 99.15, 98.80, 97.00, 93.80), // ENTC, 2025
  ...expandCutoff(2, 4, 3, 'CET', 97.90, 97.10, 93.80, 89.50), // MECH, 2025
  ...expandCutoff(2, 5, 3, 'CET', 95.80, 94.30, 90.90, 85.80), // CIVIL, 2025

  ...expandCutoff(2, 1, 2, 'CET', 99.88, 99.74, 98.60, 96.20), // CS, 2024
  ...expandCutoff(2, 2, 2, 'CET', 99.69, 99.48, 98.05, 94.80), // IT, 2024
  ...expandCutoff(2, 3, 2, 'CET', 99.02, 98.65, 96.75, 93.20), // ENTC, 2024

  ...expandCutoff(2, 1, 3, 'DSE', 97.20, 96.40, 94.10, 90.50), // CS DSE, 2025
  ...expandCutoff(2, 2, 3, 'DSE', 96.50, 95.80, 93.00, 88.90), // IT DSE, 2025

  // --- PICT (collegeId: 3) ---
  ...expandCutoff(3, 1, 3, 'CET', 99.45, 99.15, 97.40, 92.50), // CS, 2025
  ...expandCutoff(3, 2, 3, 'CET', 99.18, 98.85, 96.85, 91.00), // IT, 2025
  ...expandCutoff(3, 3, 3, 'CET', 98.20, 97.75, 95.20, 89.00), // ENTC, 2025
  ...expandCutoff(3, 6, 3, 'CET', 98.85, 98.40, 96.00, 90.00), // AIDS, 2025

  ...expandCutoff(3, 1, 2, 'CET', 99.38, 99.05, 97.20, 92.00), // CS, 2024
  ...expandCutoff(3, 2, 2, 'CET', 99.08, 98.70, 96.60, 90.50), // IT, 2024
  ...expandCutoff(3, 3, 2, 'CET', 98.05, 97.55, 94.90, 88.50), // ENTC, 2024

  ...expandCutoff(3, 1, 3, 'DSE', 95.80, 94.90, 91.80, 86.50), // CS DSE, 2025
  ...expandCutoff(3, 2, 3, 'DSE', 95.10, 94.20, 91.00, 85.00), // IT DSE, 2025

  // --- SPIT (collegeId: 4) ---
  ...expandCutoff(4, 1, 3, 'CET', 99.50, 99.18, 97.50, 92.80), // CS, 2025
  ...expandCutoff(4, 2, 3, 'CET', 99.25, 98.90, 97.00, 91.50), // IT, 2025
  ...expandCutoff(4, 3, 3, 'CET', 98.40, 97.90, 95.50, 89.20), // ENTC, 2025
  ...expandCutoff(4, 6, 3, 'CET', 98.95, 98.55, 96.20, 90.50), // AIDS, 2025
  
  ...expandCutoff(4, 1, 2, 'CET', 99.40, 99.10, 97.35, 92.20), // CS, 2024
  ...expandCutoff(4, 1, 3, 'DSE', 95.95, 95.10, 92.00, 87.00), // CS DSE, 2025

  // --- VIT (collegeId: 5) ---
  ...expandCutoff(5, 1, 3, 'CET', 98.20, 97.80, 94.50, 88.00), // CS, 2025
  ...expandCutoff(5, 2, 3, 'CET', 97.80, 97.30, 93.90, 86.80), // IT, 2025
  ...expandCutoff(5, 3, 3, 'CET', 96.10, 95.40, 91.50, 84.00), // ENTC, 2025
  ...expandCutoff(5, 4, 3, 'CET', 91.50, 89.80, 84.20, 78.50), // MECH, 2025
  ...expandCutoff(5, 6, 3, 'CET', 97.10, 96.50, 93.00, 85.50), // AIDS, 2025

  ...expandCutoff(5, 1, 2, 'CET', 98.02, 97.55, 94.20, 87.50), // CS, 2024
  ...expandCutoff(5, 1, 3, 'DSE', 93.80, 92.50, 89.00, 83.50), // CS DSE, 2025

  // --- WCE Sangli (collegeId: 6) ---
  ...expandCutoff(6, 1, 3, 'CET', 98.90, 98.45, 96.20, 90.00), // CS, 2025
  ...expandCutoff(6, 3, 3, 'CET', 97.35, 96.80, 94.00, 87.50), // ENTC, 2025
  ...expandCutoff(6, 4, 3, 'CET', 94.20, 92.95, 89.10, 81.00), // MECH, 2025
  ...expandCutoff(6, 5, 3, 'CET', 91.80, 89.50, 85.00, 77.80), // CIVIL, 2025
  
  ...expandCutoff(6, 1, 2, 'CET', 98.75, 98.30, 95.95, 89.50), // CS, 2024
  ...expandCutoff(6, 1, 3, 'DSE', 94.20, 93.10, 90.20, 85.00), // CS DSE, 2025

  // --- RCOEM (collegeId: 7) ---
  ...expandCutoff(7, 1, 3, 'CET', 97.80, 96.90, 93.50, 85.00), // CS, 2025
  ...expandCutoff(7, 2, 3, 'CET', 97.10, 96.20, 92.80, 84.00), // IT, 2025
  ...expandCutoff(7, 3, 3, 'CET', 95.00, 93.80, 89.90, 80.50), // ENTC, 2025
  ...expandCutoff(7, 6, 3, 'CET', 96.50, 95.40, 91.50, 82.50), // AIDS, 2025
  ...expandCutoff(7, 1, 3, 'DSE', 92.90, 91.50, 88.00, 82.00), // CS DSE, 2025

  // --- KK Wagh (collegeId: 8) ---
  ...expandCutoff(8, 1, 3, 'CET', 95.20, 94.10, 89.50, 80.00), // CS, 2025
  ...expandCutoff(8, 2, 3, 'CET', 94.10, 92.85, 88.00, 78.50), // IT, 2025
  ...expandCutoff(8, 3, 3, 'CET', 90.50, 88.90, 83.00, 73.00), // ENTC, 2025
  ...expandCutoff(8, 4, 3, 'CET', 82.00, 79.50, 73.50, 64.00), // MECH, 2025
  ...expandCutoff(8, 5, 3, 'CET', 79.50, 76.80, 70.00, 62.00), // CIVIL, 2025
  ...expandCutoff(8, 1, 3, 'DSE', 90.20, 89.00, 85.50, 78.00), // CS DSE, 2025

  // --- GCE Karad (collegeId: 9) ---
  ...expandCutoff(9, 1, 3, 'CET', 96.85, 95.80, 92.50, 83.50), // CS, 2025
  ...expandCutoff(9, 3, 3, 'CET', 94.20, 92.95, 89.00, 78.00), // ENTC, 2025
  ...expandCutoff(9, 4, 3, 'CET', 89.10, 87.50, 82.00, 71.00), // MECH, 2025
  ...expandCutoff(9, 1, 3, 'DSE', 92.50, 91.20, 87.50, 81.00), // CS DSE, 2025

  // --- DJ Sanghvi (collegeId: 10) ---
  ...expandCutoff(10, 1, 3, 'CET', 99.10, 98.70, 96.80, 91.20), // CS, 2025
  ...expandCutoff(10, 2, 3, 'CET', 98.70, 98.20, 95.90, 89.80), // IT, 2025
  ...expandCutoff(10, 3, 3, 'CET', 97.10, 96.30, 93.00, 86.00), // ENTC, 2025
  ...expandCutoff(10, 6, 3, 'CET', 98.30, 97.80, 95.10, 88.50), // AIDS, 2025
  ...expandCutoff(10, 1, 3, 'DSE', 95.00, 93.90, 90.80, 84.50), // CS DSE, 2025

  // --- PCCOE (collegeId: 11) ---
  ...expandCutoff(11, 1, 3, 'CET', 98.80, 98.35, 96.00, 89.50), // CS, 2025
  ...expandCutoff(11, 2, 3, 'CET', 98.35, 97.90, 95.20, 88.00), // IT, 2025
  ...expandCutoff(11, 3, 3, 'CET', 96.90, 96.20, 93.00, 84.80), // ENTC, 2025
  ...expandCutoff(11, 1, 3, 'DSE', 94.10, 93.00, 89.80, 84.00), // CS DSE, 2025

  // --- GECA (collegeId: 12) ---
  ...expandCutoff(12, 1, 3, 'CET', 96.20, 95.05, 91.20, 81.00), // CS, 2025
  ...expandCutoff(12, 3, 3, 'CET', 93.10, 91.80, 87.00, 75.00), // ENTC, 2025
  ...expandCutoff(12, 4, 3, 'CET', 87.00, 85.10, 79.50, 68.00), // MECH, 2025
  ...expandCutoff(12, 5, 3, 'CET', 83.20, 80.90, 74.80, 65.00), // CIVIL, 2025
  ...expandCutoff(12, 1, 3, 'DSE', 91.80, 90.50, 86.50, 80.00)  // CS DSE, 2025
];

export const BRANCHES = [
  { code: "CS", name: "Computer Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "ENTC", name: "Electronics & Telecommunication" },
  { code: "MECH", name: "Mechanical Engineering" },
  { code: "CIVIL", name: "Civil Engineering" },
  { code: "AIDS", name: "Artificial Intelligence & Data Science" }
];

export const CITIES = ["Mumbai", "Pune", "Nagpur", "Nashik", "Sangli", "Aurangabad", "Amravati"];

export const UNIVERSITIES = [
  "Savitribai Phule Pune University (SPPU)",
  "Mumbai University (MU)",
  "Shivaji University",
  "Dr. Babasaheb Ambedkar Technological University (DBATU)",
  "Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)",
  "Dr. Babasaheb Ambedkar Marathwada University (BAMU)",
  "Sant Gadge Baba Amravati University (SGBAU)"
];
