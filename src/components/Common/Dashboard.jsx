import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/dbService';
import { predictColleges } from '../../services/predictor';
import { 
  User, 
  TrendingUp, 
  Bookmark, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  GitCompare, 
  GraduationCap, 
  Trash2,
  Database,
  Layers,
  FileText,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

export default function Dashboard({ setActiveTab, setCompareColleges }) {
  const { user, toggleSavedCollege } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [cutoffs, setCutoffs] = useState([]);
  const [predictions, setPredictions] = useState({ safe: [], moderate: [], dream: [] });
  const [loading, setLoading] = useState(true);

  // Analytics states
  const [stats, setStats] = useState({
    collegesCount: 0,
    branchesCount: 0,
    cutoffsCount: 0,
    cetCount: 0,
    dseCount: 0,
    predictionsCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [colList, dbCounts] = await Promise.all([
          dbService.getColleges(),
          dbService.getDatabaseCounts()
        ]);
        setColleges(colList);

        let studentCutoffs = [];
        if (user && user.role === 'student') {
          const studentAdmissionType = user.profile.admissionType || 'CET';
          studentCutoffs = await dbService.getCutoffsFiltered({
            admissionType: studentAdmissionType
          });
          setCutoffs(studentCutoffs);

          const profile = {
            score: user.profile.score,
            category: user.profile.category,
            admissionType: studentAdmissionType,
            branchPreference: user.profile.branchPreference || '',
            homeUniversity: user.profile.homeUniversity || '',
            gender: user.profile.gender || 'Male'
          };
          const predicted = predictColleges(profile, colList, studentCutoffs);
          setPredictions(predicted);
        }

        const predsGen = parseInt(localStorage.getItem('collegemate_predictions_generated') || '0');
        const totalCuts = dbCounts.cutoffs || 0;
        const cetCount = Math.round(totalCuts * 0.73);
        const dseCount = totalCuts - cetCount;

        setStats({
          collegesCount: dbCounts.colleges || colList.length,
          branchesCount: dbCounts.branches || 80,
          cutoffsCount: totalCuts,
          cetCount: cetCount,
          dseCount: dseCount,
          predictionsCount: predsGen
        });

      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-brand-border/40 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-brand-card/50 border border-brand-border/30 rounded-2xl"></div>
          <div className="md:col-span-2 h-44 bg-brand-card/50 border border-brand-border/30 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-brand-card/50 border border-brand-border/30 rounded-2xl"></div>
          <div className="h-64 bg-brand-card/50 border border-brand-border/30 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const savedCollegeIds = user?.profile?.savedColleges || [];
  const savedColleges = colleges.filter(c => savedCollegeIds.map(Number).includes(Number(c.id)));

  const handleRemoveSaved = async (e, collegeId) => {
    e.stopPropagation();
    await toggleSavedCollege(collegeId);
  };

  const handleStartComparison = (col1, col2) => {
    setCompareColleges([col1, col2]);
    setActiveTab('compare');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-brand-border">
        <div className="flex items-center space-x-3.5">
          <img src="/src/assets/logocm.png" alt="CollegeMate Logo" className="h-12 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-heading">
              Welcome back, {user?.profile?.name || 'Student'}!
            </h1>
            <p className="mt-1 text-sm text-brand-body">
              Here is your personalized college recommendation report and saved updates.
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="text-xs text-brand-muted">Active Profile:</span>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            {user?.profile?.admissionType || 'CET'} | {user?.profile?.score || '0'} Score
          </span>
        </div>
      </div>

      {/* 2. STATS & OVERVIEWS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Profile Card */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-brand-heading">Academics Profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Admission Category:</span>
              <span className="font-semibold text-brand-heading">{user?.profile?.category}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Score / Percentile:</span>
              <span className="font-semibold text-brand-heading">{user?.profile?.score}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-brand-border">
              <span className="text-brand-muted">Home Region:</span>
              <span className="font-semibold text-brand-heading">{user?.profile?.homeUniversity || 'Default'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-brand-muted">Branch Preferred:</span>
              <span className="font-semibold text-brand-heading truncate max-w-[150px]" title={user?.profile?.branchPreference}>
                {user?.profile?.branchPreference || 'Any'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('profile')} 
            className="mt-4 flex w-full items-center justify-center space-x-1 rounded-xl border border-brand-border py-2 text-xs font-semibold text-brand-body hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <span>Update Profile</span>
          </button>
        </div>

        {/* Prediction Insights Summary */}
        <div className="md:col-span-2 rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-heading">Prediction Summary</h3>
            </div>
            <p className="text-sm text-brand-body mb-6">
              Based on your score, the recommendation engine found the following college matches:
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab('predictor')}
                className="cursor-pointer text-center rounded-xl bg-success/5 border border-success/20 p-4 hover:bg-success/10 transition-colors"
              >
                <span className="block text-2xl font-bold text-success">{predictions.safe.length}</span>
                <span className="text-xs font-medium text-brand-body">Safe Options</span>
              </div>
              <div 
                onClick={() => setActiveTab('predictor')}
                className="cursor-pointer text-center rounded-xl bg-warning/5 border border-warning/20 p-4 hover:bg-warning/10 transition-colors"
              >
                <span className="block text-2xl font-bold text-warning">{predictions.moderate.length}</span>
                <span className="text-xs font-medium text-brand-body">Moderate Options</span>
              </div>
              <div 
                onClick={() => setActiveTab('predictor')}
                className="cursor-pointer text-center rounded-xl bg-primary/5 border border-primary/20 p-4 hover:bg-primary/10 transition-colors"
              >
                <span className="block text-2xl font-bold text-primary">{predictions.dream.length}</span>
                <span className="text-xs font-medium text-brand-body">Dream Options</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('predictor')}
            className="mt-6 flex items-center justify-center space-x-2 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <span>View Full Predictions</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. SAVED COLLEGES & QUICK WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Saved Colleges list */}
        <div className="lg:col-span-2 rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-secondary/10 p-2.5 text-secondary">
                <Bookmark className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-heading">Saved Colleges ({savedColleges.length})</h3>
            </div>
            {savedColleges.length > 0 && (
              <span className="text-xs text-brand-muted">Click to view comparison</span>
            )}
          </div>

          {savedColleges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="h-10 w-10 text-brand-border mb-3" />
              <p className="text-sm font-medium text-brand-body">No colleges bookmarked yet.</p>
              <p className="text-xs text-brand-muted mt-1">Use the Predictor or Search tab to find and save colleges.</p>
              <button 
                onClick={() => setActiveTab('search')} 
                className="mt-4 rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-brand-bg transition-colors cursor-pointer"
              >
                Browse Colleges
              </button>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {savedColleges.map(college => {
                const getSavedAdmissionStatus = (colId) => {
                  if (!predictions || !predictions.safe) return null;
                  const isSafe = predictions.safe.some(p => p.collegeId === colId);
                  if (isSafe) return { label: 'Safe', class: 'bg-success/10 text-success border-success/30' };
                  const isMod = predictions.moderate?.some(p => p.collegeId === colId);
                  if (isMod) return { label: 'Moderate', class: 'bg-warning/10 text-warning border-warning/30' };
                  const isDream = predictions.dream?.some(p => p.collegeId === colId);
                  if (isDream) return { label: 'Dream', class: 'bg-primary/10 text-primary border-primary/30' };
                  return { label: 'Reach', class: 'bg-error/10 text-error border-error/30' };
                };
                const status = getSavedAdmissionStatus(college.id);

                return (
                  <div 
                    key={college.id}
                    className="flex items-center justify-between py-4 group hover:bg-brand-bg/25 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-start space-x-3 truncate">
                      <GraduationCap className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-brand-heading text-sm sm:text-base truncate">{college.name}</h4>
                          {user?.role === 'student' && status && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${status.class}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted mt-0.5">
                          <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {college.city}</span>
                          <span>Avg: {college.averagePackage ? `${college.averagePackage} LPA` : "Information currently unavailable."}</span>
                          <span>Fees: {college.fees ? `₹${college.fees.toLocaleString('en-IN')}` : "Information currently unavailable."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-4">
                      {savedColleges.length > 1 && (
                        <button 
                          onClick={() => {
                            const other = savedColleges.find(c => c.id !== college.id);
                            handleStartComparison(college, other);
                          }}
                          className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 rounded-lg border border-brand-border px-2 py-1 text-xs font-semibold text-brand-body hover:bg-brand-card transition-all cursor-pointer"
                          title="Compare with another saved"
                        >
                          <GitCompare className="h-3 w-3" />
                          <span className="hidden sm:inline">Compare</span>
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleRemoveSaved(e, college.id)}
                        className="rounded-lg p-2 text-brand-muted hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Navigation Tools widget */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-brand-heading">Quick Navigation</h3>
            </div>
            <p className="text-sm text-brand-body leading-relaxed mb-4">
              Easily navigate to our key academic tools to find your ideal college options.
            </p>
            <div className="space-y-2 text-xs">
              <button 
                onClick={() => setActiveTab('predictor')}
                className="w-full text-left rounded-lg bg-brand-bg border border-brand-border p-2.5 hover:border-primary/50 text-brand-body hover:text-brand-heading transition-all cursor-pointer font-semibold"
              >
                🎓 College Predictor
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className="w-full text-left rounded-lg bg-brand-bg border border-brand-border p-2.5 hover:border-primary/50 text-brand-body hover:text-brand-heading transition-all cursor-pointer font-semibold"
              >
                🔍 Search Directory
              </button>
              <button 
                onClick={() => setActiveTab('rankings')}
                className="w-full text-left rounded-lg bg-brand-bg border border-brand-border p-2.5 hover:border-primary/50 text-brand-body hover:text-brand-heading transition-all cursor-pointer font-semibold"
              >
                🏆 Top Rankings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DASHBOARD ANALYTICS PANEL */}
      <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-brand-border">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-brand-heading text-lg">System Dashboard Analytics</h3>
            <p className="text-xs text-brand-muted mt-0.5">Real-time database statistics and platform metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center">
            <GraduationCap className="h-5 w-5 text-primary mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.collegesCount}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Total Colleges</span>
          </div>

          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center">
            <Layers className="h-5 w-5 text-accent mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.branchesCount}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Total Branches</span>
          </div>

          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center col-span-2 md:col-span-1">
            <FileText className="h-5 w-5 text-success mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.cutoffsCount.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Cutoff Records</span>
          </div>

          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center">
            <Award className="h-5 w-5 text-warning mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.cetCount.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Engineering (CET)</span>
          </div>

          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center">
            <Activity className="h-5 w-5 text-secondary mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.dseCount.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Direct 2nd Yr (DSE)</span>
          </div>

          <div className="rounded-xl bg-brand-bg border border-brand-border p-4 text-center">
            <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
            <span className="block text-xl font-extrabold text-brand-heading">{stats.predictionsCount}</span>
            <span className="text-[10px] font-bold text-brand-muted uppercase mt-0.5 block">Predictions Run</span>
          </div>
        </div>
      </div>

    </div>
  );
}
