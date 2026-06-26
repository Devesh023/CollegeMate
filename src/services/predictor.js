// Prediction Engine Logic - CollegeMate

/** UI labels (CET/DSE) ↔ database values (FIRST_YEAR_ENGINEERING/DIRECT_SECOND_YEAR_ENGINEERING) */
export const ADMISSION_TYPE_MAP = {
  CET: 'FIRST_YEAR_ENGINEERING',
  DSE: 'DIRECT_SECOND_YEAR_ENGINEERING',
  FIRST_YEAR_ENGINEERING: 'CET',
  DIRECT_SECOND_YEAR_ENGINEERING: 'DSE'
};

export const normalizeAdmissionType = (admissionType) => {
  if (!admissionType) return 'CET';
  const upper = String(admissionType).toUpperCase();
  if (upper === 'FIRST_YEAR_ENGINEERING' || upper === 'CET') return 'CET';
  if (upper === 'DIRECT_SECOND_YEAR_ENGINEERING' || upper === 'DSE') return 'DSE';
  return admissionType;
};

export const getDbAdmissionTypes = (uiAdmissionType) => {
  const normalized = normalizeAdmissionType(uiAdmissionType);
  if (normalized === 'CET') return ['CET', 'FIRST_YEAR_ENGINEERING'];
  if (normalized === 'DSE') return ['DSE', 'DIRECT_SECOND_YEAR_ENGINEERING'];
  return [uiAdmissionType];
};

export const matchesAdmissionType = (recordType, uiAdmissionType) => {
  return getDbAdmissionTypes(uiAdmissionType).includes(recordType);
};

export const resolveTargetYear = (admissionType, cutoffs) => {
  const dbTypes = getDbAdmissionTypes(admissionType);
  const years = cutoffs
    .filter(c => dbTypes.includes(c.admissionType))
    .map(c => c.year)
    .filter(y => y != null && !isNaN(y));

  if (years.length === 0) {
    return normalizeAdmissionType(admissionType) === 'CET' ? 2024 : 2025;
  }
  return Math.max(...years);
};

const normalizeBranchName = (name) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const branchMatchesPreference = (branchName, branchPreference) => {
  if (!branchPreference) return true;
  const cleanName = (branchName || '').toLowerCase();
  const cleanPref = branchPreference.toLowerCase();
  
  if (cleanName === cleanPref || cleanName.includes(cleanPref) || cleanPref.includes(cleanName)) {
    return true;
  }
  
  if (normalizeBranchName(branchName).includes(normalizeBranchName(branchPreference)) ||
      normalizeBranchName(branchPreference).includes(normalizeBranchName(branchName))) {
    return true;
  }

  // Smart group matches for Computer / IT (Computer, CSE, IT, Data Science, AI/ML, Cyber Security, etc.)
  const isComputerPref = cleanPref.includes('computer') || cleanPref.includes('information technology') || cleanPref.includes('comp') || cleanPref.includes('cse') || cleanPref.includes('it');
  const isComputerBranch = cleanName.includes('computer') || cleanName.includes('information technology') || cleanName.includes('comp') || cleanName.includes('cse') || cleanName.includes('it') || cleanName.includes('software');

  if (isComputerPref && isComputerBranch) {
    return true;
  }

  // Smart group matches for Electronics / Entc / Electrical
  const isElectronicsPref = cleanPref.includes('electron') || cleanPref.includes('telecommun') || cleanPref.includes('entc') || cleanPref.includes('extc') || cleanPref.includes('instrument') || cleanPref.includes('electr');
  const isElectronicsBranch = cleanName.includes('electron') || cleanName.includes('telecommun') || cleanName.includes('entc') || cleanName.includes('extc') || cleanName.includes('instrument') || cleanName.includes('electr');

  if (isElectronicsPref && isElectronicsBranch) {
    return true;
  }

  return false;
};

/**
 * Maps standard categories and genders to granular keys used in real CET & DSE cutoff PDFs
 */
export const getMatchingCategoryKeys = (category, gender, admissionType) => {
  const isFemale = gender?.toLowerCase() === 'female';
  
  const openKeys = isFemale 
    ? ['LOPENH', 'LOPENO', 'LOPENS', 'GOPENH', 'GOPENO', 'GOPENS', 'LOPEN', 'GOPEN', 'OPEN'] 
    : ['GOPENH', 'GOPENO', 'GOPENS', 'GOPEN', 'OPEN'];

  if (admissionType === 'CET' || admissionType === 'FIRST_YEAR_ENGINEERING') {
    switch (category) {
      case 'OPEN':
        return openKeys;
      case 'OBC':
        return isFemale 
          ? ['LOBCH', 'LOBCO', 'LOBCS', 'GOBCH', 'GOBCO', 'GOBCS', 'LOBC', 'GOBC', 'OBC', ...openKeys] 
          : ['GOBCH', 'GOBCO', 'GOBCS', 'GOBC', 'OBC', ...openKeys];
      case 'SC':
        return isFemale 
          ? ['LSCH', 'LSCO', 'LSCS', 'GSCH', 'GSCO', 'GSCS', 'LSC', 'GSC', 'SC', ...openKeys] 
          : ['GSCH', 'GSCO', 'GSCS', 'GSC', 'SC', ...openKeys];
      case 'ST':
        return isFemale 
          ? ['LSTH', 'LSTO', 'LSTS', 'GSTH', 'GSTO', 'GSTS', 'LST', 'GST', 'ST', ...openKeys] 
          : ['GSTH', 'GSTO', 'GSTS', 'GST', 'ST', ...openKeys];
      case 'VJ':
        return isFemale 
          ? ['LVJH', 'LVJO', 'LVJS', 'GVJH', 'GVJO', 'GVJS', 'LVJ', 'GVJ', 'VJ', 'NTA', 'LNTA', 'GNTA', ...openKeys] 
          : ['GVJH', 'GVJO', 'GVJS', 'GVJ', 'VJ', 'NTA', 'GNTA', ...openKeys];
      case 'NT-A':
        return isFemale 
          ? ['LNT1H', 'LNT1O', 'LNT1S', 'GNT1H', 'GNT1O', 'GNT1S', 'LNT1', 'GNT1', 'NT1', 'LNTA', 'GNTA', ...openKeys] 
          : ['GNT1H', 'GNT1O', 'GNT1S', 'GNT1', 'NT1', 'GNTA', ...openKeys];
      case 'NT-B':
        return isFemale 
          ? ['LNT2H', 'LNT2O', 'LNT2S', 'GNT2H', 'GNT2O', 'GNT2S', 'LNT2', 'GNT2', 'NT2', 'LNTB', 'GNTB', ...openKeys] 
          : ['GNT2H', 'GNT2O', 'GNT2S', 'GNT2', 'NT2', 'GNTB', ...openKeys];
      case 'NT-C':
        return isFemale 
          ? ['LNT3H', 'LNT3O', 'LNT3S', 'GNT3H', 'GNT3O', 'GNT3S', 'LNT3', 'GNT3', 'NT3', 'LNTC', 'GNTC', ...openKeys] 
          : ['GNT3H', 'GNT3O', 'GNT3S', 'GNT3', 'NT3', 'GNTC', ...openKeys];
      case 'NT-D':
        return isFemale 
          ? ['LNT4H', 'LNT4O', 'LNT4S', 'GNT4H', 'GNT4O', 'GNT4S', 'LNT4', 'GNT4', 'NT4', 'LNTD', 'GNTD', ...openKeys] 
          : ['GNT4H', 'GNT4O', 'GNT4S', 'GNT4', 'NT4', 'GNTD', ...openKeys];
      case 'SBC':
        return isFemale 
          ? ['LSBCS', 'LSBCH', 'LSBCO', 'GSBCS', 'GSBCH', 'GSBCO', 'LSBC', 'GSBC', 'SBC', ...openKeys] 
          : ['GSBCS', 'GSBCH', 'GSBCO', 'GSBC', 'SBC', ...openKeys];
      case 'SEBC':
        return isFemale 
          ? ['LSEBCS', 'LSEBCH', 'LSEBCO', 'GSEBCS', 'GSEBCH', 'GSEBCO', 'LSEBC', 'GSEBC', 'SEBC', ...openKeys] 
          : ['GSEBCS', 'GSEBCH', 'GSEBCO', 'GSEBC', 'SEBC', ...openKeys];
      case 'EWS':
        return ['EWS', ...openKeys];
      case 'TFWS':
        return ['TFWS', ...openKeys];
      case 'PWD':
        return isFemale 
          ? [
              'PWDOPENS', 'PWDOBCS', 'PWDSCS', 'PWDSTS', 'PWDOPENH', 'PWDOBCH', 'PWDSCH', 'PWDSTH', 
              'PWDOPEN', 'PWDOBC', 'PWDSC', 'PWDST', 'PWDR-OBC', 'PWDR-SC', 'PWDR-SEBC', 'PWDROBC H', 
              'PWDROBC S', 'PWDRSCS', 'PWDRSEBC S', 'PWDRSTH', 'PWDRSTS', 'PWDSCH', 'PWDSCS', 'PWDSEBCS', 
              'PWD-O', 'PWD', ...openKeys
            ]
          : [
              'PWDOPENS', 'PWDOBCS', 'PWDSCS', 'PWDSTS', 'PWDOPENH', 'PWDOBCH', 'PWDSCH', 'PWDSTH', 
              'PWDOPEN', 'PWDOBC', 'PWDSC', 'PWDST', 'PWDR-OBC', 'PWDR-SC', 'PWDR-SEBC', 'PWDROBC H', 
              'PWDROBC S', 'PWDRSCS', 'PWDRSEBC S', 'PWDRSTH', 'PWDRSTS', 'PWDSCH', 'PWDSCS', 'PWDSEBCS', 
              'PWD-O', 'PWD', ...openKeys
            ].filter(k => !k.startsWith('L'));
      case 'DEFENCE':
        return isFemale 
          ? [
              'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSTS', 'DEFOPENH', 'DEFOBCH', 'DEFSCH', 'DEFSTH', 
              'DEFOPEN', 'DEFOBC', 'DEFSC', 'DEFST', 'DEFOBCS', 'DEFOPENS', 'DEFROBCS', 'DEFRSCS', 
              'DEFRSEBC S', 'DEFRVJS', 'DEFSCS', 'DEFSEBCS', 'DEF-O', 'DEFR-OBC', 'DEFR-SC', 'DEFR-SEBC', 
              'DEFRNT1S', 'DEFRNT2S', 'DEF', ...openKeys
            ]
          : [
              'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSTS', 'DEFOPENH', 'DEFOBCH', 'DEFSCH', 'DEFSTH', 
              'DEFOPEN', 'DEFOBC', 'DEFSC', 'DEFST', 'DEFOBCS', 'DEFOPENS', 'DEFROBCS', 'DEFRSCS', 
              'DEFRSEBC S', 'DEFRVJS', 'DEFSCS', 'DEFSEBCS', 'DEF-O', 'DEFR-OBC', 'DEFR-SC', 'DEFR-SEBC', 
              'DEFRNT1S', 'DEFRNT2S', 'DEF', ...openKeys
            ].filter(k => !k.startsWith('L'));
      case 'ORPHAN':
        return ['ORPHAN', ...openKeys];
      default:
        return [category, ...openKeys];
    }
  } else {
    // DSE (Direct Second Year)
    const dseOpenKeys = isFemale 
      ? ['LOPEN', 'GOPEN', 'OPEN', 'LOPENH', 'LOPENO', 'LOPENS', 'GOPENH', 'GOPENO', 'GOPENS'] 
      : ['GOPEN', 'OPEN', 'GOPENH', 'GOPENO', 'GOPENS'];
      
    switch (category) {
      case 'OPEN':
        return dseOpenKeys;
      case 'OBC':
        return isFemale 
          ? ['LOBC', 'GOBC', 'OBC', 'LOBCS', 'LOBCH', 'LOBCO', 'GOBCS', 'GOBCH', 'GOBCO', ...dseOpenKeys] 
          : ['GOBC', 'OBC', 'GOBCS', 'GOBCH', 'GOBCO', ...dseOpenKeys];
      case 'SC':
        return isFemale 
          ? ['LSC', 'GSC', 'SC', 'LSCS', 'LSCH', 'LSCO', 'GSCS', 'GSCH', 'GSCO', ...dseOpenKeys] 
          : ['GSC', 'SC', 'GSCS', 'GSCH', 'GSCO', ...dseOpenKeys];
      case 'ST':
        return isFemale 
          ? ['LST', 'GST', 'ST', 'LSTS', 'LSTH', 'LSTO', 'GSTS', 'GSTH', 'GSTO', ...dseOpenKeys] 
          : ['GST', 'ST', 'GSTS', 'GSTH', 'GSTO', ...dseOpenKeys];
      case 'VJ':
        return isFemale 
          ? ['LVJ', 'GVJ', 'VJ', 'LVJS', 'LVJH', 'LVJO', 'GVJS', 'GVJH', 'GVJO', ...dseOpenKeys] 
          : ['GVJ', 'VJ', 'GVJS', 'GVJH', 'GVJO', ...dseOpenKeys];
      case 'NT-A':
        return isFemale 
          ? ['LNT1', 'GNT1', 'NT1', 'LNT1S', 'LNT1H', 'LNT1O', 'GNT1S', 'GNT1H', 'GNT1O', ...dseOpenKeys] 
          : ['GNT1', 'NT1', 'GNT1S', 'GNT1H', 'GNT1O', ...dseOpenKeys];
      case 'NT-B':
        return isFemale 
          ? ['LNT2', 'GNT2', 'NT2', 'LNT2S', 'LNT2H', 'LNT2O', 'GNT2S', 'GNT2H', 'GNT2O', ...dseOpenKeys] 
          : ['GNT2', 'NT2', 'GNT2S', 'GNT2H', 'GNT2O', ...dseOpenKeys];
      case 'NT-C':
        return isFemale 
          ? ['LNT3', 'GNT3', 'NT3', 'LNT3S', 'LNT3H', 'LNT3O', 'GNT3S', 'GNT3H', 'GNT3O', ...dseOpenKeys] 
          : ['GNT3', 'NT3', 'GNT3S', 'GNT3H', 'GNT3O', ...dseOpenKeys];
      case 'NT-D':
        return isFemale 
          ? ['LNT4', 'GNT4', 'NT4', 'LNT4S', 'LNT4H', 'LNT4O', 'GNT4S', 'GNT4H', 'GNT4O', ...dseOpenKeys] 
          : ['GNT4', 'NT4', 'GNT4S', 'GNT4H', 'GNT4O', ...dseOpenKeys];
      case 'SBC':
        return isFemale 
          ? ['LSBC', 'GSBC', 'SBC', 'LSBCS', 'LSBCH', 'LSBCO', 'GSBCS', 'GSBCH', 'GSBCO', ...dseOpenKeys] 
          : ['GSBC', 'SBC', 'GSBCS', 'GSBCH', 'GSBCO', ...dseOpenKeys];
      case 'SEBC':
        return isFemale 
          ? ['LSEBC', 'GSEBC', 'SEBC', 'LSEBCS', 'LSEBCH', 'LSEBCO', 'GSEBCS', 'GSEBCH', 'GSEBCO', ...dseOpenKeys] 
          : ['GSEBC', 'SEBC', 'GSEBCS', 'GSEBCH', 'GSEBCO', ...dseOpenKeys];
      case 'EWS':
        return ['EWS', ...dseOpenKeys];
      case 'TFWS':
        return ['TFWS', ...dseOpenKeys];
      case 'PWD':
        return isFemale 
          ? [
              'PWDOPENS', 'PWDOBCS', 'PWDSCS', 'PWDSTS', 'PWDOPEN', 'PWDOBC', 'PWDSC', 'PWDST', 
              'PWDR-OBC', 'PWDR-SC', 'PWDR-SEBC', 'PWD-O', 'PWD', ...dseOpenKeys
            ]
          : [
              'PWDOPENS', 'PWDOBCS', 'PWDSCS', 'PWDSTS', 'PWDOPEN', 'PWDOBC', 'PWDSC', 'PWDST', 
              'PWDR-OBC', 'PWDR-SC', 'PWDR-SEBC', 'PWD-O', 'PWD', ...dseOpenKeys
            ].filter(k => !k.startsWith('L'));
      case 'DEFENCE':
        return isFemale 
          ? [
              'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSTS', 'DEFOPEN', 'DEFOBC', 'DEFSC', 'DEFST', 
              'DEF-O', 'DEFR-OBC', 'DEFR-SC', 'DEFR-SEBC', 'DEF', ...dseOpenKeys
            ]
          : [
              'DEFOPENS', 'DEFOBCS', 'DEFSCS', 'DEFSTS', 'DEFOPEN', 'DEFOBC', 'DEFSC', 'DEFST', 
              'DEF-O', 'DEFR-OBC', 'DEFR-SC', 'DEFR-SEBC', 'DEF', ...dseOpenKeys
            ].filter(k => !k.startsWith('L'));
      case 'ORPHAN':
        return ['ORPHAN', ...dseOpenKeys];
      default:
        return [category, ...dseOpenKeys];
    }
  }
};

export const resolveCollegeUniversity = (college) => {
  if (!college) return 'Default University';
  let uni = college.university || '';
  if (uni && uni !== 'Default University' && uni !== 'Default' && uni !== 'Autonomous Institute' && uni !== 'Non-Autonomous Institute') {
    return uni;
  }
  
  const city = (college.city || '').toLowerCase();
  const name = (college.name || college.college_name || '').toLowerCase();
  
  if (city.includes('pune') || city.includes('nashik') || city.includes('ahmednagar')) {
    return 'Savitribai Phule Pune University (SPPU)';
  }
  if (city.includes('mumbai') || city.includes('thane') || city.includes('navi mumbai') || city.includes('raigad')) {
    return 'Mumbai University (MU)';
  }
  if (city.includes('nagpur') || city.includes('wardha')) {
    return 'Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)';
  }
  if (city.includes('sangli') || city.includes('kolhapur') || city.includes('satara') || city.includes('karad')) {
    return 'Shivaji University';
  }
  if (city.includes('aurangabad') || city.includes('sambhajinagar') || city.includes('jalna') || city.includes('nanded')) {
    return 'Dr. Babasaheb Ambedkar Marathwada University (BAMU)';
  }
  if (city.includes('amravati') || city.includes('akola') || city.includes('yavatmal')) {
    return 'Sant Gadge Baba Amravati University (SGBAU)';
  }
  if (city.includes('jalgaon') || city.includes('dhule') || city.includes('nandurbar')) {
    return 'Kavayitri Bahinabai Chaudhari North Maharashtra University (KBCNMU)';
  }
  
  if (name.includes('sppu') || name.includes('pune')) return 'Savitribai Phule Pune University (SPPU)';
  if (name.includes('mumbai') || name.includes(' vjti') || name.includes('spit')) return 'Mumbai University (MU)';
  if (name.includes('nagpur') || name.includes('rtmnu')) return 'Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)';
  
  return uni || 'Default University';
};

/**
 * Predicts admission chances for a student based on score, category, admission type, and branch.
 * @param {Object} studentProfile - { score, category, admissionType, branchPreference, homeUniversity, gender }
 * @param {Array} colleges - List of all colleges
 * @param {Array} cutoffs - List of all cutoffs
 * @returns {Object} { safe: [], moderate: [], dream: [], reach: [], allPredicted: [] }
 */
export const predictColleges = (studentProfile, colleges, cutoffs) => {
  console.time("predictorCalculations");
  const { score, category, admissionType, branchPreference, homeUniversity, gender } = studentProfile;
  const numScore = parseFloat(score);
  const uiAdmissionType = normalizeAdmissionType(admissionType);

  const filterTrace = {
    rawRecords: cutoffs?.length || 0,
    afterAdmission: 0,
    afterYear: 0,
    afterCategory: 0,
    afterBranch: 0,
    afterGrouping: 0,
    finalRecommendations: 0,
    uniqueCollegesCount: 0,
    uniqueBranchesCount: 0,
    groupingKey: 'college_code-branch_name',
    buckets: { safe: 0, moderate: 0, dream: 0, reach: 0 },
    targetYear: null,
    uiAdmissionType,
    dbAdmissionTypes: getDbAdmissionTypes(admissionType),
    skippedNoCollege: 0,
    skippedNoScore: 0,
    skippedDuplicate: 0
  };

  if (isNaN(numScore) || !cutoffs?.length) {
    console.warn('[Predictor] Invalid score or empty cutoffs', { numScore, cutoffCount: cutoffs?.length });
    return { safe: [], moderate: [], dream: [], reach: [], allPredicted: [], filterTrace };
  }

  const results = {
    safe: [],
    moderate: [],
    dream: [],
    reach: [],
    allPredicted: []
  };

  const targetYear = resolveTargetYear(admissionType, cutoffs);
  filterTrace.targetYear = targetYear;

  const afterAdmission = cutoffs.filter(c => matchesAdmissionType(c.admissionType, admissionType));
  filterTrace.afterAdmission = afterAdmission.length;

  const afterYear = afterAdmission.filter(c => c.year === targetYear);
  filterTrace.afterYear = afterYear.length;

  const categoryKeys = getMatchingCategoryKeys(category, gender, uiAdmissionType);
  const afterCategory = afterYear.filter(c => {
    for (const key of categoryKeys) {
      if (c[key] !== undefined && c[key] !== null && !isNaN(parseFloat(c[key]))) {
        return true;
      }
    }
    return false;
  });
  filterTrace.afterCategory = afterCategory.length;

  const afterBranch = afterCategory.filter(c => branchMatchesPreference(c.branch, branchPreference));
  filterTrace.afterBranch = afterBranch.length;

  console.log('[Predictor] Stage counts:', {
    Raw: filterTrace.rawRecords,
    Admission: filterTrace.afterAdmission,
    Year: filterTrace.afterYear,
    Category: filterTrace.afterCategory,
    Branch: filterTrace.afterBranch
  });

  console.log('[Predictor] First 20 records before grouping:', afterBranch.slice(0, 20).map(r => ({
    collegeCode: r.collegeCode || r.college_code,
    collegeName: r.collegeName,
    branch: r.branch,
    year: r.year,
    admissionType: r.admissionType
  })));

  const relevantCutoffs = afterBranch;

  // O(1) college lookup — avoid .find() returning wrong matches inside the loop
  const collegeById = new Map();
  const collegeByCode = new Map();
  colleges.forEach(col => {
    if (col.id != null) collegeById.set(Number(col.id), col);
    if (col.code != null && col.code !== '') collegeByCode.set(String(col.code), col);
  });

  const resolveCollege = (cutoff) => {
    if (cutoff.collegeId != null) {
      const byId = collegeById.get(Number(cutoff.collegeId));
      if (byId) return byId;
    }
    const code = cutoff.collegeCode || cutoff.college_code;
    if (code != null && code !== '') {
      return collegeByCode.get(String(code)) || null;
    }
    return null;
  };

  // Deduplicate by college_code + branch_name (NOT branch_name alone)
  const predictedKeys = new Map();

  const parseRoundNumber = (r) => {
    if (r == null) return 0;
    const parsed = parseInt(r);
    if (!isNaN(parsed)) return parsed;
    const match = String(r).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Sort relevantCutoffs so we process the latest round first (gives student the best eligibility chance)
  const sortedCutoffs = [...afterBranch].sort((a, b) => parseRoundNumber(b.round) - parseRoundNumber(a.round));

  const homeUniversityMatches = (collegeUniversity, studentUniversity) => {
    if (!collegeUniversity || !studentUniversity) return false;
    const getTokens = (str) => {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
    };
    const collegeTokens = getTokens(collegeUniversity);
    const studentTokens = getTokens(studentUniversity);
    const abbreviations = ['sppu', 'rtmnu', 'dbatu', 'mu', 'shivaji'];
    for (const abbrev of abbreviations) {
      if (collegeTokens.includes(abbrev) && studentTokens.includes(abbrev)) {
        return true;
      }
    }
    return collegeUniversity.toLowerCase().includes(studentUniversity.toLowerCase()) || 
           studentUniversity.toLowerCase().includes(collegeUniversity.toLowerCase());
  };

  sortedCutoffs.forEach(cutoff => {
    const college = resolveCollege(cutoff);
    if (!college) {
      filterTrace.skippedNoCollege++;
      return;
    }

    const collegeCode = college.code || cutoff.collegeCode || cutoff.college_code || '';
    const branchName = cutoff.branch || cutoff.branch_name || '';
    const uniqueKey = `${collegeCode}-${branchName}`;

    if (predictedKeys.has(uniqueKey)) {
      filterTrace.skippedDuplicate++;
      return;
    }

    const matchedCategoryKeys = getMatchingCategoryKeys(category, gender, uiAdmissionType);
    
    // Filter keys based on Home University eligibility:
    // H seats are reserved for Home University students.
    // O seats are for Other than Home University students.
    // S and suffix-less seats are State-Level/General (accessible to all).
    const resolvedUni = resolveCollegeUniversity(college);
    const isHomeDb = homeUniversity && homeUniversityMatches(resolvedUni, homeUniversity);
    const eligibleCategoryKeys = matchedCategoryKeys.filter(key => {
      const cleanKey = key.toUpperCase();
      if (cleanKey.endsWith('H') && !cleanKey.endsWith('O H') && !cleanKey.endsWith('S H')) {
        return isHomeDb; // Only eligible if this is the student's Home University
      }
      if (cleanKey.endsWith('O') || cleanKey.endsWith('O H') || cleanKey.endsWith('O S')) {
        return !isHomeDb; // Only eligible if this is OUTSIDE the student's Home University
      }
      return true; // State level or General are open to all
    });

    let cutoffScore = null;
    let matchedCatKey = 'OPEN';

    for (const key of eligibleCategoryKeys) {
      if (cutoff[key] !== undefined && cutoff[key] !== null) {
        cutoffScore = parseFloat(cutoff[key]);
        matchedCatKey = key;
        break;
      }
    }

    if (cutoffScore === null || isNaN(cutoffScore)) {
      filterTrace.skippedNoScore++;
      return;
    }

    const difference = numScore - cutoffScore; // studentPercentile - cutoff

    let categoryType = 'safe';
    let matchRating = 'Safe';
    let probability = 98;

    // New Classification:
    // Dream: difference <= 0 (includes former Dream and Reach buckets)
    // Moderate: difference > 0 && difference <= 1.5
    // Safe: difference > 1.5
    if (difference <= 0) {
      categoryType = 'dream';
      matchRating = 'Dream';
      probability = Math.max(5, Math.round(50 + (difference * 15)));
    } else if (difference <= 1.5) {
      categoryType = 'moderate';
      matchRating = 'Moderate';
      probability = Math.round(85 - (difference * 15));
    } else {
      categoryType = 'safe';
      matchRating = 'Safe';
      probability = Math.round(85 + ((difference - 1.5) / 4.0) * 12);
      if (probability > 98) probability = 98;
    }

    let finalProbability = Math.round(probability);
    if (homeUniversity && homeUniversityMatches(resolvedUni, homeUniversity)) {
      finalProbability = Math.min(98, finalProbability + 2);
    }

    const matchedRank = cutoff[`${matchedCatKey}_rank`] || cutoff.rank || null;

    const predictionResult = {
      collegeId: college.id,
      collegeName: college.name,
      code: collegeCode,
      city: college.city,
      university: college.university,
      fees: college.fees,
      placementRating: college.placementRating || 4.2,
      placementPercentage: college.placementPercentage || 84,
      averagePackage: college.averagePackage || 5.5,
      highestPackage: college.highestPackage || 15.0,
      branch: branchName,
      choiceCode: cutoff.choiceCode,
      cutoffScore,
      matchedCategory: matchedCatKey,
      rank: matchedRank,
      difference: parseFloat(difference.toFixed(2)),
      probability: finalProbability,
      matchRating,
      recommendation: categoryType
    };

    predictedKeys.set(uniqueKey, predictionResult);

    if (categoryType === 'safe') {
      results.safe.push(predictionResult);
      filterTrace.buckets.safe++;
    } else if (categoryType === 'moderate') {
      results.moderate.push(predictionResult);
      filterTrace.buckets.moderate++;
    } else if (categoryType === 'dream') {
      results.dream.push(predictionResult);
      filterTrace.buckets.dream++;
    } else {
      results.reach.push(predictionResult);
      filterTrace.buckets.reach++;
    }

    results.allPredicted.push(predictionResult);
  });

  filterTrace.afterGrouping = predictedKeys.size;
  filterTrace.finalRecommendations = results.allPredicted.length;
  filterTrace.uniqueCollegesCount = new Set(results.allPredicted.map(r => r.code)).size;
  filterTrace.uniqueBranchesCount = new Set(results.allPredicted.map(r => r.branch)).size;

  const sorter = (a, b) => {
    if (b.cutoffScore !== a.cutoffScore) {
      return b.cutoffScore - a.cutoffScore;
    }
    const aPlacement = a.placementPercentage || 0;
    const bPlacement = b.placementPercentage || 0;
    if (bPlacement !== aPlacement) {
      return bPlacement - aPlacement;
    }
    return (b.averagePackage || 0) - (a.averagePackage || 0);
  };
  results.safe.sort(sorter);
  results.moderate.sort(sorter);
  results.dream.sort(sorter);
  results.reach.sort(sorter);
  results.allPredicted.sort(sorter);

  console.log('[Predictor] Grouping key:', filterTrace.groupingKey);
  console.log('[Predictor] Stage counts (continued):', {
    Grouping: filterTrace.afterGrouping,
    'Final Recommendations': filterTrace.finalRecommendations
  });
  console.log('[Predictor] Unique Colleges:', filterTrace.uniqueCollegesCount);
  console.log('[Predictor] Unique Branches:', filterTrace.uniqueBranchesCount);
  console.log('[Predictor] Final Recommendation Count:', filterTrace.finalRecommendations);
  console.log('[Predictor] Top 20 recommendations:', results.allPredicted.slice(0, 20).map(r => ({
    college: r.collegeName,
    code: r.code,
    branch: r.branch,
    cutoff: r.cutoffScore,
    bucket: r.recommendation
  })));
  console.log('[Predictor] Skipped:', {
    noCollege: filterTrace.skippedNoCollege,
    noScore: filterTrace.skippedNoScore,
    duplicate: filterTrace.skippedDuplicate
  });

  try {
    const count = parseInt(localStorage.getItem('collegemate_predictions_generated') || '0');
    localStorage.setItem('collegemate_predictions_generated', (count + 1).toString());
  } catch (e) {
    // localStorage unavailable in non-browser contexts
  }

  console.timeEnd("predictorCalculations");
  return { ...results, filterTrace };
};

/**
 * Calculates historical cutoff trend for a college and branch
 */
export const getCutoffHistory = (collegeId, branch, admissionType, cutoffs) => {
  const history = cutoffs.filter(c =>
    (c.collegeId == collegeId || c.college_id == collegeId) &&
    (c.branch === branch || c.branch_name === branch) &&
    matchesAdmissionType(c.admissionType, admissionType)
  );
  
  return history.map(h => ({
    year: h.year,
    OPEN: h.OPEN || h.GOPENS || h.GOPEN || null,
    OBC: h.OBC || h.GOBCS || h.GOBC || null,
    SC: h.SC || h.GSCS || h.GSC || null,
    ST: h.ST || h.GSTS || h.GST || null
  })).sort((a, b) => a.year - b.year);
};
