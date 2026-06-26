import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getCutoffHistory } from '../../services/predictor';
import logoImg from '../../assets/logocm.png';
import { 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  TrendingUp, 
  Info, 
  ExternalLink, 
  X,
  Sparkles,
  DollarSign,
  Briefcase,
  Printer,
  FileText,
  Download,
  Loader,
  Building2,
  Search,
  SlidersHorizontal,
  Check,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// Reusable Safe Helper Utilities to harden production code
const safeArray = (arr) => {
  return Array.isArray(arr) ? arr : [];
};

const safeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str);
};

const safeNumber = (num, fallback = 0) => {
  if (num === null || num === undefined) return fallback;
  const parsed = parseFloat(num);
  return isNaN(parsed) ? fallback : parsed;
};

const safeSplit = (str, separator = ',') => {
  const s = safeString(str);
  if (!s) return [];
  return s.split(separator);
};

const safeUniversity = (univ) => {
  const s = safeString(univ);
  if (!s) return 'MS';
  if (s.includes('(')) {
    return s.split?.('(')?.[1]?.replace?.(')', '') || s;
  }
  return s;
};

const getRColor = (p) => {
  const score = safeNumber(p);
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  if (score >= 20) return 'text-primary';
  return 'text-error';
};

const getRBg = (p) => {
  const score = safeNumber(p);
  if (score >= 80) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  if (score >= 20) return 'bg-primary';
  return 'bg-error';
};

const paginateSection = (items, itemsPerPage = 20) => {
  const pages = [];
  const list = safeArray(items);
  const size = safeNumber(itemsPerPage, 20);
  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size));
  }
  return pages;
};

const getTop30Recommendations = (predictions) => {
  const getCutoffValue = (item) => safeNumber(item?.cutoffScore);
  const sortDesc = (a, b) => getCutoffValue(b) - getCutoffValue(a);

  const dreamSorted = [...safeArray(predictions?.dream)].sort(sortDesc);
  const reachSorted = [...safeArray(predictions?.reach)].sort(sortDesc);
  const moderateSorted = [...safeArray(predictions?.moderate)].sort(sortDesc);
  const safeSorted = [...safeArray(predictions?.safe)].sort(sortDesc);

  return [
    ...dreamSorted.map(item => ({ ...item, bucket: 'Dream' })),
    ...reachSorted.map(item => ({ ...item, bucket: 'Reach' })),
    ...moderateSorted.map(item => ({ ...item, bucket: 'Moderate' })),
    ...safeSorted.map(item => ({ ...item, bucket: 'Safe' }))
  ].slice(0, 30);
};

export default function PredictorResults({ predictions, cutoffs, currentProfile, onModify }) {
  const { user, toggleSavedCollege } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('safe');
  const [selectedTrend, setSelectedTrend] = useState(null); // { collegeName, collegeId, branch }
  const [expandedExplains, setExpandedExplains] = useState({});
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // UI-only search, sort, quick filter, compare selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('cutoff_desc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [comparedColleges, setComparedColleges] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Reusable float-getter
  const getCutoffValue = useCallback((item) => safeNumber(item?.cutoffScore), []);
  const sortDesc = useCallback((a, b) => getCutoffValue(b) - getCutoffValue(a), [getCutoffValue]);

  // Memoized sorted arrays for all buckets
  const dreamSorted = useMemo(() => [...safeArray(predictions?.dream)].sort(sortDesc), [predictions?.dream, sortDesc]);
  const reachSorted = useMemo(() => [...safeArray(predictions?.reach)].sort(sortDesc), [predictions?.reach, sortDesc]);
  const moderateSorted = useMemo(() => [...safeArray(predictions?.moderate)].sort(sortDesc), [predictions?.moderate, sortDesc]);
  const safeSorted = useMemo(() => [...safeArray(predictions?.safe)].sort(sortDesc), [predictions?.safe, sortDesc]);

  // Memoized top 30 recommendations (Single Source of Truth)
  const top30 = useMemo(() => {
    return [
      ...dreamSorted.map(item => ({ ...item, bucket: 'Dream' })),
      ...reachSorted.map(item => ({ ...item, bucket: 'Reach' })),
      ...moderateSorted.map(item => ({ ...item, bucket: 'Moderate' })),
      ...safeSorted.map(item => ({ ...item, bucket: 'Safe' }))
    ].slice(0, 30);
  }, [dreamSorted, reachSorted, moderateSorted, safeSorted]);

  // Memoized counts
  const dreamCount = useMemo(() => dreamSorted.length, [dreamSorted]);
  const reachCount = useMemo(() => reachSorted.length, [reachSorted]);
  const moderateCount = useMemo(() => moderateSorted.length, [moderateSorted]);
  const safeCount = useMemo(() => safeSorted.length, [safeSorted]);

  // Memoized tabs metadata
  const tabs = useMemo(() => [
    { id: 'safe', label: 'Safe Colleges', count: safeCount, color: 'text-success border-success/30 bg-success/5 shadow-success/5', hoverColor: 'hover:border-success/50', activeGlow: 'ring-4 ring-success/20 border-success bg-success/10' },
    { id: 'moderate', label: 'Moderate Colleges', count: moderateCount, color: 'text-warning border-warning/30 bg-warning/5 shadow-warning/5', hoverColor: 'hover:border-warning/50', activeGlow: 'ring-4 ring-warning/20 border-warning bg-warning/10' },
    { id: 'dream', label: 'Dream Colleges', count: dreamCount, color: 'text-primary border-primary/30 bg-primary/5 shadow-primary/5', hoverColor: 'hover:border-primary/50', activeGlow: 'ring-4 ring-primary/20 border-primary bg-primary/10' }
  ], [safeCount, moderateCount, dreamCount]);

  const handleDownloadPDF = async () => {
    // PDF Validation before export
    if (top30.length === 0) {
      alert("No recommendations available to export.");
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const template = document.getElementById('pdf-render-template');
      if (!template) {
        alert("PDF template not found!");
        return;
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pagesCount = template.children.length;
      console.log(`[PDF] Total pages to generate: ${pagesCount}`);

      for (let i = 0; i < pagesCount; i++) {
        const pageElement = template.children[i];
        
        const canvas = await html2canvas(pageElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save(`CollegeMate_Premium_Option_Form_${new Date().toISOString()?.slice?.(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate high-resolution PDF download. Falling back to print dialog.');
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const toggleExplain = (idx) => {
    setExpandedExplains(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const savedCollegeIds = safeArray(user?.profile?.savedColleges);
  const totalPredicted = safeArray(predictions?.allPredicted).length;
  const currentList = predictions ? safeArray(predictions[activeSubTab]) : [];
  const filterTrace = predictions?.filterTrace;

  const handleOpenTrendModal = (item) => {
    // Get historical trend
    const history = getCutoffHistory(item.collegeId, item.branch, currentProfile.admissionType, cutoffs);
    
    setSelectedTrend({
      collegeName: item.collegeName,
      collegeId: item.collegeId,
      branch: item.branch,
      admissionType: currentProfile.admissionType,
      history
    });
  };

  const handleSaveToggle = async (collegeId) => {
    if (!user) {
      alert('Please Sign In to save favorite colleges!');
      return;
    }
    await toggleSavedCollege(collegeId);
  };

  const handleCompareToggle = (code) => {
    if (!code) return;
    setComparedColleges(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Filtered and sorted current list based on local UI filters
  const filteredAndSortedList = useMemo(() => {
    let list = [...currentList];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        safeString(item.collegeName).toLowerCase().includes(q) || 
        safeString(item.code).toLowerCase().includes(q) || 
        safeString(item.branch).toLowerCase().includes(q) || 
        safeString(item.city).toLowerCase().includes(q)
      );
    }

    // Quick filter chips
    if (quickFilter === 'govt') {
      list = list.filter(item => safeString(item.collegeName).toLowerCase().includes('govt') || safeString(item.collegeName).toLowerCase().includes('government'));
    } else if (quickFilter === 'autonomous') {
      list = list.filter(item => safeString(item.collegeName).toLowerCase().includes('autonomous') || item.autonomous === true);
    }

    // Sort logic
    if (sortBy === 'cutoff_desc') {
      list.sort((a, b) => safeNumber(b.cutoffScore) - safeNumber(a.cutoffScore));
    } else if (sortBy === 'cutoff_asc') {
      list.sort((a, b) => safeNumber(a.cutoffScore) - safeNumber(b.cutoffScore));
    } else if (sortBy === 'prob_desc') {
      list.sort((a, b) => safeNumber(b.probability) - safeNumber(a.probability));
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => safeString(a.collegeName).localeCompare(safeString(b.collegeName)));
    }

    return list;
  }, [currentList, searchQuery, sortBy, quickFilter]);

  // Compared colleges detailed list
  const comparedItems = useMemo(() => {
    if (comparedColleges.length === 0) return [];
    const all = [
      ...dreamSorted.map(item => ({ ...item, bucket: 'Dream' })),
      ...reachSorted.map(item => ({ ...item, bucket: 'Reach' })),
      ...moderateSorted.map(item => ({ ...item, bucket: 'Moderate' })),
      ...safeSorted.map(item => ({ ...item, bucket: 'Safe' }))
    ];
    return all.filter(item => comparedColleges.includes(item.code || item.choiceCode));
  }, [comparedColleges, dreamSorted, reachSorted, moderateSorted, safeSorted]);

  const renderPdfPages = (recommendationsList) => {
    const list = safeArray(recommendationsList);
    const dreamCount = predictions?.dream?.length || 0;
    const reachCount = predictions?.reach?.length || 0;
    const moderateCount = predictions?.moderate?.length || 0;
    const safeCount = predictions?.safe?.length || 0;

    const paginatedPages = [];
    for (let i = 0; i < list.length; i += 10) {
      paginatedPages.push(list.slice(i, i + 10));
    }

    const totalPages = 1 + paginatedPages.length;
    let pageNum = 1;
    
    const pageStyle = {
      width: '794px',
      height: '1123px',
      boxSizing: 'border-box',
      padding: '50px',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderBottom: '1px solid #eee'
    };

    const headerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #1e3a8a',
      paddingBottom: '10px',
      marginBottom: '20px'
    };

    const footerStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '10px',
      fontSize: '10px',
      color: '#64748b'
    };

    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '10px',
      textAlign: 'left',
      marginTop: '10px'
    };

    const thStyle = {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
      fontWeight: 'bold',
      padding: '10px 8px',
      borderBottom: '1.5px solid #cbd5e1',
      fontSize: '10px'
    };

    const tdStyle = {
      padding: '10px 8px',
      borderBottom: '1px solid #e2e8f0',
      color: '#334155',
      verticalAlign: 'middle',
      fontSize: '10px'
    };

    const pages = [];

    // PAGE 1: COVER
    pages.push(
      <div key="cover" style={pageStyle}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoImg} style={{ height: '32px', width: 'auto' }} alt="CollegeMate" />
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '-0.5px' }}>COLLEGEMATE</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>PREMIUM REPORT</span>
            </div>
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              Admission Strategy Blueprint
            </h1>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              Customized Option Form Sequencing Recommendations (Top 30)
            </p>
          </div>

          <div style={{ marginTop: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Student Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Percentile</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{currentProfile?.score} {currentProfile?.admissionType === 'DSE' || currentProfile?.admissionType === 'DIRECT_SECOND_YEAR_ENGINEERING' ? '%' : 'Percentile'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Category & Gender</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{currentProfile?.category} · {currentProfile?.gender}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Home University</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{currentProfile?.homeUniversity || 'MS State'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Preferred Branch</span>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{currentProfile?.branchPreference || 'Any Branch'}</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recommendation Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fef2f2' }}>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', display: 'block' }}>DREAM</span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#991b1b' }}>{dreamCount}</h2>
              </div>
              <div style={{ border: '1px solid #fed7aa', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fff7ed' }}>
                <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold', display: 'block' }}>REACH</span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#c2410c' }}>{reachCount}</h2>
              </div>
              <div style={{ border: '1px solid #fde047', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fefcbf' }}>
                <span style={{ fontSize: '11px', color: '#ca8a04', fontWeight: 'bold', display: 'block' }}>MODERATE</span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#854d0e' }}>{moderateCount}</h2>
              </div>
              <div style={{ border: '1px solid #86efac', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#f0fdf4' }}>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 'bold', display: 'block' }}>SAFE</span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#166534' }}>{safeCount}</h2>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '20px', fontSize: '11.5px', lineHeight: '1.6' }}>
            <strong style={{ color: '#1e40af', display: 'block', marginBottom: '8px', fontSize: '12px' }}>Choice Code Sequencing Strategy:</strong>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a' }}>
              <li style={{ marginBottom: '6px' }}><strong>Dream Options:</strong> Aspirational choices with cutoffs higher than your score. Place at the very top.</li>
              <li style={{ marginBottom: '6px' }}><strong>Reach Options:</strong> Reachable options that are slightly above or matching your percentile.</li>
              <li style={{ marginBottom: '6px' }}><strong>Moderate Options:</strong> Realistic options that match your score profile perfectly.</li>
              <li style={{ marginBottom: '4px' }}><strong>Safe Options:</strong> Safe backup colleges to guarantee admission in early rounds. Place at the bottom.</li>
            </ul>
          </div>
        </div>

        <div style={footerStyle}>
          <span>Generated by CollegeMate</span>
          <span>Page {pageNum++} of {totalPages}</span>
          <span>Generated Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    );

    // REMAINING PAGES: TABLE PAGES
    paginatedPages.forEach((pageItems, pIdx) => {
      pages.push(
        <div key={`table-page-${pIdx}`} style={pageStyle}>
          <div>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={logoImg} style={{ height: '20px', width: 'auto' }} alt="CollegeMate" />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>Admissions Strategy Blueprint</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
                TOP 30 RECOMMENDATIONS
              </div>
            </div>

            <h2 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sequenced College Recommendations (Page {pIdx + 1} of {paginatedPages.length})
            </h2>

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '35px', textAlign: 'center' }}>Seq</th>
                  <th style={{ ...thStyle, width: '80px' }}>Choice Code</th>
                  <th style={{ ...thStyle, width: '210px' }}>College</th>
                  <th style={{ ...thStyle, width: '120px' }}>Branch</th>
                  <th style={{ ...thStyle, width: '55px', textAlign: 'center' }}>Category</th>
                  <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}>Cutoff</th>
                  <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Student Percentile</th>
                  <th style={{ ...thStyle, width: '55px', textAlign: 'center' }}>Difference</th>
                  <th style={{ ...thStyle, width: '65px', textAlign: 'center' }}>Bucket</th>
                  <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}>Probability</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const globalIdx = pIdx * 10 + idx + 1;
                  return (
                    <tr key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{globalIdx}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: '600', fontSize: '9px' }}>{item.choiceCode || item.code || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: '600', fontSize: '9px', width: '210px', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.2' }}>
                        {item.collegeName}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '9px', whiteSpace: 'normal', lineHeight: '1.2' }}>{item.branch}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: '9px' }}>{item.matchedCategory || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: '9px' }}>{item.cutoffScore}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontSize: '9px' }}>{currentProfile.score}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '9px', color: item.difference >= 0 ? '#15803d' : '#b91c1c' }}>
                        {item.difference >= 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          color: item.bucket === 'Dream' ? '#991b1b' : item.bucket === 'Reach' ? '#c2410c' : item.bucket === 'Moderate' ? '#854d0e' : '#166534',
                          backgroundColor: item.bucket === 'Dream' ? '#fef2f2' : item.bucket === 'Reach' ? '#fff7ed' : item.bucket === 'Moderate' ? '#fefcbf' : '#f0fdf4'
                        }}>
                          {item.bucket}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '9px' }}>{item.probability}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={footerStyle}>
            <span>Generated by CollegeMate</span>
            <span>Page {pageNum++} of {totalPages}</span>
            <span>Generated Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      );
    });

    return pages;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. GLASSMORPHIC TABS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSearchQuery(''); // reset search query on tab change
              }}
              className={`relative overflow-hidden rounded-2xl border p-4 text-center backdrop-blur-md transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                isActive 
                  ? `${tab.activeGlow} shadow-lg font-bold text-brand-heading`
                  : `${tab.color} ${tab.hoverColor} text-brand-muted`
              }`}
            >
              <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                {tab.label}
              </span>
              <span className="block text-3xl font-black mt-2 text-brand-heading">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. COLLAPSIBLE PROCESS PIPELINE TRACE */}
      {filterTrace && (
        <div className="rounded-2xl border border-brand-border bg-brand-card shadow-sm overflow-hidden transition-all duration-300">
          <button
            onClick={() => setShowDebug(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-brand-heading hover:bg-brand-bg/50 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-brand-muted" />
              <span>Admissions Predictor Processing Pipeline Trace</span>
            </div>
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full">
              {showDebug ? "Hide Trace Metrics" : "Expand Trace Metrics"}
            </span>
          </button>
          
          <AnimatePresence>
            {showDebug && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-brand-border bg-brand-bg/40 px-5 py-4 text-xs font-mono space-y-3 divide-y divide-brand-border/40 text-left"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3">
                  <div>
                    <span className="font-bold text-brand-heading block mb-1">Data Processing Steps:</span>
                    <div className="space-y-1 text-brand-body text-[11px]">
                      <div>• Raw Database Records: <strong className="text-brand-heading">{filterTrace.rawRecords}</strong></div>
                      <div>• After Admission Pathway Filter: <strong className="text-brand-heading">{filterTrace.afterAdmission}</strong></div>
                      <div>• Target Year Selection ({filterTrace.targetYear}): <strong className="text-brand-heading">{filterTrace.afterYear}</strong></div>
                      <div>• Category Seat Mapping: <strong className="text-brand-heading">{filterTrace.afterCategory}</strong></div>
                      <div>• Branch Selection Filter: <strong className="text-brand-heading">{filterTrace.afterBranch}</strong></div>
                      <div>• Final Seat Grouping & Deduplication: <strong className="text-brand-heading">{filterTrace.afterGrouping ?? filterTrace.afterPercentile}</strong></div>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-brand-heading block mb-1">Algorithm Diagnostics:</span>
                    <div className="space-y-1 text-brand-body text-[11px]">
                      <div>• Deduplication Key: <strong className="text-brand-heading font-mono">{filterTrace.groupingKey || 'college_code-branch_name'}</strong></div>
                      <div>• Total Unique Colleges: <strong className="text-brand-heading">{filterTrace.uniqueCollegesCount ?? '—'}</strong></div>
                      <div>• Total Unique Branches: <strong className="text-brand-heading">{filterTrace.uniqueBranchesCount ?? '—'}</strong></div>
                      <div>• Classification Threshold: <strong className="text-brand-heading">{filterTrace.finalRecommendations ?? filterTrace.afterPercentile} matches</strong></div>
                    </div>
                  </div>
                </div>
                <div className="pt-3">
                  <span className="font-bold text-brand-heading block mb-1.5">Seat Distribution:</span>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-2.5 py-1 rounded-lg border border-success/30 bg-success/5 text-success font-semibold">Safe: {filterTrace.buckets.safe}</span>
                    <span className="px-2.5 py-1 rounded-lg border border-warning/30 bg-warning/5 text-warning font-semibold">Moderate: {filterTrace.buckets.moderate}</span>
                    <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold">Dream: {filterTrace.buckets.dream}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. OPTION SEQUENCE BLUEPRINT HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3 text-left">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-brand-heading text-sm">Custom Admission Strategy Blueprint</h4>
            <p className="text-xs text-brand-body">Generate a sequenced choice code list for your CAP round application form.</p>
          </div>
        </div>
        <button
          onClick={() => setShowStrategyModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Generate Blueprint</span>
        </button>
      </div>

      {/* 4. SEARCH AND FILTERS BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-brand-card border border-brand-border rounded-2xl shadow-sm">
        
        {/* Search input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-brand-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by college name, DTE code, city, or branch..."
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-brand-border bg-brand-bg text-brand-heading placeholder:text-brand-muted text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-brand-muted hover:text-brand-heading cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort and Quick filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Filter chips */}
          <div className="flex items-center space-x-1 bg-brand-bg p-1 rounded-xl border border-brand-border/60">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                quickFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-heading'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setQuickFilter('govt')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                quickFilter === 'govt'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-heading'
              }`}
            >
              Govt
            </button>
            <button
              onClick={() => setQuickFilter('autonomous')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                quickFilter === 'autonomous'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-heading'
              }`}
            >
              Autonomous
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative select-container flex items-center bg-brand-bg border border-brand-border/60 rounded-xl px-2.5 h-10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-muted mr-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-brand-heading border-none focus:outline-none focus:ring-0 cursor-pointer pr-4"
            >
              <option value="cutoff_desc" className="bg-brand-card">Cutoff (High to Low)</option>
              <option value="cutoff_asc" className="bg-brand-card">Cutoff (Low to High)</option>
              <option value="prob_desc" className="bg-brand-card">Probability (Highest First)</option>
              <option value="name_asc" className="bg-brand-card">College Name (A-Z)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 5. RECOMMENDATIONS CONTAINER */}
      {filteredAndSortedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-brand-border bg-brand-card rounded-2xl text-center max-w-xl mx-auto space-y-4 my-8 shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl"></div>
            <div className="relative bg-primary/10 text-primary p-5 rounded-full shrink-0">
              <Search className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-brand-heading">No Recommendations Found</h3>
          <p className="text-sm text-brand-body max-w-sm">
            {searchQuery 
              ? "We couldn't find any colleges matching your search query. Try clearing the search query or choosing a different tab." 
              : "No colleges matched your filters or score profile under this category. Adjust your percentile score, category, or branch selection to expand search range."}
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onModify}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-md cursor-pointer"
            >
              Modify Inputs
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                onModify();
              }}
              className="px-4 py-2 border border-brand-border bg-brand-card text-brand-heading hover:bg-brand-bg text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset Predictor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAndSortedList.map((item, idx) => {
            const isBookmarked = savedCollegeIds.map(Number).includes(Number(item.collegeId));
            return (
              <div 
                key={idx}
                className="group relative rounded-2xl border border-brand-border bg-brand-card shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between overflow-hidden text-left"
              >
                
                {/* College Image header */}
                <div className="relative h-28 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center overflow-hidden border-b border-brand-border/40 shrink-0">
                  {/* Modern stylized campus grid/pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                  
                  {/* Glowing background circles for modern SaaS visual look */}
                  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl"></div>
                  <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-accent/10 blur-2xl"></div>

                  <Building2 className="h-10 w-10 text-primary/40 relative z-10 animate-pulse" />
                  
                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
                    {/* Dream/Moderate/Safe badge */}
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                      activeSubTab === 'safe' 
                        ? 'bg-green-500/10 border-green-500/20 text-success backdrop-blur-md' 
                        : activeSubTab === 'moderate' 
                        ? 'bg-amber-500/10 border-amber-500/20 text-warning backdrop-blur-md' 
                        : 'bg-blue-500/10 border-blue-500/20 text-primary backdrop-blur-md'
                    }`}>
                      {activeSubTab} Option
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5">
                    {/* Save/Bookmark icon */}
                    <button
                      onClick={() => handleSaveToggle(item.collegeId)}
                      className={`rounded-lg border p-1.5 transition-all shadow-sm cursor-pointer backdrop-blur-md ${
                        isBookmarked
                          ? 'border-accent bg-accent text-white scale-105'
                          : 'border-brand-border bg-brand-card/85 text-brand-muted hover:text-brand-heading hover:scale-105'
                      }`}
                      title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
                    >
                      {isBookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Code & Compare Checkbox row */}
                    <div className="flex items-center justify-between text-[10px] text-brand-muted font-bold tracking-wider mb-1">
                      <span>DTE CODE: {item.code || item.choiceCode}</span>
                      <label className="flex items-center space-x-1 cursor-pointer hover:text-brand-heading transition-colors">
                        <input 
                          type="checkbox" 
                          checked={comparedColleges.includes(item.code || item.choiceCode)}
                          onChange={() => handleCompareToggle(item.code || item.choiceCode)}
                          className="rounded border-brand-border text-primary focus:ring-primary/20 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>Compare</span>
                      </label>
                    </div>

                    <h3 className="font-extrabold text-brand-heading group-hover:text-primary transition-colors text-sm sm:text-base leading-snug">
                      {item.collegeName}
                    </h3>
                    <p className="text-xs text-brand-body font-semibold mt-1">
                      {item.branch}
                    </p>
                    <div className="flex items-center text-[11px] text-brand-muted mt-1.5">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-brand-muted shrink-0" />
                      <span>{item.city} ({safeUniversity(item.university)})</span>
                    </div>
                  </div>

                  {/* Core details grid (Cutoff, Score, Difference) */}
                  <div className="grid grid-cols-3 gap-2 border-t border-brand-border/40 pt-3 text-xs">
                    <div>
                      <span className="block text-[9px] text-brand-muted uppercase font-bold">Cutoff</span>
                      <strong className="text-brand-heading text-xs sm:text-sm">{item.cutoffScore}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-brand-muted uppercase font-bold">Your Score</span>
                      <strong className="text-brand-heading text-xs sm:text-sm">{currentProfile.score}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] text-brand-muted uppercase font-bold">Difference</span>
                      <strong className={`text-xs sm:text-sm font-black ${item.difference >= 0 ? 'text-success' : 'text-error'}`}>
                        {item.difference >= 0 ? `+${item.difference}` : item.difference}
                      </strong>
                    </div>
                  </div>

                  {/* Placement Package & Fees */}
                  <div className="grid grid-cols-2 gap-2 bg-brand-bg/40 p-2 text-[10px] sm:text-[11px] rounded-xl border border-brand-border/40">
                    <div className="flex items-center space-x-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div>
                        <span className="block text-[8px] text-brand-muted uppercase font-bold leading-tight">Avg Package</span>
                        <span className="font-bold text-brand-heading whitespace-nowrap">{item.averagePackage ? `${item.averagePackage} LPA` : "Not Available"}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-accent shrink-0" />
                      <div>
                        <span className="block text-[8px] text-brand-muted uppercase font-bold leading-tight">Annual Fees</span>
                        <span className="font-bold text-brand-heading whitespace-nowrap">{item.fees ? `₹${item.fees.toLocaleString('en-IN')}` : "Not Available"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 border-t border-brand-border/40 flex space-x-1.5">
                    <button
                      onClick={() => handleOpenTrendModal(item)}
                      className="flex-1 flex items-center justify-center space-x-1 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg py-2 text-[10px] font-bold text-brand-heading transition-colors cursor-pointer"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>Trends</span>
                    </button>
                    <button
                      onClick={() => toggleExplain(idx)}
                      className={`px-2.5 py-2 rounded-xl border text-[10px] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                        expandedExplains[idx]
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-brand-border bg-brand-card text-brand-heading hover:bg-brand-bg'
                      }`}
                      title="Why this match?"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>Why?</span>
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(item.collegeName)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center rounded-xl border border-brand-border bg-brand-card px-2.5 hover:bg-brand-bg transition-colors"
                      title="Google Search"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-brand-muted" />
                    </a>
                  </div>
                </div>

                {/* EXPLAIN PANEL */}
                {expandedExplains[idx] && (
                  <div className="mt-2 border-t border-brand-border bg-brand-bg/50 p-4 text-xs space-y-2 animate-fadeIn text-left">
                    <div className="flex items-center space-x-1 text-primary font-bold">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      <span>Match Explanation</span>
                    </div>
                    <div className="space-y-1.5 text-brand-body leading-relaxed text-[11px]">
                      <p>• Your score is <strong className="text-brand-heading">{currentProfile.score}</strong> percentile/marks.</p>
                      <p>• The target cutoff for category <strong className="text-brand-heading">{item.matchedCategory || currentProfile.category}</strong> was <strong className="text-brand-heading">{item.cutoffScore}</strong>.</p>
                      <p>• This results in a score delta of <strong className={item.difference >= 0 ? 'text-success font-bold' : 'text-error font-bold'}>{item.difference >= 0 ? `+${item.difference}` : item.difference}</strong>.</p>
                      <p>• Our engine classifies this under the <strong className="uppercase font-extrabold text-primary">{item.recommendation}</strong> bucket based on standard CAP cutoff variance trends.</p>
                      {currentProfile.homeUniversity && item.university?.includes(currentProfile.homeUniversity) && (
                        <p className="text-success font-semibold">
                          • HU Boost: Your Home University ({currentProfile.homeUniversity}) matches the college region. Home University quota preferences apply.
                        </p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* 6. FLOATING COMPARE BANNER */}
      {comparedColleges.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-brand-card/90 backdrop-blur-md border border-primary/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center justify-between space-x-8 max-w-lg w-full animate-slideUp">
          <div className="text-left">
            <span className="block text-[9px] uppercase font-bold text-primary tracking-wider">College Comparison</span>
            <span className="text-xs font-extrabold text-brand-heading">{comparedColleges.length} Colleges selected for comparison</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setComparedColleges([])}
              className="px-3 py-1.5 border border-brand-border text-brand-body hover:bg-brand-bg text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:bg-primary-hover shadow-md transition-colors cursor-pointer"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}

      {/* 7. COMPARE COLLEGES DETAIL MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl rounded-2xl border border-brand-border bg-brand-card p-6 shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-start justify-between pb-4 border-b border-brand-border mb-6">
              <div>
                <h3 className="font-bold text-brand-heading text-lg">College Comparison Matrix</h3>
                <p className="text-xs text-brand-body mt-0.5">Compare key parameters of your selected options side-by-side.</p>
              </div>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="rounded-xl border border-brand-border p-2 text-brand-muted hover:text-brand-heading hover:bg-brand-bg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-brand-border">
              <table className="min-w-full divide-y divide-brand-border text-xs sm:text-sm">
                <thead className="bg-brand-bg">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-brand-heading">Parameters</th>
                    {comparedItems.map((item, idx) => (
                      <th key={idx} className="px-4 py-3 text-center font-bold text-primary max-w-[200px] truncate">
                        {item.collegeName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-brand-card text-brand-body text-center">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">DTE Code</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5 font-mono font-semibold">{item.code || item.choiceCode}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Branch</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5 font-medium max-w-[200px] truncate" title={item.branch}>{item.branch}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">City</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5">{item.city}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Cutoff Percentile</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5 font-bold text-brand-heading">{item.cutoffScore}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Difference</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className={`px-4 py-2.5 font-bold ${item.difference >= 0 ? 'text-success' : 'text-error'}`}>
                        {item.difference >= 0 ? `+${item.difference}` : item.difference}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Bucket</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          item.bucket === 'Dream' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : item.bucket === 'Reach' 
                            ? 'bg-orange-50 text-orange-700 border-orange-200' 
                            : item.bucket === 'Moderate' 
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {item.bucket}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Avg Package</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5 font-bold text-brand-heading">
                        {item.averagePackage ? `${item.averagePackage} LPA` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-brand-heading text-left">Annual Fees</td>
                    {comparedItems.map((item, idx) => (
                      <td key={idx} className="px-4 py-2.5 font-bold text-brand-heading">
                        {item.fees ? `₹${item.fees.toLocaleString('en-IN')}` : "N/A"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-md transition-colors cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. HISTORIC TREND LINE CHART MODAL */}
      {selectedTrend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-brand-border mb-6">
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {selectedTrend.admissionType} Pathway Trend
                </span>
                <h3 className="font-bold text-brand-heading text-lg mt-1">{selectedTrend.collegeName}</h3>
                <p className="text-xs text-brand-body mt-0.5">{selectedTrend.branch}</p>
              </div>
              <button 
                onClick={() => setSelectedTrend(null)}
                className="rounded-xl border border-brand-border p-2 text-brand-muted hover:text-brand-heading hover:bg-brand-bg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Chart */}
            <div className="space-y-6">
              
              <div className="h-64 sm:h-72 w-full pr-4 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedTrend.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border)" />
                    <XAxis dataKey="year" stroke="var(--brand-muted)" />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="var(--brand-muted)" 
                      label={{ value: selectedTrend.admissionType === 'CET' ? 'Percentile' : 'Percentage', angle: -90, position: 'insideLeft', style: { fill: 'var(--brand-muted)' } }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--brand-card)', borderColor: 'var(--brand-border)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="OPEN" stroke="#2563EB" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="OBC" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="SC" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="ST" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-brand-border">
                <table className="min-w-full divide-y divide-brand-border text-xs sm:text-sm">
                  <thead className="bg-brand-bg">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-bold text-brand-heading">Year</th>
                      <th className="px-4 py-2.5 text-center font-bold text-primary">OPEN</th>
                      <th className="px-4 py-2.5 text-center font-bold text-accent">OBC</th>
                      <th className="px-4 py-2.5 text-center font-bold text-warning">SC</th>
                      <th className="px-4 py-2.5 text-center font-bold text-error">ST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border bg-brand-card text-center">
                    {selectedTrend.history.map((row, idx) => (
                      <tr key={idx} className="hover:bg-brand-bg/50">
                        <td className="px-4 py-2.5 font-bold text-brand-heading text-left">{row.year}</td>
                        <td className="px-4 py-2.5 text-brand-body">{row.OPEN || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-brand-body">{row.OBC || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-brand-body">{row.SC || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-brand-body">{row.ST || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center space-x-2 rounded-xl bg-brand-bg p-3 text-xs text-brand-body">
                <Sparkles className="h-4.5 w-4.5 text-primary shrink-0" />
                <span>Admission trends are based on CAP round statistics. Cutoffs typically fluctuate based on paper difficulty and seat count.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. STRATEGY BLUEPRINT MODAL */}
      {showStrategyModal && (
        <div id="print-modal-container" className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/85 backdrop-blur-md p-4 no-print-backdrop">
          <div className="relative w-full max-w-4xl rounded-2xl border border-brand-border bg-brand-card p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* CSS style block for printing */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #print-modal-container, #print-modal-container * {
                  visibility: visible !important;
                }
                #print-modal-container {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  background: white !important;
                  color: black !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                /* Reset scroll container for printing */
                #print-modal-container > div {
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                  padding: 0 !important;
                }
                .print-hide {
                  display: none !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                @page {
                  size: A4;
                  margin: 1.5cm 1.5cm;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
            `}</style>

            {/* Modal Actions Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-border mb-6 print-hide">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-brand-heading text-lg">Your Option Entry Strategy</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-success text-white rounded-xl text-xs font-bold hover:bg-success-hover transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Report</span>
                </button>
                <button 
                  onClick={() => setShowStrategyModal(false)}
                  className="rounded-xl border border-brand-border p-2 text-brand-muted hover:text-brand-heading hover:bg-brand-bg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div id="printable-blueprint" className="space-y-6 text-left">
              
              {/* Document Header */}
              <div className="text-center space-y-1 pb-6 border-b border-brand-border">
                <h1 className="text-2xl font-black text-brand-heading tracking-tight">COLLEGEMATE PREMIUM ADMISSION STRATEGY</h1>
                <p className="text-sm text-brand-muted">MHT-CET / DSE CAP Option Form Sequencing Blueprint</p>
                <div className="text-xs text-brand-body pt-2">
                  Generated on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} · Confidential & Personalized
                </div>
              </div>

              {/* Profile Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4 text-xs">
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Admission Pathway</span>
                  <span className="font-bold text-brand-heading">{currentProfile.admissionType === 'DIRECT_SECOND_YEAR_ENGINEERING' || currentProfile.admissionType === 'DSE' ? 'Direct Second Year (DSE)' : 'First Year Engineering (CET)'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Student Score</span>
                  <span className="font-bold text-brand-heading">{currentProfile.score} {currentProfile.admissionType === 'DSE' ? '%' : 'Percentile'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Category & Gender</span>
                  <span className="font-bold text-brand-heading">{currentProfile.category} · {currentProfile.gender}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Home University</span>
                  <span className="font-bold text-brand-heading">{currentProfile.homeUniversity || 'MS State'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Preferred Course</span>
                  <span className="font-bold text-brand-heading">{currentProfile.branchPreference || 'Any Branch'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-muted uppercase font-bold">Matching Options</span>
                  <span className="font-bold text-brand-heading">{top30.length} Options (Top 30)</span>
                </div>
              </div>

              {/* Sequencing Guidelines */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
                <div className="flex items-center space-x-1.5 text-primary font-bold">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Choice Code Formatting & Sequencing Guidelines</span>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-brand-body leading-relaxed">
                  <li>
                    <strong>Sequence Strategy:</strong> Place your aspirational choices (Dream) at the top of your list. If you get allocated a Dream choice, you can freeze it. Realistic choices (Moderate) must follow, and safety fallback options (Safe) must be placed at the bottom to guarantee you secure a seat in early rounds.
                  </li>
                  <li>
                    <strong>Choice Codes structure:</strong> Each branch option in a college has a specific 9-digit choice code (e.g. <code>617524510</code>). Make sure you enter the correct code corresponding to General Shift (ends in <code>10</code>), TFWS (ends in <code>11T</code> or similar), or EWS options.
                  </li>
                  <li>
                    <strong>Betterment Option:</strong> If you are allocated any option other than Option 1, you can opt for "Betterment" and participate in subsequent CAP Rounds. If Option 1 is allocated, it is auto-frozen, and you must accept it.
                  </li>
                </ul>
              </div>

              {/* Option List Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-brand-heading text-sm uppercase tracking-wider">Sequenced Option Recommendations (Top 30)</h3>
                <div className="overflow-x-auto rounded-xl border border-brand-border">
                  <table className="min-w-full divide-y divide-brand-border text-xs">
                    <thead className="bg-brand-bg">
                      <tr>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading w-12">Seq</th>
                        <th className="px-3 py-2.5 text-left font-bold text-brand-heading w-24">Choice Code</th>
                        <th className="px-3 py-2.5 text-left font-bold text-brand-heading">College</th>
                        <th className="px-3 py-2.5 text-left font-bold text-brand-heading">Branch</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Category</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Cutoff</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Student Percentile</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Difference</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Bucket</th>
                        <th className="px-3 py-2.5 text-center font-bold text-brand-heading">Probability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-brand-card">
                      {top30.map((item, idx) => (
                        <tr key={idx} className="hover:bg-brand-bg/40">
                          <td className="px-3 py-2.5 text-center font-bold text-brand-heading">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-brand-heading font-semibold">
                            {item.choiceCode || `${item.code || '—'}`}
                          </td>
                          <td className="px-3 py-2.5 text-brand-heading font-semibold text-left max-w-xs truncate">
                            {item.collegeName}
                          </td>
                          <td className="px-3 py-2.5 text-brand-body text-left">{item.branch}</td>
                          <td className="px-3 py-2.5 text-center text-brand-body">{item.matchedCategory || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-brand-body">{item.cutoffScore}</td>
                          <td className="px-3 py-2.5 text-center text-brand-body">{currentProfile.score}</td>
                          <td className={`px-3 py-2.5 text-center font-bold ${item.difference >= 0 ? 'text-success' : 'text-error'}`}>
                            {item.difference >= 0 ? `+${item.difference}` : item.difference}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              item.bucket === 'Dream' 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : item.bucket === 'Reach' 
                                ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                : item.bucket === 'Moderate' 
                                ? 'bg-yellow-50 text-yellow-800 border-yellow-200' 
                                : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {item.bucket}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-brand-heading">{item.probability}%</td>
                        </tr>
                      ))}
                      {top30.length === 0 && (
                        <tr>
                          <td colSpan="10" className="px-4 py-8 text-center text-brand-muted">
                            No recommendations found to generate blueprint list.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-6 border-t border-brand-border flex justify-between text-[10px] text-brand-muted">
                <span>CollegeMate Admissions Engine (v2.0)</span>
                <span>© {new Date().getFullYear()} CollegeMate. All Rights Reserved.</span>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="mt-8 flex justify-end space-x-2 border-t border-brand-border pt-4 print-hide">
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 border border-brand-border rounded-xl text-xs font-semibold text-brand-body hover:bg-brand-bg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPdf}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-success text-white rounded-xl text-xs font-bold hover:bg-success-hover transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Option List</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden high-res PDF generation templates */}
      <div id="pdf-render-template" style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px', zIndex: -100 }}>
        {renderPdfPages(top30)}
      </div>

    </div>
  );
}
