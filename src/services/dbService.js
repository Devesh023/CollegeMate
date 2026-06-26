// Database Service - Dual mode (Supabase vs LocalStorage)
// Connects UI models to the 10-table normalized Supabase PostgreSQL schema
import { createClient } from '@supabase/supabase-js';
import { MOCK_COLLEGES, MOCK_CUTOFFS, MOCK_USERS, MOCK_BRANCHES, MOCK_YEARS } from '../db/mockData';
import realCutoffData from '../db/realCutoffData.json';

// Check if Supabase configurations are present
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

console.log(`CollegeMate DB Sync: ${isSupabaseConfigured ? 'Supabase cloud' : 'LocalStorage fall-back'}`);

// In-memory cache for API optimization
export const cache = {
  colleges: null,
  branches: null,
  cutoffs: null,
  years: null,
  collegeByCode: new Map(),
  cutoffsFiltered: new Map()
};

export const mapUniversityByCity = (city, defaultUni) => {
  const uni = defaultUni || '';
  if (!uni || uni === 'Default University' || uni === 'Default') {
    return null;
  }
  return defaultUni;
};

/** Resolve college/branch rows without undefined===undefined false matches in .find() */
const cleanBracketSuffix = (name) => {
  if (!name) return { name: '', badges: [] };
  const match = name.match(/\s*\(([^)]+)\)\s*$/);
  if (match) {
    const rawSuffix = match[1];
    const cleanedName = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    let badges = [];
    const lower = rawSuffix.toLowerCase();
    
    if (lower.includes('autonomous')) {
      badges.push('Autonomous');
    }
    if (lower.includes('government') || lower.includes('govt')) {
      badges.push('Government');
    } else if (lower.includes('private')) {
      badges.push('Private');
    } else if (lower.includes('university department') || lower.includes('university dept')) {
      badges.push('University Department');
    } else if (lower.includes('self finance') || lower.includes('self-finance')) {
      badges.push('Self Finance');
    } else if (lower.includes('un-aided') || lower.includes('unaided')) {
      badges.push('Un-Aided');
    } else if (lower.includes('aided')) {
      badges.push('Aided');
    }
    
    if (badges.length === 0) {
      badges.push(rawSuffix);
    }
    return { name: cleanedName, badges };
  }
  return { name: name.trim(), badges: [] };
};

const generateBadges = (col) => {
  const badges = new Set();
  const nameParse = cleanBracketSuffix(col.name);
  nameParse.badges.forEach(b => badges.add(b));
  
  if (col.type) {
    const lowerType = col.type.toLowerCase();
    if (lowerType.includes('autonomous')) badges.add('Autonomous');
    if (lowerType.includes('government') || lowerType.includes('govt')) badges.add('Government');
    if (lowerType.includes('private')) badges.add('Private');
    if (lowerType.includes('university department') || lowerType.includes('university dept')) badges.add('University Department');
    if (lowerType.includes('self finance') || lowerType.includes('self-finance')) badges.add('Self Finance');
    if (lowerType.includes('un-aided') || lowerType.includes('unaided')) badges.add('Un-Aided');
    if (lowerType.includes('aided')) badges.add('Aided');
  }
  return Array.from(badges);
};

const checkAutonomy = (col) => {
  const nameMatch = /\bautonomous\b/i.test(col.name);
  const typeMatch = col.type && /\bautonomous\b/i.test(col.type);
  const descMatch = col.description && /\bautonomous\b/i.test(col.description);
  return !!(nameMatch || typeMatch || descMatch);
};

const cleanName = (n) => {
  if (!n) return '';
  const parsed = cleanBracketSuffix(n).name;
  return parsed.replace(/,([^ ])/g, ', $1').trim();
};

/** Resolve college/branch rows without undefined===undefined false matches in .find() */
const buildCollegeBranchLookups = (rawColleges, rawBranches) => {
  const collegeById = new Map();
  const collegeByCode = new Map();
  rawColleges.forEach(c => {
    if (c.id != null) collegeById.set(Number(c.id), c);
    const code = c.college_code || c.code;
    if (code != null && code !== '') {
      const norm = String(code).trim().replace(/^0+/, '');
      collegeByCode.set(norm, c);
    }
  });

  const branchById = new Map();
  const branchByCode = new Map();
  rawBranches.forEach(b => {
    if (b.id != null) branchById.set(Number(b.id), b);
    for (const code of [b.choice_code, b.branch_code]) {
      if (code != null && code !== '') branchByCode.set(String(code), b);
    }
  });

  const resolveCollege = (row) => {
    if (row.college_id != null) {
      const match = collegeById.get(Number(row.college_id));
      if (match) return match;
    }
    if (row.college_code != null && row.college_code !== '') {
      const norm = String(row.college_code).trim().replace(/^0+/, '');
      return collegeByCode.get(norm) || null;
    }
    return null;
  };

  const resolveBranch = (row) => {
    if (row.branch_id != null) {
      const match = branchById.get(Number(row.branch_id));
      if (match) return match;
    }
    if (row.choice_code != null && row.choice_code !== '') {
      return branchByCode.get(String(row.choice_code)) || null;
    }
    return null;
  };

  return { resolveCollege, resolveBranch };
};

const STORAGE_KEYS = {
  COLLEGES: 'collegemate_colleges_norm',
  CUTOFFS: 'collegemate_cutoffs_norm',
  USERS: 'collegemate_users',
  BRANCHES: 'collegemate_branches_norm',
  YEARS: 'collegemate_years_norm',
  CUSTOM_COLLEGES: 'collegemate_custom_colleges',
  CUSTOM_BRANCHES: 'collegemate_custom_branches',
  CUSTOM_CUTOFFS: 'collegemate_custom_cutoffs'
};

// Memoized unpacked PDF data
let cachedUnpackedPdfData = null;

export const getUnpackedPdfData = () => {
  if (cachedUnpackedPdfData) return cachedUnpackedPdfData;
  
  const { colleges, branches, categories, cutoffs } = realCutoffData;
  
  // Unpack colleges
  const unpackedColleges = colleges.map((c, idx) => ({
    id: idx + 1,
    college_code: c[0],
    college_name: c[1],
    city: c[2],
    college_type: c[3] || 'Private Autonomous',
    university: c[4] || 'Default University',
    website: 'https://www.google.com',
    fees: c[3]?.includes('Government') ? 75000 : 135000,
    placement_percentage: 85,
    average_package: 5.5,
    hostel_available: c[1]?.toLowerCase().includes('hostel') || c[3]?.includes('Government'),
    description: `${c[1]} is a premier engineering college located in ${c[2]}, Maharashtra.`
  }));
  
  // Unpack branches
  const unpackedBranches = branches.map((b, idx) => ({
    id: idx + 1,
    choice_code: b[0],
    branch_name: b[1]
  }));
  
  // Unpack cutoffs
  const unpackedCutoffs = cutoffs.map((cut, idx) => {
    const colObj = unpackedColleges[cut[0]];
    const branchObj = unpackedBranches[cut[1]];
    const category = categories[cut[4]];
    const round = cut[3] === 1 ? 'CAP1' : (cut[3] === 2 ? 'CAP2' : 'CAP3');
    const admission_type = cut[7] === 1 ? 'CET' : 'DSE';
    
    return {
      id: idx + 1,
      college_id: colObj?.id,
      branch_id: branchObj?.id,
      college_code: colObj?.college_code,
      college_name: colObj?.college_name,
      choice_code: branchObj?.choice_code,
      branch_name: branchObj?.branch_name,
      year: cut[2],
      round,
      category,
      cutoff_percentile: cut[5],
      rank: cut[6],
      admission_type,
      gender: 'Co-Ed'
    };
  });
  
  cachedUnpackedPdfData = {
    colleges: unpackedColleges,
    branches: unpackedBranches,
    cutoffs: unpackedCutoffs
  };
  
  return cachedUnpackedPdfData;
};

export const initializeLocalDb = () => {
  if (isSupabaseConfigured) return;

  if (!localStorage.getItem(STORAGE_KEYS.COLLEGES)) {
    localStorage.setItem(STORAGE_KEYS.COLLEGES, JSON.stringify(MOCK_COLLEGES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUTOFFS)) {
    localStorage.setItem(STORAGE_KEYS.CUTOFFS, JSON.stringify(MOCK_CUTOFFS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  let admins = [];
  try {
    admins = JSON.parse(localStorage.getItem('collegemate_admin_users') || '[]');
  } catch (e) {
    admins = [];
  }

  let updatedAdmins = [...admins];
  let changed = false;

  if (!updatedAdmins.find(a => a.email.toLowerCase() === 'deveshsonawane023@gmail.com')) {
    updatedAdmins.push({
      id: "admin-devesh-id",
      email: "deveshsonawane023@gmail.com",
      password_hash: "24eb0b8fcfdaeec357c3c08142d4fb41f00db0e44a6577a338a679c28ef5c58c", // saiyug123
      full_name: "Devesh Sonawane",
      role: "admin",
      created_at: new Date()
    });
    changed = true;
  }

  if (!updatedAdmins.find(a => a.email.toLowerCase() === 'admin@collegemate.com')) {
    updatedAdmins.push({
      id: "admin-default-id",
      email: "admin@collegemate.com",
      password_hash: "240a8e3ee40b5275e7a00f074d284a141b4a622a578cc9d2d098e914041d1df3", // admin123
      full_name: "Admin User",
      role: "admin",
      created_at: new Date()
    });
    changed = true;
  }

  if (changed || !localStorage.getItem('collegemate_admin_users')) {
    localStorage.setItem('collegemate_admin_users', JSON.stringify(updatedAdmins));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(MOCK_BRANCHES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.YEARS)) {
    localStorage.setItem(STORAGE_KEYS.YEARS, JSON.stringify(MOCK_YEARS));
  }
};

export const dbService = {
  // Check if real database (Supabase) actually has records loaded
  async hasSupabaseData() {
    if (!isSupabaseConfigured) return false;
    try {
      const { count, error } = await supabase
        .from('colleges')
        .select('*', { count: 'exact', head: true })
        .limit(1);
      if (error) return false;
      return (count || 0) > 0;
    } catch {
      return false;
    }
  },

  async getAdminUser(email) {
    const entered_email = email.toLowerCase().trim();
    console.log('Entered Email:', entered_email);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', entered_email);

      console.log('Query Result:', data);
      console.log('Supabase Error:', error);
      console.log('Rows Returned:', data ? data.length : 0);

      if (error) {
        throw error;
      }
      return data && data.length > 0 ? data[0] : null;
    } else {
      initializeLocalDb();
      const admins = JSON.parse(localStorage.getItem('collegemate_admin_users') || '[]');
      const result = admins.find(a => a.email.toLowerCase() === entered_email) || null;
      console.log('Query Result (Mock):', result);
      console.log('Rows Returned (Mock):', result ? 1 : 0);
      return result;
    }
  },

  // 1. COLLEGES
  async getColleges() {
    if (cache.colleges) {
      console.log("[dbService] Returning cached colleges");
      return cache.colleges;
    }
    console.time("getColleges");

    let rawColleges = [];
    let rawCutoffs = [];
    let rawBranches = [];

    const hasSupa = await this.hasSupabaseData();

    if (hasSupa) {
      console.log("[dbService] Fetching colleges, branches, and branch relations in parallel...");
      const [colsRes, branchesRes, cutsRes] = await Promise.all([
        supabase.from('colleges').select('*'),
        supabase.from('branches').select('*'),
        supabase.from('cutoffs').select('college_id, branch_id')
      ]);

      if (colsRes.error) throw colsRes.error;
      if (branchesRes.error) throw branchesRes.error;
      if (cutsRes.error) throw cutsRes.error;

      rawColleges = colsRes.data || [];
      rawBranches = branchesRes.data || [];
      rawCutoffs = cutsRes.data || [];
    } else {
      // PDF Imported Data > Mock Data Fallback
      const pdfData = getUnpackedPdfData();
      
      // Load custom edits from local storage
      const localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      const localBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');
      
      // Merge colleges (custom overrides PDF data)
      const collegesMap = new Map();
      pdfData.colleges.forEach(c => collegesMap.set(c.id, c));
      localColleges.forEach(c => collegesMap.set(c.id, c));
      rawColleges = Array.from(collegesMap.values());
      
      // Merge cutoffs
      rawCutoffs = [...pdfData.cutoffs, ...localCutoffs];
      
      // Merge branches
      const branchesMap = new Map();
      pdfData.branches.forEach(b => branchesMap.set(b.id, b));
      localBranches.forEach(b => branchesMap.set(b.id, b));
      rawBranches = Array.from(branchesMap.values());
      
      // If still empty (e.g. PDF parse failed), load Mock Data
      if (rawColleges.length === 0) {
        initializeLocalDb();
        rawColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLEGES));
        rawCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUTOFFS));
        rawBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES));
      }
    }

    // Map database columns to the flat object model expected by the UI
    const mapped = rawColleges.map(c => {
      const collegeId = c.id;
      
      // Find branches offered in this college
      const collegeCutoffs = rawCutoffs.filter(cut => cut.college_id === collegeId || cut.college_code === c.college_code);
      const uniqueBranchIds = Array.from(new Set(collegeCutoffs.map(cut => cut.branch_id)));
      
      const coursesList = uniqueBranchIds
        .map(bid => {
          const br = rawBranches.find(b => b.id === bid || b.branch_code === bid);
          return br ? (br.branch_name || br.name) : null;
        })
        .filter(Boolean);

      let parsedDesc = {};
      if (c.description) {
        try {
          parsedDesc = JSON.parse(c.description);
        } catch (e) {
          parsedDesc = { about: c.description };
        }
      }

      return {
        id: collegeId,
        name: c.college_name || c.name,
        code: c.college_code || c.code,
        city: c.city,
        district: c.district || c.city || '',
        university: parsedDesc.university || (c.university && c.university !== 'Default University' && c.university !== 'Default' ? c.university : null),
        type: parsedDesc.ownership || c.college_type || c.type || null,
        website: c.website || null,
        fees: c.fees ? parseFloat(c.fees) : null,
        placementRating: c.placement_percentage ? parseFloat((c.placement_percentage / 20).toFixed(1)) : (parsedDesc.placement_percentage ? parseFloat((parsedDesc.placement_percentage / 20).toFixed(1)) : null),
        placementPercentage: c.placement_percentage ? parseFloat(c.placement_percentage) : (parsedDesc.placement_percentage ? parseFloat(parsedDesc.placement_percentage) : null),
        averagePackage: c.average_package ? parseFloat(c.average_package) : (parsedDesc.average_package ? parseFloat(parsedDesc.average_package) : null),
        highestPackage: parsedDesc.highest_package ? parseFloat(parsedDesc.highest_package) : null,
        facilities: parsedDesc.facilities && parsedDesc.facilities.length > 0 ? parsedDesc.facilities : null,
        description: c.description || '',
        courses: coursesList.length > 0 ? coursesList : []
      };
    });

    // Group and deduplicate mapped colleges
    const cleanField = (f) => {
      if (!f) return '';
      return f.replace(/\s*\([^)]*\)\s*$/, '').trim();
    };

    const groupedMap = new Map();
    mapped.forEach(col => {
      const rawCode = col.code || '';
      const codeKey = String(rawCode).trim().replace(/^0+/, '');
      const nameKey = cleanName(col.name);
      
      let key = '';
      if (codeKey) {
        key = `CODE_${codeKey}`;
      } else if (nameKey) {
        key = `NAME_${nameKey.toLowerCase()}`;
      } else {
        key = `UNIV_${nameKey.toLowerCase()}_${(col.university || '').toLowerCase()}`;
      }
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key).push(col);
    });

    const deduplicated = [];
    groupedMap.forEach((group) => {
      group.forEach(col => {
        col.badges = generateBadges(col);
        col.name = cleanName(col.name);
        if (col.city) col.city = cleanField(col.city);
        if (col.district) col.district = cleanField(col.district);
        col.autonomous = checkAutonomy(col) || col.badges.includes('Autonomous');
        col.code = String(col.code).trim().replace(/^0+/, ''); // Normalize code
      });

      if (group.length === 1) {
        deduplicated.push(group[0]);
      } else {
        group.sort((a, b) => {
          const coursesA = a.courses?.length || 0;
          const coursesB = b.courses?.length || 0;
          if (coursesB !== coursesA) return coursesB - coursesA;
          const descA = a.description ? 1 : 0;
          const descB = b.description ? 1 : 0;
          return descB - descA;
        });

        const primary = group[0];
        const allCourses = new Set();
        group.forEach(c => {
          if (c.courses) c.courses.forEach(course => allCourses.add(course));
        });

        const allFacilities = new Set();
        group.forEach(c => {
          if (c.facilities) c.facilities.forEach(fac => allFacilities.add(fac));
        });

        const allBadges = new Set();
        group.forEach(c => {
          if (c.badges) c.badges.forEach(b => allBadges.add(b));
        });

        const merged = {
          ...primary,
          courses: Array.from(allCourses),
          facilities: allFacilities.size > 0 ? Array.from(allFacilities) : null,
          badges: Array.from(allBadges),
          autonomous: group.some(c => c.autonomous) || allBadges.has('Autonomous')
        };

        for (let i = 1; i < group.length; i++) {
          const other = group[i];
          if (!merged.university && other.university) merged.university = other.university;
          if (!merged.type && other.type) merged.type = other.type;
          if (!merged.website && other.website) merged.website = other.website;
          if (merged.fees === null && other.fees !== null) merged.fees = other.fees;
          if (merged.averagePackage === null && other.averagePackage !== null) merged.averagePackage = other.averagePackage;
          if (merged.highestPackage === null && other.highestPackage !== null) merged.highestPackage = other.highestPackage;
          if (merged.placementPercentage === null && other.placementPercentage !== null) merged.placementPercentage = other.placementPercentage;
          if (!merged.description && other.description) merged.description = other.description;
        }

        deduplicated.push(merged);
      }
    });

    deduplicated.sort((a, b) => {
      const codeA = parseInt(a.code || 0, 10);
      const codeB = parseInt(b.code || 0, 10);
      return codeA - codeB;
    });

    cache.colleges = deduplicated;
    console.timeEnd("getColleges");
    return deduplicated;
  },

  async addCollege(college) {
    const dbCol = {
      college_name: college.name,
      college_code: college.code,
      city: college.city,
      district: college.city,
      university: college.university,
      college_type: college.type,
      website: college.website,
      fees: parseFloat(college.fees),
      average_package: parseFloat(college.averagePackage) || 0,
      placement_percentage: parseFloat(college.averagePackage) ? Math.round(college.averagePackage * 8) : 80,
      hostel_available: college.facilities?.includes("Hostel") || false,
      description: college.description || ''
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('colleges').insert([dbCol]).select();
      if (error) throw error;
      return data[0];
    } else {
      const localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const pdfData = getUnpackedPdfData();
      const maxId = Math.max(
        ...pdfData.colleges.map(c => c.id),
        ...localColleges.map(c => c.id),
        0
      );
      const newCollege = {
        ...dbCol,
        id: maxId + 1
      };
      localColleges.push(newCollege);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLLEGES, JSON.stringify(localColleges));
      return newCollege;
    }
  },

  async updateCollege(collegeId, updatedFields) {
    const dbCol = {};
    if (updatedFields.name) dbCol.college_name = updatedFields.name;
    if (updatedFields.code) dbCol.college_code = updatedFields.code;
    if (updatedFields.city) {
      dbCol.city = updatedFields.city;
      dbCol.district = updatedFields.city;
    }
    if (updatedFields.university) dbCol.university = updatedFields.university;
    if (updatedFields.type) dbCol.college_type = updatedFields.type;
    if (updatedFields.website) dbCol.website = updatedFields.website;
    if (updatedFields.fees) dbCol.fees = parseFloat(updatedFields.fees);
    if (updatedFields.averagePackage) {
      dbCol.average_package = parseFloat(updatedFields.averagePackage);
      dbCol.placement_percentage = Math.round(parseFloat(updatedFields.averagePackage) * 8);
    }
    if (updatedFields.description) dbCol.description = updatedFields.description;
    if (updatedFields.facilities) {
      dbCol.hostel_available = updatedFields.facilities.includes("Hostel");
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('colleges').update(dbCol).eq('id', collegeId).select();
      if (error) throw error;
      return data[0];
    } else {
      const localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const pdfData = getUnpackedPdfData();
      
      const existing = localColleges.find(c => c.id === collegeId) || pdfData.colleges.find(c => c.id === collegeId);
      if (!existing) throw new Error('College not found');

      const updated = { ...existing, ...dbCol, id: collegeId };
      
      const idx = localColleges.findIndex(c => c.id === collegeId);
      if (idx !== -1) {
        localColleges[idx] = updated;
      } else {
        localColleges.push(updated);
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLLEGES, JSON.stringify(localColleges));
      return updated;
    }
  },

  async deleteCollege(collegeId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('colleges').delete().eq('id', collegeId);
      if (error) throw error;
      return true;
    } else {
      let localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      localColleges = localColleges.filter(c => c.id !== collegeId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLLEGES, JSON.stringify(localColleges));

      let localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      localCutoffs = localCutoffs.filter(c => c.college_id !== collegeId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CUTOFFS, JSON.stringify(localCutoffs));
      return true;
    }
  },

  // 2. CUTOFFS
  // 2. CUTOFFS
  async getCutoffs() {
    if (cache.cutoffs) {
      console.log("[dbService] Returning cached cutoffs");
      return cache.cutoffs;
    }
    console.time("getCutoffs");
    let rawCutoffs = [];
    let rawColleges = [];
    let rawBranches = [];

    const hasSupa = await this.hasSupabaseData();
    let yearMap = new Map();

    if (hasSupa) {
      console.log("[dbService] Fetching years, colleges, and branches in parallel...");
      const [yrsRes, colsRes, brsRes] = await Promise.all([
        supabase.from('cutoff_years').select('*'),
        supabase.from('colleges').select('*'),
        supabase.from('branches').select('*')
      ]);

      if (yrsRes.error) throw yrsRes.error;
      if (colsRes.error) throw colsRes.error;
      if (brsRes.error) throw brsRes.error;

      yearMap = new Map(yrsRes.data.map(y => [y.id, y.year]));
      cache.years = yrsRes.data;
      rawColleges = colsRes.data;
      rawBranches = brsRes.data;

      // Batched chunked fetch — avoids browser connection limits and respects Supabase 1000 row limits
      const { count, error: countErr } = await supabase
        .from('cutoffs')
        .select('*', { count: 'exact', head: true });
      if (countErr) throw countErr;

      const total = count || 0;
      const chunkSize = 1000;
      console.log(`[dbService] Fetching ${total} cutoffs in chunk sizes of ${chunkSize}...`);
      
      const batchSize = 6;
      for (let i = 0; i < total; i += chunkSize * batchSize) {
        const batchPromises = [];
        for (let j = 0; j < batchSize && (i + j * chunkSize) < total; j++) {
          const offset = i + j * chunkSize;
          batchPromises.push(
            supabase.from('cutoffs').select('*').range(offset, offset + chunkSize - 1)
          );
        }
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach((res, idx) => {
          if (res.error) {
            console.error(`Error in chunk ${i + idx * chunkSize}:`, res.error);
            throw res.error;
          }
          rawCutoffs = rawCutoffs.concat(res.data || []);
        });
      }
      console.log(`[dbService] Loaded ${rawCutoffs.length} cutoff rows from Supabase`);
    } else {
      // Load static PDF extracted records + local modifications
      const pdfData = getUnpackedPdfData();
      
      const localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      const localBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');

      // Merge colleges
      const collegesMap = new Map();
      pdfData.colleges.forEach(c => collegesMap.set(c.id, c));
      localColleges.forEach(c => collegesMap.set(c.id, c));
      rawColleges = Array.from(collegesMap.values());

      // Merge branches
      const branchesMap = new Map();
      pdfData.branches.forEach(b => branchesMap.set(b.id, b));
      localBranches.forEach(b => branchesMap.set(b.id, b));
      rawBranches = Array.from(branchesMap.values());

      // Merge cutoffs
      rawCutoffs = [...pdfData.cutoffs, ...localCutoffs];

      // Mock fallback
      if (rawCutoffs.length === 0) {
        initializeLocalDb();
        rawCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUTOFFS));
        rawColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLEGES));
        rawBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES));
      }
    }

    // Group individual normalized category rows into aggregated objects
    const { resolveCollege, resolveBranch } = buildCollegeBranchLookups(rawColleges, rawBranches);
    const grouped = {};
    rawCutoffs.forEach(row => {
      const college = resolveCollege(row);
      const branch = resolveBranch(row);

      if (!college || !branch) return;

      const yearVal = row.year || (row.year_id ? yearMap.get(row.year_id) : null) || row.year_id || 2025;
      const key = `${college.id}-${branch.id}-${yearVal}-${row.round}-${row.gender || 'Co-Ed'}-${row.admission_type}`;

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          collegeId: college.id,
          collegeCode: String(college.college_code || college.code).trim().replace(/^0+/, ''),
          collegeName: cleanName(college.college_name || college.name),
          branch: branch.branch_name || branch.name,
          choiceCode: branch.choice_code || branch.branch_code,
          admissionType: row.admission_type,
          year: yearVal,
          round: row.round,
          gender: row.gender || 'Co-Ed'
        };
      }

      grouped[key][row.category] = parseFloat(row.cutoff_percentile);
      if (row.rank) {
        grouped[key][`${row.category}_rank`] = parseInt(row.rank);
      }
    });

    const result = Object.values(grouped);
    cache.cutoffs = result;
    console.timeEnd("getCutoffs");
    return result;
  },

  async addCutoff(cutoff) {
    let branchId = null;

    if (isSupabaseConfigured) {
      // Find branch_id in Supabase
      const cleanBranchName = cutoff.branch.split(' - ')[0];
      const { data: brs } = await supabase
        .from('branches')
        .select('id')
        .eq('branch_code', cutoff.choiceCode || cutoff.choice_code || cutoff.branchCode)
        .maybeSingle();

      if (brs) {
        branchId = brs.id;
      } else {
        const { data: newBr, error: e1 } = await supabase.from('branches').insert([{ 
          branch_name: `${cleanBranchName} - ${cutoff.choiceCode}`, 
          branch_code: cutoff.choiceCode 
        }]).select();
        if (e1) throw e1;
        branchId = newBr[0].id;
      }

      // Find year_id
      let yearId = null;
      const { data: yr } = await supabase.from('cutoff_years').select('id').eq('year', parseInt(cutoff.year)).maybeSingle();
      if (yr) {
        yearId = yr.id;
      } else {
        const { data: newYr, error: e2 } = await supabase.from('cutoff_years').insert([{ year: parseInt(cutoff.year) }]).select();
        if (e2) throw e2;
        yearId = newYr[0].id;
      }

      // Write category rows with rank column compatibility fallback
      const categories = ['OPEN', 'OBC', 'SC', 'ST', cutoff.category].filter(Boolean);
      for (const cat of categories) {
        const val = cutoff[cat] || (cat === cutoff.category ? cutoff.percentile : null);
        const rkVal = cutoff[`${cat}_rank`] || (cat === cutoff.category ? cutoff.rank : null);
        
        if (val !== undefined && val !== null && val !== '') {
          // Delete potential duplicates first
          await supabase.from('cutoffs').delete()
            .eq('college_id', parseInt(cutoff.collegeId))
            .eq('branch_id', branchId)
            .eq('year_id', yearId)
            .eq('round', cutoff.round || 'CAP1')
            .eq('category', cat)
            .eq('gender', cutoff.gender || 'Co-Ed');

          // Attempt insert with rank. If column is not found (PGRST204), insert without rank!
          const { error: insErr } = await supabase.from('cutoffs').insert([{
            college_id: parseInt(cutoff.collegeId),
            branch_id: branchId,
            year_id: yearId,
            round: cutoff.round || 'CAP1',
            admission_type: cutoff.admissionType,
            category: cat,
            gender: cutoff.gender || 'Co-Ed',
            cutoff_percentile: parseFloat(val),
            rank: rkVal ? parseInt(rkVal) : null
          }]);
          
          if (insErr && insErr.code === 'PGRST204') {
            // Column rank not found, retry without rank
            const { error: retryErr } = await supabase.from('cutoffs').insert([{
              college_id: parseInt(cutoff.collegeId),
              branch_id: branchId,
              year_id: yearId,
              round: cutoff.round || 'CAP1',
              admission_type: cutoff.admissionType,
              category: cat,
              gender: cutoff.gender || 'Co-Ed',
              cutoff_percentile: parseFloat(val)
            }]);
            if (retryErr) throw retryErr;
          } else if (insErr) {
            throw insErr;
          }
        }
      }
    } else {
      // LocalStorage
      const localBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');
      const pdfData = getUnpackedPdfData();
      
      let branch = localBranches.find(b => b.choice_code === cutoff.choiceCode) || pdfData.branches.find(b => b.choice_code === cutoff.choiceCode);
      if (!branch) {
        const maxId = Math.max(...pdfData.branches.map(b => b.id), ...localBranches.map(b => b.id), 0);
        branch = { 
          id: maxId + 1, 
          choice_code: cutoff.choiceCode, 
          branch_name: `${cutoff.branch} - ${cutoff.choiceCode}` 
        };
        localBranches.push(branch);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BRANCHES, JSON.stringify(localBranches));
      }
      branchId = branch.id;

      const localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      
      const newRow = {
        id: Math.max(...pdfData.cutoffs.map(c => c.id), ...localCutoffs.map(c => c.id), 0) + 1,
        college_id: parseInt(cutoff.collegeId),
        branch_id: branchId,
        year: parseInt(cutoff.year),
        round: cutoff.round || 'CAP1',
        admission_type: cutoff.admissionType,
        category: cutoff.category || 'OPEN',
        gender: cutoff.gender || 'Co-Ed',
        cutoff_percentile: parseFloat(cutoff.percentile || cutoff.OPEN),
        rank: cutoff.rank ? parseInt(cutoff.rank) : null
      };
      
      localCutoffs.push(newRow);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CUTOFFS, JSON.stringify(localCutoffs));
    }
    return cutoff;
  },

  async deleteCutoff(cutoffId) {
    const parts = cutoffId.split('-');
    if (parts.length < 6) return false;
    const [collegeId, branchId, year, round, gender, type] = parts;

    if (isSupabaseConfigured) {
      // Retrieve year_id
      const { data: yr } = await supabase.from('cutoff_years').select('id').eq('year', parseInt(year)).maybeSingle();
      if (!yr) return false;
      
      const { error } = await supabase.from('cutoffs').delete()
        .eq('college_id', parseInt(collegeId))
        .eq('branch_id', parseInt(branchId))
        .eq('year_id', yr.id)
        .eq('round', round)
        .eq('gender', gender)
        .eq('admission_type', type);
      if (error) throw error;
      return true;
    } else {
      let localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      localCutoffs = localCutoffs.filter(c => 
        !(c.college_id === parseInt(collegeId) && 
          c.branch_id === parseInt(branchId) && 
          c.year === parseInt(year) && 
          c.round === round && 
          c.gender === gender && 
          c.admission_type === type)
      );
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CUTOFFS, JSON.stringify(localCutoffs));
      return true;
    }
  },

  // LATEST UPLOADS HISTORY
  async getLatestUploads() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('admin_uploads')
          .select('id, file_name, year, upload_status, imported_records, failed_records, duration, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Failed to fetch admin uploads:', err);
        return [];
      }
    } else {
      try {
        const history = JSON.parse(localStorage.getItem('collegemate_admin_uploads') || '[]');
        return history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      } catch {
        return [];
      }
    }
  },

  // BULK IMPORT
  async bulkImportParsedRecords(records, fileName, onProgress, options = {}) {
    const importStartTime = Date.now();
    let collegeCount = 0;
    let branchCount = 0;
    let cutoffCount = 0;
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const logs = [];

    const total = records.length;
    const year = options.year ? parseInt(options.year) : (records[0]?.year || 2024);

    logs.push(`[SYSTEM] Starting import pipeline for file: ${fileName}`);
    logs.push(`[SYSTEM] Mode: ${options.mode || 'append/upsert'}, Round: ${options.round || 'CAP1'}, Year: ${year}`);
    logs.push(`[SYSTEM] Total parsed records to process: ${total}`);

    if (isSupabaseConfigured) {
      // Step 0: Replace Mode logic (delete existing records)
      if (options.mode === 'replace' && options.year && options.round && options.admissionType) {
        logs.push(`[SYSTEM] Replace Mode active. Deleting existing records for Year: ${options.year}, Round: ${options.round}, Type: ${options.admissionType}...`);
        try {
          const { data: yr } = await supabase.from('cutoff_years').select('id').eq('year', parseInt(options.year)).maybeSingle();
          if (yr) {
            const { error: delErr } = await supabase
              .from('cutoffs')
              .delete()
              .eq('year_id', yr.id)
              .eq('round', options.round)
              .eq('admission_type', options.admissionType);
            if (delErr) throw delErr;
            logs.push(`[SUCCESS] Deleted existing records for Year: ${options.year}, Round: ${options.round}, Type: ${options.admissionType}.`);
          }
        } catch (delErr) {
          logs.push(`[ERROR] Failed to delete existing records: ${delErr.message}`);
          throw delErr;
        }
      }

      let countBefore = 0;
      try {
        const { count } = await supabase.from('cutoffs').select('*', { count: 'exact', head: true });
        countBefore = count || 0;
      } catch (e) {
        logs.push(`[WARN] Failed to fetch initial cutoff count: ${e.message}`);
      }

      // Step 4: Automatically create cutoff_years 2024, 2025, 2026 if missing
      try {
        const defaultYears = [{ year: 2024 }, { year: 2025 }, { year: 2026 }];
        const { error: yrErr } = await supabase.from('cutoff_years').upsert(defaultYears, { onConflict: 'year' });
        if (yrErr) throw yrErr;
        logs.push(`[SUCCESS] Cutoff years (2024, 2025, 2026) verified/inserted.`);
      } catch (e) {
        logs.push(`[ERROR] Failed to upsert cutoff years: ${e.message}`);
        throw e;
      }

      // Step 2 & 6: Extract unique colleges, map admission types, and upsert
      const collegesMap = new Map();
      records.forEach(r => {
        let admType = r.admissionType;
        if (fileName.includes('ENGG')) {
          admType = 'FIRST_YEAR_ENGINEERING';
        } else if (fileName.includes('DSE')) {
          admType = 'DIRECT_SECOND_YEAR_ENGINEERING';
        }
        r.admissionType = admType;

        collegesMap.set(r.collegeCode, {
          college_code: r.collegeCode,
          college_name: r.collegeName,
          city: r.city,
          district: r.city,
          university: r.university,
          college_type: r.type,
          fees: r.type?.includes('Government') ? 75000 : 135000,
          placement_percentage: 85,
          average_package: 5.5,
          hostel_available: r.type?.includes('Government') || false
        });
      });

      const collegesList = Array.from(collegesMap.values());
      try {
        const { error: colErr } = await supabase.from('colleges').upsert(collegesList, { onConflict: 'college_code' });
        if (colErr) throw colErr;
        collegeCount = collegesList.length;
        logs.push(`[SUCCESS] Upserted ${collegeCount} unique colleges.`);
      } catch (e) {
        logs.push(`[ERROR] College upsert failed: ${e.message}`);
        throw e;
      }

      // Step 3: Extract unique branches (generic name) and upsert
      const branchesMap = new Map();
      records.forEach(r => {
        branchesMap.set(r.branchName, {
          branch_name: r.branchName,
          branch_code: r.branchName
        });
      });

      const branchesList = Array.from(branchesMap.values());
      try {
        const { error: brErr } = await supabase.from('branches').upsert(branchesList, { onConflict: 'branch_name' });
        if (brErr) throw brErr;
        branchCount = branchesList.length;
        logs.push(`[SUCCESS] Upserted ${branchCount} unique branches.`);
      } catch (e) {
        logs.push(`[ERROR] Branch upsert failed: ${e.message}`);
        throw e;
      }

      // Preload mapping keys for fast lookup
      const { data: dbCols } = await supabase.from('colleges').select('id, college_code');
      const { data: dbBrs } = await supabase.from('branches').select('id, branch_name');
      const { data: dbYrs } = await supabase.from('cutoff_years').select('id, year');

      const colLookup = new Map(dbCols.map(c => [c.college_code, c.id]));
      const brLookup = new Map(dbBrs.map(b => [b.branch_name, b.id]));
      const yrLookup = new Map(dbYrs.map(y => [y.year, y.id]));

      // Step 5 & 9: Bulk insert cutoffs in batches of 500 with individual retry for details
      const batchSize = 500;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const cutoffsBatch = batch.map(r => ({
          college_id: colLookup.get(r.collegeCode),
          branch_id: brLookup.get(r.branchName),
          year_id: yrLookup.get(r.year),
          round: r.round,
          admission_type: r.admissionType,
          category: r.category,
          gender: 'Co-Ed',
          cutoff_percentile: parseFloat(r.percentile),
          rank: r.rank ? parseInt(r.rank) : null
        })).filter(c => c.college_id && c.branch_id && c.year_id);

        if (cutoffsBatch.length > 0) {
          const { error: cutErr } = await supabase.from('cutoffs').upsert(cutoffsBatch, { 
            onConflict: 'college_id,branch_id,year_id,round,category,gender',
            ignoreDuplicates: options.mode === 'append'
          });

          if (cutErr) {
            logs.push(`[WARN] Batch ${Math.floor(i / batchSize) + 1} failed (${cutErr.message}). Retrying individually...`);
            
            for (const item of cutoffsBatch) {
              const recordSource = batch.find(r => 
                colLookup.get(r.collegeCode) === item.college_id &&
                brLookup.get(r.branchName) === item.branch_id &&
                r.category === item.category
              );
              const pageNum = recordSource?.pageNumber || 'N/A';
              const recordDesc = recordSource ? `${recordSource.collegeName} (${recordSource.branchName} - ${item.category})` : 'Unknown Record';

              const { error: indErr } = await supabase.from('cutoffs').upsert([item], { 
                onConflict: 'college_id,branch_id,year_id,round,category,gender' 
              });

              if (indErr) {
                failed++;
                logs.push(`[FAILED] Page ${pageNum}: ${recordDesc} | Supabase Error: ${indErr.message}`);
              } else {
                cutoffCount++;
              }
            }
          } else {
            cutoffCount += cutoffsBatch.length;
          }
        }

        if (onProgress) {
          onProgress(Math.min(i + batchSize, total), total);
        }
      }

      let countAfter = countBefore;
      try {
        const { count } = await supabase.from('cutoffs').select('*', { count: 'exact', head: true });
        countAfter = count || 0;
      } catch (e) {
        logs.push(`[WARN] Failed to fetch final cutoff count: ${e.message}`);
      }

      const totalAdded = Math.max(0, countAfter - countBefore);
      inserted = totalAdded;
      updated = Math.max(0, cutoffCount - totalAdded);

    } else {
      // LocalStorage import
      const localColleges = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const localBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');
      let localCutoffs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');

      if (options.mode === 'replace' && options.year && options.round && options.admissionType) {
        localCutoffs = localCutoffs.filter(c => 
          !(c.year === parseInt(options.year) && 
            c.round === options.round && 
            c.admission_type === options.admissionType)
        );
      }

      const pdfData = getUnpackedPdfData();

      records.forEach(r => {
        let admType = r.admissionType;
        if (fileName.includes('ENGG')) {
          admType = 'FIRST_YEAR_ENGINEERING';
        } else if (fileName.includes('DSE')) {
          admType = 'DIRECT_SECOND_YEAR_ENGINEERING';
        }
        r.admissionType = admType;

        const existingCol = pdfData.colleges.find(c => c.college_code === r.collegeCode) || localColleges.find(c => c.college_code === r.collegeCode);
        if (!existingCol) {
          const maxId = Math.max(...pdfData.colleges.map(c => c.id), ...localColleges.map(c => c.id), 0);
          const newCol = {
            id: maxId + 1,
            college_code: r.collegeCode,
            college_name: r.collegeName,
            city: r.city,
            district: r.city,
            university: r.university,
            college_type: r.type,
            website: 'https://www.google.com',
            fees: r.type?.includes('Government') ? 75000 : 135000,
            placement_percentage: 85,
            average_package: 5.5,
            hostel_available: r.type?.includes('Government') || false
          };
          localColleges.push(newCol);
          collegeCount++;
        }
      });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLLEGES, JSON.stringify(localColleges));

      records.forEach(r => {
        const existingBr = pdfData.branches.find(b => b.branch_name === r.branchName) || localBranches.find(b => b.branch_name === r.branchName);
        if (!existingBr) {
          const maxId = Math.max(...pdfData.branches.map(b => b.id), ...localBranches.map(b => b.id), 0);
          const newBr = {
            id: maxId + 1,
            choice_code: r.branchName,
            branch_name: r.branchName
          };
          localBranches.push(newBr);
          branchCount++;
        }
      });
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BRANCHES, JSON.stringify(localBranches));

      const colLookup = new Map();
      pdfData.colleges.forEach(c => colLookup.set(c.college_code, c.id));
      localColleges.forEach(c => colLookup.set(c.college_code, c.id));

      const brLookup = new Map();
      pdfData.branches.forEach(b => brLookup.set(b.branch_name, b.id));
      localBranches.forEach(b => brLookup.set(b.branch_name, b.id));

      records.forEach((r, idx) => {
        const collegeId = colLookup.get(r.collegeCode);
        const branchId = brLookup.get(r.branchName);

        if (collegeId && branchId) {
          const existingCutoffIndex = localCutoffs.findIndex(c => 
            c.college_id === collegeId &&
            c.branch_id === branchId &&
            c.year === r.year &&
            c.round === r.round &&
            c.category === r.category &&
            c.gender === 'Co-Ed' &&
            c.admission_type === r.admissionType
          );

          if (existingCutoffIndex !== -1) {
            if (options.mode === 'append') {
              updated++; // Skip updating in Append Mode
            } else {
              localCutoffs[existingCutoffIndex].cutoff_percentile = parseFloat(r.percentile);
              localCutoffs[existingCutoffIndex].rank = r.rank ? parseInt(r.rank) : null;
              updated++;
            }
          } else {
            const maxId = Math.max(...pdfData.cutoffs.map(c => c.id), ...localCutoffs.map(c => c.id), 0);
            localCutoffs.push({
              id: maxId + 1,
              college_id: collegeId,
              branch_id: branchId,
              year: r.year,
              round: r.round,
              admission_type: r.admissionType,
              category: r.category,
              gender: 'Co-Ed',
              cutoff_percentile: parseFloat(r.percentile),
              rank: r.rank ? parseInt(r.rank) : null
            });
            inserted++;
          }
          cutoffCount++;
        } else {
          failed++;
        }

        if (idx % 200 === 0 && onProgress) {
          onProgress(idx, total);
        }
      });

      localStorage.setItem(STORAGE_KEYS.CUSTOM_CUTOFFS, JSON.stringify(localCutoffs));
      if (onProgress) onProgress(total, total);
    }

    const durationSeconds = parseFloat(((Date.now() - importStartTime) / 1000).toFixed(2));
    logs.push(`[SYSTEM] Import Completed in ${durationSeconds} seconds.`);
    logs.push(`[SYSTEM] Records Inserted: ${inserted}, Updated: ${updated}, Failed: ${failed}`);

    const status = failed === total ? 'Failed' : 'Success';

    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uploadedBy = userData?.user?.id || null;

        const auditRecord = {
          uploaded_by: uploadedBy,
          file_name: fileName,
          year: year,
          upload_status: status,
          imported_records: inserted + updated,
          failed_records: failed,
          duration: durationSeconds
        };

        const { error: auditErr } = await supabase.from('admin_uploads').insert([auditRecord]);
        if (auditErr) {
          logs.push(`[WARN] Audit logging into admin_uploads failed: ${auditErr.message}`);
        } else {
          logs.push(`[SUCCESS] Audit log record created successfully in admin_uploads.`);
        }
      } catch (e) {
        logs.push(`[WARN] Audit logging exception: ${e.message}`);
      }
    } else {
      try {
        const history = JSON.parse(localStorage.getItem('collegemate_admin_uploads') || '[]');
        const auditRecord = {
          id: Date.now(),
          file_name: fileName,
          year: year,
          upload_status: status,
          imported_records: inserted + updated,
          failed_records: failed,
          duration: durationSeconds,
          created_at: new Date().toISOString()
        };
        history.push(auditRecord);
        localStorage.setItem('collegemate_admin_uploads', JSON.stringify(history));
        logs.push(`[SUCCESS] Mock Audit log record created successfully in LocalStorage.`);
      } catch (e) {
        logs.push(`[WARN] Local mock audit logging exception: ${e.message}`);
      }
    }

    return { 
      collegeCount, 
      branchCount, 
      cutoffCount, 
      processed: total,
      inserted,
      updated,
      failed,
      logs,
      durationSeconds,
      status
    };
  },

  async getDatabaseCounts() {
    if (isSupabaseConfigured) {
      try {
        const { count: colCount, error: colErr } = await supabase.from('colleges').select('*', { count: 'exact', head: true });
        if (colErr) throw colErr;
        const { count: brCount, error: brErr } = await supabase.from('branches').select('*', { count: 'exact', head: true });
        if (brErr) throw brErr;
        const { count: cutCount, error: cutErr } = await supabase.from('cutoffs').select('*', { count: 'exact', head: true });
        if (cutErr) throw cutErr;
        return {
          colleges: colCount || 0,
          branches: brCount || 0,
          cutoffs: cutCount || 0
        };
      } catch (e) {
        console.error('Failed to get database counts', e);
        return { colleges: 0, branches: 0, cutoffs: 0 };
      }
    } else {
      const cols = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_COLLEGES) || '[]');
      const brs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');
      const cuts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_CUTOFFS) || '[]');
      return {
        colleges: cols.length,
        branches: brs.length,
        cutoffs: cuts.length
      };
    }
  },

  // 3. USER PROFILES
  async getProfiles() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    } else {
      initializeLocalDb();
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      return users.map(u => ({ id: u.id, email: u.email, role: u.role, ...u.profile }));
    }
  },

  async updateProfile(userId, profileUpdates) {
    const dbProfile = {
      full_name: profileUpdates.name || profileUpdates.full_name,
      admission_type: profileUpdates.admissionType || profileUpdates.admission_type,
      category: profileUpdates.category,
      gender: profileUpdates.gender,
      home_university: profileUpdates.homeUniversity || profileUpdates.home_university,
      score: profileUpdates.score !== undefined ? parseFloat(profileUpdates.score) : undefined,
      branch_preference: profileUpdates.branchPreference || profileUpdates.branch_preference,
      updated_at: new Date()
    };

    // Strip undefined keys for clean Supabase update
    Object.keys(dbProfile).forEach(key => dbProfile[key] === undefined && delete dbProfile[key]);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').update(dbProfile).eq('id', userId).select();
      if (error) throw error;
      return data[0];
    } else {
      initializeLocalDb();
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error('User not found');

      users[userIndex].profile = { ...users[userIndex].profile, ...profileUpdates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return { id: users[userIndex].id, email: users[userIndex].email, role: users[userIndex].role, ...users[userIndex].profile };
    }
  },

  // 4. BOOKMARKS
  async getSavedCollegeIds(userId) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('saved_colleges')
          .select('college_id')
          .eq('user_id', userId);
        if (error) throw error;
        return data.map(item => item.college_id);
      } catch (err) {
        console.error('Failed to fetch saved colleges', err);
        return [];
      }
    } else {
      initializeLocalDb();
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      const userObj = users.find(u => u.id === userId);
      return userObj?.profile?.savedColleges || [];
    }
  },

  async toggleSavedCollege(userId, collegeId) {
    if (isSupabaseConfigured) {
      const { data: existing, error: checkErr } = await supabase
        .from('saved_colleges')
        .select('*')
        .eq('user_id', userId)
        .eq('college_id', parseInt(collegeId));
      
      if (checkErr) throw checkErr;

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('saved_colleges')
          .delete()
          .eq('user_id', userId)
          .eq('college_id', parseInt(collegeId));
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('saved_colleges')
          .insert([{ user_id: userId, college_id: parseInt(collegeId) }]);
        if (error) throw error;
        return true;
      }
    } else {
      initializeLocalDb();
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) throw new Error('User not found');

      const savedList = users[userIndex].profile.savedColleges || [];
      const colIdNum = parseInt(collegeId);
      const savedIndex = savedList.indexOf(colIdNum);

      let isSaved = false;
      if (savedIndex > -1) {
        savedList.splice(savedIndex, 1);
      } else {
        savedList.push(colIdNum);
        isSaved = true;
      }

      users[userIndex].profile.savedColleges = savedList;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return isSaved;
    }
  },

  async getBranches() {
    let rawBranches = [];
    if (isSupabaseConfigured && await this.hasSupabaseData()) {
      const { data, error } = await supabase.from('branches').select('*');
      if (error) throw error;
      rawBranches = data || [];
    } else {
      const pdfData = getUnpackedPdfData();
      const localBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_BRANCHES) || '[]');
      rawBranches = [...pdfData.branches, ...localBranches];
      if (rawBranches.length === 0) {
        initializeLocalDb();
        rawBranches = JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES) || '[]');
      }
    }

    // Sort and deduplicate by branch_name
    const uniqueMap = new Map();
    rawBranches.forEach(b => {
      const name = b.branch_name || b.name;
      if (name) {
        uniqueMap.set(name, {
          id: b.id,
          code: b.branch_code || b.choice_code || b.id,
          name: name
        });
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getCollegeByCode(code) {
    if (cache.collegeByCode && cache.collegeByCode.has(code)) {
      return cache.collegeByCode.get(code);
    }

    const cols = await this.getColleges();
    const normInput = String(code).trim().replace(/^0+/, '');
    const mapped = cols.find(c => String(c.code).trim().replace(/^0+/, '') === normInput) || null;

    if (mapped && cache.collegeByCode) {
      cache.collegeByCode.set(code, mapped);
    }
    return mapped;
  },

  async getCutoffsForCollege(collegeCode, year, admissionType) {
    if (isSupabaseConfigured) {
      try {
        const { data: yrs, error: errYr } = await supabase.from('cutoff_years').select('*');
        if (errYr) throw errYr;
        const yearMap = new Map(yrs.map(y => [y.id, y.year]));
        const yearIdMap = new Map(yrs.map(y => [y.year, y.id]));

        const normalized = String(collegeCode).trim().replace(/^0+/, '');
        const zeroPrefixed = '0' + normalized;
        const zeroPrefixed2 = '00' + normalized;
        const zeroPrefixed3 = '000' + normalized;

        const { data: cols, error: errCol } = await supabase
          .from('colleges')
          .select('id')
          .in('college_code', [collegeCode, normalized, zeroPrefixed, zeroPrefixed2, zeroPrefixed3]);
        if (errCol) throw errCol;
        if (!cols || cols.length === 0) return [];

        const collegeIds = cols.map(c => c.id);
        const primaryCollegeId = collegeIds[0];
        let query = supabase.from('cutoffs').select('*').in('college_id', collegeIds);
        
        if (year) {
          const yrId = yearIdMap.get(parseInt(year));
          if (yrId) {
            query = query.eq('year_id', yrId);
          }
        }
        if (admissionType) {
          const dbTypes = admissionType === 'CET'
            ? ['CET', 'FIRST_YEAR_ENGINEERING']
            : admissionType === 'DSE'
            ? ['DSE', 'DIRECT_SECOND_YEAR_ENGINEERING']
            : [admissionType];
          query = query.in('admission_type', dbTypes);
        }

        const { data: rawCutoffs, error: errCut } = await query;
        if (errCut) throw errCut;

        const { data: rawBranches, error: errBr } = await supabase.from('branches').select('*');
        if (errBr) throw errBr;

        const { resolveBranch } = buildCollegeBranchLookups([], rawBranches);
        const grouped = {};
        rawCutoffs.forEach(row => {
          const branch = resolveBranch(row);
          if (!branch) return;

          const yearVal = yearMap.get(row.year_id) || row.year_id || 2025;
          const key = `${primaryCollegeId}-${branch.id}-${yearVal}-${row.round}-${row.gender || 'Co-Ed'}-${row.admission_type}`;

          if (!grouped[key]) {
            grouped[key] = {
              id: key,
              collegeId: primaryCollegeId,
              collegeCode: normalized,
              branch: branch.branch_name || branch.name,
              choiceCode: branch.choice_code || branch.branch_code,
              admissionType: row.admission_type,
              year: yearVal,
              round: row.round,
              gender: row.gender || 'Co-Ed'
            };
          }

          grouped[key][row.category] = parseFloat(row.cutoff_percentile);
          if (row.rank) {
            grouped[key][`${row.category}_rank`] = parseInt(row.rank);
          }
        });

        return Object.values(grouped);
      } catch (err) {
        console.error('Error fetching cutoffs for collegeCode:', collegeCode, err);
        return [];
      }
    } else {
      const allCutoffs = await this.getCutoffs();
      const normInput = String(collegeCode).trim().replace(/^0+/, '');
      return allCutoffs.filter(c => {
        const normCode = String(c.collegeCode || '').trim().replace(/^0+/, '');
        return normCode === normInput &&
          (!year || c.year === parseInt(year)) &&
          (!admissionType || c.admissionType === admissionType)
      }).map(c => ({
        ...c,
        collegeCode: normInput
      }));
    }
  },

  async getCollegesForBranch(branchIdOrName) {
    if (isSupabaseConfigured) {
      try {
        let branchQuery = supabase.from('branches').select('*');
        if (typeof branchIdOrName === 'number' || !isNaN(Number(branchIdOrName))) {
          branchQuery = branchQuery.eq('id', Number(branchIdOrName));
        } else {
          branchQuery = branchQuery.eq('branch_name', branchIdOrName);
        }
        const { data: brs, error: brErr } = await branchQuery;
        if (brErr) throw brErr;
        if (!brs || brs.length === 0) return [];
        const branch = brs[0];
        const branchId = branch.id;
        
        const { data: cuts, error: cutErr } = await supabase
          .from('cutoffs')
          .select('college_id, cutoff_percentile')
          .eq('branch_id', branchId);
        if (cutErr) throw cutErr;
        
        const collegeCutoffMap = {};
        cuts.forEach(c => {
          const colId = c.college_id;
          const score = parseFloat(c.cutoff_percentile);
          if (!collegeCutoffMap[colId]) {
            collegeCutoffMap[colId] = [];
          }
          if (!isNaN(score)) {
            collegeCutoffMap[colId].push(score);
          }
        });
        
        const collegesList = await this.getColleges();
        const results = [];
        for (const colId in collegeCutoffMap) {
          const college = collegesList.find(c => c.id == colId);
          if (!college) continue;
          const scores = collegeCutoffMap[colId];
          const minCutoff = scores.length > 0 ? Math.min(...scores) : null;
          const maxCutoff = scores.length > 0 ? Math.max(...scores) : null;
          results.push({
            ...college,
            minCutoff,
            maxCutoff
          });
        }
        return results.sort((a, b) => parseInt(a.code || 0, 10) - parseInt(b.code || 0, 10));
      } catch (err) {
        console.error('Error in getCollegesForBranch:', err);
        return [];
      }
    } else {
      const allColleges = await this.getColleges();
      const allCutoffs = await this.getCutoffs();
      return allColleges.filter(col => {
        const cuts = allCutoffs.filter(c => c.collegeId === col.id && (c.branch === branchIdOrName || c.branch_name === branchIdOrName));
        if (cuts.length === 0) return false;
        const percentiles = cuts.map(c => c.OPEN || c.cutoffScore || 0).filter(Boolean);
        col.minCutoff = percentiles.length > 0 ? Math.min(...percentiles) : 90;
        col.maxCutoff = percentiles.length > 0 ? Math.max(...percentiles) : 95;
        return true;
      }).sort((a, b) => parseInt(a.code || 0, 10) - parseInt(b.code || 0, 10));
    }
  },

  async getCutoffsFiltered(filters = {}) {
    const cacheKey = `${filters.admissionType || ''}-${filters.year || ''}-${filters.round || ''}`;
    if (cache.cutoffsFiltered && cache.cutoffsFiltered.has(cacheKey)) {
      return cache.cutoffsFiltered.get(cacheKey);
    }

    // Load all cutoffs (which retrieves chunked, aggregates and caches them)
    const allCutoffs = await this.getCutoffs();

    const matchesAdmissionType = (recordType, targetType) => {
      if (!recordType || !targetType) return true;
      const normRecord = String(recordType).toUpperCase();
      const normTarget = String(targetType).toUpperCase();
      
      const getTypes = (type) => {
        if (type === 'CET' || type === 'FIRST_YEAR_ENGINEERING') return ['CET', 'FIRST_YEAR_ENGINEERING'];
        if (type === 'DSE' || type === 'DIRECT_SECOND_YEAR_ENGINEERING') return ['DSE', 'DIRECT_SECOND_YEAR_ENGINEERING'];
        return [type];
      };

      const recordTypes = getTypes(normRecord);
      const targetTypes = getTypes(normTarget);
      return recordTypes.some(r => targetTypes.includes(r));
    };

    const results = allCutoffs.filter(c => {
      if (filters.year && c.year !== parseInt(filters.year)) return false;
      if (filters.admissionType && !matchesAdmissionType(c.admissionType, filters.admissionType)) return false;
      if (filters.round && c.round !== filters.round) return false;
      return true;
    });

    if (cache.cutoffsFiltered) {
      cache.cutoffsFiltered.set(cacheKey, results);
    }
    return results;
  },

  async getTopRankings(criteria = 'placements', filters = {}) {
    try {
      const collegesList = await this.getColleges();
      let ranked = [...collegesList];
      
      if (filters.city) {
        ranked = ranked.filter(c => c.city?.toLowerCase() === filters.city.toLowerCase());
      }
      if (filters.type) {
        ranked = ranked.filter(c => c.type?.toLowerCase().includes(filters.type.toLowerCase()));
      }
      
      if (criteria === 'placements') {
        ranked.sort((a, b) => (b.averagePackage || 0) - (a.averagePackage || 0));
      } else if (criteria === 'highest_package') {
        ranked.sort((a, b) => (b.highestPackage || 0) - (a.highestPackage || 0));
      } else if (criteria === 'fees') {
        ranked.sort((a, b) => (a.fees || 0) - (b.fees || 0));
      } else if (criteria === 'cutoffs') {
        ranked.sort((a, b) => (b.placementRating || 0) - (a.placementRating || 0));
      }
      
      return ranked.map((col, idx) => ({
        ...col,
        rank: idx + 1
      }));
    } catch (err) {
      console.error('Error in getTopRankings:', err);
      return [];
    }
  }
};
