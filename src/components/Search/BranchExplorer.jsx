import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../../services/dbService';
import { 
  Search, 
  Building, 
  Layers, 
  DollarSign, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  Sparkles, 
  Percent, 
  ChevronRight,
  Info
} from 'lucide-react';

export default function BranchExplorer({ onViewCollege }) {
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Load branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const list = await dbService.getBranches();
        setBranches(list);
        
        // Select first branch as default if available
        if (list.length > 0) {
          setSelectedBranch(list[0]);
        }
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Fetch colleges when selectedBranch changes
  useEffect(() => {
    const fetchColleges = async () => {
      if (!selectedBranch) return;
      try {
        setLoadingColleges(true);
        const list = await dbService.getCollegesForBranch(selectedBranch.name);
        setColleges(list);
      } catch (err) {
        console.error('Error fetching colleges for branch:', err);
      } finally {
        setLoadingColleges(false);
      }
    };
    fetchColleges();
  }, [selectedBranch]);

  // Filter branches by query
  const filteredBranches = useMemo(() => {
    return branches.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [branches, searchQuery]);

  // Calculate statistics for selected branch
  const branchStats = useMemo(() => {
    if (colleges.length === 0) return { avgFees: 0, avgPlacement: 0, minCutoff: 0, maxCutoff: 0 };
    
    const feesList = colleges.map(c => c.fees).filter(Boolean);
    const placementsList = colleges.map(c => c.averagePackage).filter(Boolean);
    const minCutoffsList = colleges.map(c => c.minCutoff).filter(c => c !== null);
    const maxCutoffsList = colleges.map(c => c.maxCutoff).filter(c => c !== null);

    const avgFees = feesList.length > 0 
      ? Math.round(feesList.reduce((a, b) => a + b, 0) / feesList.length) 
      : 120000;
    const avgPlacement = placementsList.length > 0 
      ? parseFloat((placementsList.reduce((a, b) => a + b, 0) / placementsList.length).toFixed(2)) 
      : 5.2;
    const minCutoff = minCutoffsList.length > 0 ? Math.min(...minCutoffsList) : 80;
    const maxCutoff = maxCutoffsList.length > 0 ? Math.max(...maxCutoffsList) : 99;

    return { avgFees, avgPlacement, minCutoff, maxCutoff };
  }, [colleges]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* HEADER */}
      <div className="mb-8 pb-6 border-b border-brand-border">
        <h1 className="text-3xl font-bold tracking-tight text-brand-heading flex items-center space-x-2">
          <Layers className="h-8 w-8 text-primary" />
          <span>Branch Explorer</span>
        </h1>
        <p className="mt-1 text-sm text-brand-body">Explore engineering branches, see which institutions offer them, and check package trends and cutoff expectations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: BRANCH SEARCH & LIST */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4.5 w-4.5 text-brand-muted" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block h-10 w-full rounded-xl border border-brand-border bg-brand-card pl-10 pr-4 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-xs shadow-sm"
            />
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-3 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
            {loadingBranches ? (
              <div className="py-8 text-center text-xs text-brand-muted animate-pulse">Loading branches...</div>
            ) : filteredBranches.length === 0 ? (
              <div className="py-8 text-center text-xs text-brand-muted">No branches matched query</div>
            ) : (
              <div className="space-y-1">
                {filteredBranches.map((br) => {
                  const isSelected = selectedBranch?.name === br.name;
                  return (
                    <button
                      key={br.id}
                      onClick={() => setSelectedBranch(br)}
                      className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-brand-body hover:bg-brand-bg hover:text-brand-heading'
                      }`}
                    >
                      <span className="truncate">{br.name}</span>
                      <ChevronRight className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-brand-muted'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BRANCH STATISTICS & COLLEGES LISTING */}
        <div className="lg:col-span-3 space-y-6">
          {selectedBranch ? (
            <>
              {/* Branch Stats Overview */}
              <div className="relative rounded-3xl border border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md p-6 shadow-lg space-y-6 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-secondary/15 blur-3xl"></div>
                <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-primary/15 blur-3xl"></div>
                
                <div>
                  <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-3 py-1 text-[10px] font-bold text-accent uppercase tracking-wider">
                    Branch Highlight
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-brand-heading mt-2">{selectedBranch.name}</h2>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-brand-border/40 bg-brand-card p-4 shadow-sm">
                    <Building className="h-5 w-5 text-primary mb-1.5" />
                    <span className="block text-[10px] font-semibold text-brand-muted uppercase">Institutions Offering</span>
                    <span className="text-lg font-extrabold text-brand-heading">{colleges.length} Colleges</span>
                  </div>
                  <div className="rounded-xl border border-brand-border/40 bg-brand-card p-4 shadow-sm">
                    <Briefcase className="h-5 w-5 text-accent mb-1.5" />
                    <span className="block text-[10px] font-semibold text-brand-muted uppercase">Average placement</span>
                    <span className="text-lg font-extrabold text-brand-heading">{branchStats.avgPlacement} LPA</span>
                  </div>
                  <div className="rounded-xl border border-brand-border/40 bg-brand-card p-4 shadow-sm">
                    <DollarSign className="h-5 w-5 text-success mb-1.5" />
                    <span className="block text-[10px] font-semibold text-brand-muted uppercase">Average Tuition</span>
                    <span className="text-lg font-extrabold text-brand-heading">₹{branchStats.avgFees.toLocaleString('en-IN')}/yr</span>
                  </div>
                  <div className="rounded-xl border border-brand-border/40 bg-brand-card p-4 shadow-sm">
                    <Percent className="h-5 w-5 text-secondary mb-1.5" />
                    <span className="block text-[10px] font-semibold text-brand-muted uppercase">Cutoff Range</span>
                    <span className="text-lg font-extrabold text-brand-heading">{branchStats.minCutoff}% - {branchStats.maxCutoff}%</span>
                  </div>
                </div>
              </div>

              {/* Colleges Listing Offering the Branch */}
              <div className="space-y-4">
                <h3 className="font-bold text-brand-heading text-lg flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Colleges offering {selectedBranch.name}</span>
                </h3>

                {loadingColleges ? (
                  <div className="space-y-3">
                    <div className="h-20 bg-brand-card animate-pulse border border-brand-border rounded-xl"></div>
                    <div className="h-20 bg-brand-card animate-pulse border border-brand-border rounded-xl"></div>
                    <div className="h-20 bg-brand-card animate-pulse border border-brand-border rounded-xl"></div>
                  </div>
                ) : colleges.length === 0 ? (
                  <div className="rounded-2xl border border-brand-border bg-brand-card p-8 text-center text-brand-muted">
                    No colleges found offering this course branch.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {colleges.map((college) => (
                      <div 
                        key={college.id}
                        onClick={() => onViewCollege(college.code)}
                        className="group rounded-2xl border border-brand-border bg-brand-card p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-bold text-brand-heading group-hover:text-primary transition-colors text-sm sm:text-base leading-tight">
                              {college.name}
                            </h4>
                            <span className="rounded-full bg-brand-bg px-2 py-0.5 text-[10px] text-brand-muted shrink-0 font-mono">
                              {college.code}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-brand-body">
                            <MapPin className="h-3.5 w-3.5 mr-0.5 text-brand-muted" />
                            <span>{college.city} | {college.university ? (college.university.split('(')[1]?.replace(')', '') || college.university.substring(0, 15)) : 'Information currently unavailable.'}</span>
                          </div>
                        </div>

                        <div className="mt-4 border-t border-brand-border pt-3 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px] text-brand-muted uppercase">Avg Placement</span>
                            <span className="font-bold text-brand-heading">{college.averagePackage ? `${college.averagePackage} LPA` : "Information currently unavailable."}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-brand-muted uppercase">Cutoff Range</span>
                            <span className="font-bold text-primary">{college.minCutoff ? `${college.minCutoff}% - ${college.maxCutoff}%` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-brand-border bg-brand-card p-20 text-center flex flex-col items-center justify-center">
              <Layers className="h-12 w-12 text-brand-muted mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-brand-heading">Select a Branch</h3>
              <p className="text-sm text-brand-body mt-2 max-w-sm">Choose a specialization branch from the alphabetical directory on the left to see analytics details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
