import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { getMatchingCategoryKeys, matchesAdmissionType, branchMatchesPreference } from '../../services/predictor';
import { 
  Search as SearchIcon, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Bookmark, 
  BookmarkCheck, 
  GraduationCap, 
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  GitCompare,
  Percent,
  TrendingUp,
  Tag
} from 'lucide-react';

export default function CollegeSearch({ setCompareColleges, setActiveTab, onViewCollege }) {
  const { user, toggleSavedCollege } = useAuth();
  
  // Database states
  const [colleges, setColleges] = useState([]);
  const [cutoffs, setCutoffs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedAdmissionType, setSelectedAdmissionType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [maxFees, setMaxFees] = useState(250000);
  const [minPlacement, setMinPlacement] = useState(0);
  
  // UI states
  const [comparisonList, setComparisonList] = useState([]);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, selectedBranch, selectedCity, selectedAdmissionType, selectedYear, selectedCategory, selectedRound, maxFees, minPlacement]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [colData, branchList] = await Promise.all([
          dbService.getColleges(),
          dbService.getBranches()
        ]);
        setColleges(colData);
        setBranches(branchList);
      } catch (err) {
        console.error('Error fetching search data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [fetchingCutoffs, setFetchingCutoffs] = useState(false);

  useEffect(() => {
    const isFilterActive = !!(selectedAdmissionType || selectedYear || selectedRound || selectedBranch);
    if (!isFilterActive) {
      setCutoffs([]);
      return;
    }

    const fetchCuts = async () => {
      try {
        setFetchingCutoffs(true);
        const cuts = await dbService.getCutoffsFiltered({
          admissionType: selectedAdmissionType,
          year: selectedYear,
          round: selectedRound,
          branch: selectedBranch
        });
        setCutoffs(cuts);
      } catch (err) {
        console.error('Error fetching filtered cutoffs', err);
      } finally {
        setFetchingCutoffs(false);
      }
    };

    fetchCuts();
  }, [selectedAdmissionType, selectedYear, selectedRound, selectedBranch]);

  const savedCollegeIds = user?.profile?.savedColleges || [];

  const handleSaveToggle = async (collegeId) => {
    if (!user) {
      alert('Please Sign In to save favorite colleges!');
      return;
    }
    await toggleSavedCollege(collegeId);
  };

  const handleToggleComparison = (collegeName) => {
    if (comparisonList.includes(collegeName)) {
      setComparisonList(comparisonList.filter(name => name !== collegeName));
    } else {
      if (comparisonList.length >= 3) {
        alert('You can compare a maximum of 3 colleges at once.');
        return;
      }
      setComparisonList([...comparisonList, collegeName]);
    }
  };

  const handleStartComparison = () => {
    if (comparisonList.length < 2) return;
    // Map names to college objects
    const selectedCols = colleges.filter(c => comparisonList.includes(c.name));
    setCompareColleges(selectedCols);
    setActiveTab('compare');
  };

  // Generate dynamic options from loaded data
  const branchesList = branches.map(b => b.name);

  const citiesList = Array.from(new Set(colleges.map(c => c.city))).filter(Boolean).sort();
  const yearsList = Array.from(new Set(cutoffs.map(c => c.year))).filter(Boolean).sort((a, b) => b - a);
  const roundsList = Array.from(new Set(cutoffs.map(c => c.round))).filter(Boolean).sort();
  const categoriesList = [
    'OPEN', 'OBC', 'SC', 'ST', 'VJ', 'NT-A', 'NT-B', 'NT-C', 'NT-D', 'SBC', 'SEBC', 'EWS', 'TFWS', 'PWD', 'DEFENCE', 'ORPHAN'
  ];

  // Filtering Logic
  const filteredColleges = colleges.map(college => {
    // 1. Text Search matches college name, college code, university, city
    const normalizedQuery = searchQuery.trim().replace(/^0+/, '');
    const matchesQuery = 
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.code.includes(searchQuery) ||
      (normalizedQuery !== '' && college.code.includes(normalizedQuery)) ||
      (college.city && college.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (college.university && college.university.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. City
    const matchesCity = !selectedCity || college.city === selectedCity;

    // 3. Tuition Fees
    const matchesFees = college.fees != null ? college.fees <= maxFees : true;

    // 4. Placements
    const matchesPlacement = college.averagePackage != null ? college.averagePackage >= minPlacement : minPlacement === 0;

    if (!matchesQuery || !matchesCity || !matchesFees || !matchesPlacement) {
      return null;
    }

    // Now filter cutoffs for this college if cutoff-specific filters are active
    const collegeCutoffs = cutoffs.filter(c => {
      const matchId = c.collegeId == college.id;
      const cCode = c.college_code || c.collegeCode;
      const matchCode = cCode && String(cCode).trim().replace(/^0+/, '') === String(college.code).trim().replace(/^0+/, '');
      return matchId || matchCode;
    });

    let matchingCutoffRows = collegeCutoffs;

    if (selectedAdmissionType) {
      matchingCutoffRows = matchingCutoffRows.filter(c => matchesAdmissionType(c.admissionType, selectedAdmissionType));
    }
    if (selectedYear) {
      matchingCutoffRows = matchingCutoffRows.filter(c => c.year === parseInt(selectedYear));
    }
    if (selectedRound) {
      matchingCutoffRows = matchingCutoffRows.filter(c => c.round === selectedRound);
    }
    if (selectedBranch) {
      matchingCutoffRows = matchingCutoffRows.filter(c => branchMatchesPreference(c.branch, selectedBranch));
    }

    // Determine the cutoff score/rank for the selected category
    let bestCutoffVal = null;
    let bestRankVal = null;
    let matchedCategoryName = '';

    if (matchingCutoffRows.length > 0) {
      // Find the best record. If a category filter is selected, check it.
      // If not, try OPEN as fallback.
      const catToCheck = selectedCategory || 'OPEN';
      
      // Look for the first row that contains a value for this category
      for (const row of matchingCutoffRows) {
        const catKeys = getMatchingCategoryKeys(catToCheck, 'Male', row.admissionType);
        for (const key of catKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            bestCutoffVal = parseFloat(row[key]);
            bestRankVal = row[`${key}_rank`] || row.rank || null;
            matchedCategoryName = key;
            break;
          }
        }
        if (bestCutoffVal !== null) break;
      }
    }

    // If cutoff filters are set but no matching cutoff records found, exclude this college
    const cutoffFiltersActive = selectedBranch || selectedAdmissionType || selectedYear || selectedRound || selectedCategory;
    if (cutoffFiltersActive && matchingCutoffRows.length === 0) {
      return null;
    }

    return {
      ...college,
      matchedCutoff: bestCutoffVal,
      matchedRank: bestRankVal,
      matchedCategory: matchedCategoryName
    };
  }).filter(Boolean);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBranch('');
    setSelectedCity('');
    setSelectedAdmissionType('');
    setSelectedYear('');
    setSelectedCategory('');
    setSelectedRound('');
    setMaxFees(250000);
    setMinPlacement(0);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="h-8 w-48 bg-brand-border/40 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 rounded-2xl border border-brand-border/50 bg-brand-card/50 p-6 space-y-4 animate-pulse">
            <div className="h-6 w-32 bg-brand-border/40 rounded-lg"></div>
            <div className="h-10 bg-brand-border/30 rounded-lg"></div>
            <div className="h-10 bg-brand-border/30 rounded-lg"></div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-12 bg-brand-border/30 rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-brand-card border border-brand-border rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-brand-card border border-brand-border rounded-2xl animate-pulse"></div>
            <div className="h-32 bg-brand-card border border-brand-border rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* 1. HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-heading">College Directory</h1>
          <p className="mt-1 text-sm text-brand-body">Search, filter by real CET/DSE cutoffs, and compare top engineering institutions.</p>
        </div>
        
        {/* Floating comparison trigger bar */}
        {comparisonList.length >= 2 && (
          <div className="mt-4 sm:mt-0 flex items-center space-x-3 rounded-xl bg-primary/10 border border-primary/20 p-2 px-4 shadow-sm animate-fade-in">
            <span className="text-xs font-semibold text-primary">Selected {comparisonList.length} colleges</span>
            <button
              onClick={handleStartComparison}
              className="flex items-center space-x-1 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare Now</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar (Left side on desktop) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-border">
              <span className="font-bold text-brand-heading flex items-center space-x-1.5">
                <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
                <span>Filters</span>
              </span>
              <button 
                onClick={handleResetFilters}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Filter controls */}
            <div className="space-y-4">
              
              {/* Admission Type */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">Admission Type</label>
                <select
                  value={selectedAdmissionType}
                  onChange={(e) => setSelectedAdmissionType(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Pathways</option>
                  <option value="CET">First Year Engineering (CET)</option>
                  <option value="DSE">Direct Second Year (DSE)</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Years</option>
                  {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* CAP Round */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">CAP Round</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Rounds</option>
                  {roundsList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">Branch Preferred</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Branches</option>
                  {branchesList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Categories (Default: OPEN)</option>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-1">City / Region</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="">All Cities</option>
                  {citiesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Tuition Fees */}
              <div>
                <div className="flex justify-between text-xs font-bold text-brand-body uppercase tracking-wider mb-1">
                  <span>Max Tuition Fees</span>
                  <span className="text-primary font-bold">₹{(maxFees/1000).toFixed(0)}k</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="250000"
                  step="5000"
                  value={maxFees}
                  onChange={(e) => setMaxFees(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Placements */}
              <div>
                <div className="flex justify-between text-xs font-bold text-brand-body uppercase tracking-wider mb-1">
                  <span>Min Placement Package</span>
                  <span className="text-accent font-bold">{minPlacement} LPA</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={minPlacement}
                  onChange={(e) => setMinPlacement(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Directory Listings (Right 3/4 width on desktop) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Main search bar */}
          <div className="relative">
            <SearchIcon className="absolute top-3.5 left-4 h-5 w-5 text-brand-muted" />
            <input
              type="text"
              placeholder="Search colleges by name or DTE college code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block h-12 w-full rounded-2xl border border-brand-border bg-brand-card pl-12 pr-4 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm"
            />
          </div>

          <div className="text-xs text-brand-muted px-1 flex justify-between">
            <span>Found {filteredColleges.length} institution{filteredColleges.length !== 1 ? 's' : ''}</span>
            {filteredColleges.length === 0 && (
              <button onClick={handleResetFilters} className="text-primary hover:underline font-bold cursor-pointer">Reset filters to see matches</button>
            )}
          </div>

          {/* Listing Grid */}
          <div className="space-y-4">
            {filteredColleges.slice(0, visibleCount).map((college) => {
              const isBookmarked = savedCollegeIds.map(Number).includes(Number(college.id));
              const isSelectedForCompare = comparisonList.includes(college.name);
              return (
                <div 
                  key={college.id}
                  onClick={() => onViewCollege && onViewCollege(college.code)}
                  className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-2 truncate flex-grow">
                    
                    {/* Title */}
                    <div className="flex items-center space-x-2 truncate">
                      <GraduationCap className="h-6 w-6 text-primary shrink-0" />
                      <h3 className="font-bold text-brand-heading text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                        {college.name}
                      </h3>
                      <span className="rounded-full bg-brand-bg px-2 py-0.5 text-xs text-brand-muted shrink-0">
                        {college.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-brand-body items-center">
                      <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-0.5 text-brand-muted" /> {college.city}</span>
                      <span className="text-brand-border">|</span>
                      <span className="truncate max-w-[250px]">{college.university}</span>
                      {college.badges && college.badges.length > 0 && (
                        <>
                          <span className="text-brand-border">|</span>
                          <div className="flex flex-wrap gap-1">
                            {college.badges.map((badge, bIdx) => (
                              <span key={bIdx} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary font-semibold text-[10px]">
                                {badge}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Matched Cutoff Badge if filters are set */}
                    {college.matchedCutoff !== undefined && college.matchedCutoff !== null && (
                      <div className="flex items-center space-x-2 bg-primary/5 border border-primary/10 rounded-xl p-2.5 max-w-fit mt-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-brand-heading">
                          Cutoff ({college.matchedCategory}): <span className="text-primary font-bold">{college.matchedCutoff}%</span>
                          {college.matchedRank && (
                            <> | Merit Rank: <span className="text-accent font-bold">#{college.matchedRank}</span></>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Courses offered badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {college.courses.map((course, cIdx) => (
                        <span key={cIdx} className="rounded-lg bg-brand-bg px-2 py-0.5 text-[10px] font-semibold text-brand-body">
                          {course}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Pricing / Placements & Bookmarking actions */}
                  <div
                    className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-brand-border pt-3 md:pt-0 shrink-0 md:ml-4 gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    
                    {/* Packages / Fees */}
                    <div className="flex md:flex-col space-x-4 md:space-x-0 md:space-y-1 text-xs">
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] text-brand-muted uppercase">Avg Placement</span>
                        <span className="font-bold text-brand-heading">{college.averagePackage ? `${college.averagePackage} LPA` : "Not Available"}</span>
                      </div>
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] text-brand-muted uppercase">Tuition Fees</span>
                        <span className="font-bold text-brand-heading">{college.fees ? `₹${college.fees.toLocaleString('en-IN')}` : "Not Available"}</span>
                      </div>
                    </div>

                    {/* Compare, Bookmark buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewCollege && onViewCollege(college.code)}
                        className="flex items-center space-x-1 rounded-xl border border-brand-border bg-brand-card text-brand-body hover:bg-brand-bg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                        title="View Details"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Details</span>
                      </button>

                      <button
                        onClick={() => handleToggleComparison(college.name)}
                        className={`flex items-center space-x-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                          isSelectedForCompare
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-brand-border bg-brand-card text-brand-body hover:bg-brand-bg'
                        }`}
                        title="Add to Compare"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{isSelectedForCompare ? 'Selected' : 'Compare'}</span>
                      </button>

                      <button
                        onClick={() => handleSaveToggle(college.id)}
                        className={`rounded-xl border p-2 transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-brand-border bg-brand-card text-brand-muted hover:text-brand-heading'
                        }`}
                        title="Bookmark College"
                      >
                        {isBookmarked ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
                      </button>

                      <a
                        href={college.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-xl border border-brand-border p-2 bg-brand-card hover:bg-brand-bg text-brand-muted hover:text-brand-heading transition-colors"
                      >
                        <ExternalLink className="h-4.5 w-4.5" />
                      </a>
                    </div>

                  </div>
                </div>
              );
            })}

            {filteredColleges.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 15)}
                  className="rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg px-6 py-2.5 text-xs font-semibold text-brand-heading transition-colors cursor-pointer"
                >
                  Load More Colleges ({filteredColleges.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
