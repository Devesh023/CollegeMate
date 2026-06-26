import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { 
  GitCompare, 
  Trash2, 
  Plus, 
  Sparkles, 
  X, 
  MapPin, 
  ExternalLink,
  Check,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function CollegeComparison({ compareColleges = [], setCompareColleges, onBack }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const colList = await dbService.getColleges();
        setColleges(colList);
      } catch (err) {
        console.error('Error fetching colleges', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddCollege = (collegeName) => {
    if (compareColleges.includes(collegeName)) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }
    if (compareColleges.length >= 3) {
      alert('You can compare a maximum of 3 colleges side-by-side.');
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }
    setCompareColleges([...compareColleges, collegeName]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveCollege = (nameToRemove) => {
    setCompareColleges(compareColleges.filter(name => name !== nameToRemove));
  };

  const handleClearAll = () => {
    setCompareColleges([]);
  };

  // Get matching college models
  const comparedDetails = colleges.filter(c => compareColleges.includes(c.name));

  // Search filter for dropdown
  const filteredDropdownColleges = colleges.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !compareColleges.includes(c.name)
  );

  // Prepare chart data comparing Fees and Packages
  const chartData = comparedDetails.map(c => ({
    name: c.name.split('(')[1]?.replace(')', '') || c.name.split(' ')[0], // abbreviation or first word
    'Average Package (LPA)': parseFloat(c.averagePackage) || 0,
    'Highest Package (LPA)': parseFloat(c.highestPackage) || 0,
    'Fees (₹10k)': c.fees ? parseFloat((c.fees / 10000).toFixed(1)) : 0
  }));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* BACK NAVIGATION */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center space-x-1.5 text-xs font-bold text-brand-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      )}
      
      {/* 1. HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-heading">College Comparison Matrix</h1>
          <p className="mt-1 text-sm text-brand-body">Compare parameters, placement packages, facilities, and fees side-by-side.</p>
        </div>
        {compareColleges.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="mt-3 sm:mt-0 text-xs font-bold text-error hover:underline flex items-center space-x-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Matrix</span>
          </button>
        )}
      </div>

      {/* 2. SELECTOR CONTAINER */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <label className="block text-xs font-bold text-brand-body uppercase tracking-wider mb-2">Search college to add to matrix</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="e.g. VJTI Mumbai, PICT Pune..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="block h-11 w-full rounded-xl border border-brand-border bg-brand-card px-4 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-8.5 rounded-lg p-1 text-brand-muted hover:text-brand-heading"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchQuery && (
            <div className="absolute left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-brand-border bg-brand-card shadow-lg custom-scrollbar">
              {filteredDropdownColleges.length === 0 ? (
                <div className="p-3 text-xs text-brand-muted text-center">No matching colleges found</div>
              ) : (
                filteredDropdownColleges.map((college) => (
                  <button
                    key={college.id}
                    onClick={() => handleAddCollege(college.name)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-brand-body hover:bg-brand-bg transition-colors"
                  >
                    <span>{college.name}</span>
                    <span className="rounded-lg bg-brand-bg px-2 py-0.5 text-[10px] text-brand-muted">{college.code}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {compareColleges.map((name, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center space-x-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary border border-primary/20"
            >
              <span>{name.length > 25 ? name.slice(0, 25) + '...' : name}</span>
              <button onClick={() => handleRemoveCollege(name)} className="hover:text-error">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {compareColleges.length < 3 && (
            <span className="inline-flex items-center space-x-1.5 rounded-full border border-dashed border-brand-border px-3.5 py-1.5 text-xs text-brand-muted font-medium">
              <Plus className="h-3.5 w-3.5" />
              <span>Add up to {3 - compareColleges.length} more</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. COMPARISON WORKSPACE */}
      {comparedDetails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-brand-border bg-brand-card rounded-2xl p-8 text-center shadow-sm">
          <GitCompare className="h-12 w-12 text-brand-muted mb-4" />
          <h3 className="text-xl font-bold text-brand-heading">Select Colleges to Compare</h3>
          <p className="text-sm text-brand-body mt-2 max-w-md">
            Type college names in the search bar above or choose them from the Directory list to populate the comparison matrix table.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* COMPARATIVE MATRIX TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-brand-border bg-brand-card shadow-sm custom-scrollbar">
            <table className="min-w-full divide-y divide-brand-border text-xs sm:text-sm">
              <thead className="bg-brand-bg/50">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-brand-heading uppercase tracking-wider w-1/4">Parameters</th>
                  {comparedDetails.map(c => (
                    <th key={c.id} className="px-6 py-4 text-left font-bold text-brand-heading uppercase tracking-wider w-1/4 border-l border-brand-border">
                      <div className="truncate max-w-[200px]" title={c.name}>{c.name}</div>
                    </th>
                  ))}
                  {/* Empty headers if less than 3 compared */}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <th key={i} className="px-6 py-4 text-left text-brand-muted font-normal w-1/4 border-l border-brand-border italic">
                      Empty Slot
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-brand-border bg-brand-card">
                {/* College Code */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">College Code</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 text-brand-body border-l border-brand-border font-mono">{c.code}</td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">Location</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 text-brand-body border-l border-brand-border flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-brand-muted" />
                      {c.city}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* University */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">University</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 text-brand-body border-l border-brand-border leading-tight">{c.university}</td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* College Type */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">College Type</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 text-brand-body border-l border-brand-border">{c.type}</td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Tuition Fees */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">Annual Fees</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 text-brand-heading border-l border-brand-border font-bold">
                      {c.fees ? `₹${c.fees.toLocaleString('en-IN')}` : "Information currently unavailable."}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Average Placement Package */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">Avg Package (LPA)</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 border-l border-brand-border font-bold text-accent">
                      {c.averagePackage ? `${c.averagePackage} LPA` : "Information currently unavailable."}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Highest Placement Package */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">Highest Package (LPA)</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 border-l border-brand-border font-bold text-primary">
                      {c.highestPackage ? `${c.highestPackage} LPA` : "Information currently unavailable."}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Facilities */}
                <tr>
                  <td className="px-6 py-4 font-semibold text-brand-heading">Facilities</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-4 border-l border-brand-border font-medium text-xs leading-normal">
                      <div className="flex flex-wrap gap-1.5">
                        {c.facilities ? c.facilities.map((fac, idx) => (
                          <span key={idx} className="inline-flex items-center rounded bg-brand-bg border border-brand-border px-2 py-0.5 text-brand-body">
                            <Check className="h-3 w-3 mr-0.5 text-success shrink-0" />
                            {fac}
                          </span>
                        )) : "Information currently unavailable."}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-4 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>

                {/* Website */}
                <tr>
                  <td className="px-6 py-3 font-semibold text-brand-heading">Website</td>
                  {comparedDetails.map(c => (
                    <td key={c.id} className="px-6 py-3 border-l border-brand-border">
                      {c.website ? (
                        <a 
                          href={c.website} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center text-primary hover:underline font-bold"
                        >
                          <span>Visit Site</span>
                          <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                        </a>
                      ) : (
                        "Information currently unavailable."
                      )}
                    </td>
                  ))}
                  {Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <td key={i} className="px-6 py-3 border-l border-brand-border text-brand-muted">-</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* VISUAL CHARTS */}
          {comparedDetails.length >= 2 && (
            <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-brand-heading">Placement & Fees Chart Analysis</h3>
              </div>

              {/* Chart */}
              <div className="h-72 w-full pr-4 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
                    <XAxis dataKey="name" stroke="var(--brand-muted)" />
                    <YAxis stroke="var(--brand-muted)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }} />
                    <Legend />
                    <Bar dataKey="Average Package (LPA)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Highest Package (LPA)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Fees (₹10k)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex items-start space-x-2 bg-brand-bg rounded-xl p-3.5 text-xs text-brand-body border border-brand-border">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>
                  Note: Fees are plotted as ₹10k increments for scaling (e.g. a value of 13.5 represents ₹135,000/year). Placements are in Lakhs Per Annum (LPA).
                </span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
