import React, { useState, useEffect, useMemo } from 'react';
import PredictorForm from './PredictorForm';
import PredictorResults from './PredictorResults';
import { dbService } from '../../services/dbService';
import { predictColleges } from '../../services/predictor';
import { Sparkles, Info, ArrowLeft, Loader, Lock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error in CollegePredictor:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <div className="inline-flex rounded-full bg-error/10 p-4 text-error mb-4">
            <Info className="h-10 w-10 text-error" />
          </div>
          <h3 className="text-xl font-bold text-brand-heading">Something went wrong</h3>
          <p className="text-sm text-brand-body mt-2 max-w-md mx-auto">
            An unexpected error occurred while rendering the CAP Round Predictor.
          </p>
          <pre className="mt-4 p-4 rounded-xl bg-brand-bg border border-brand-border text-xs text-left overflow-x-auto max-w-lg mx-auto font-mono text-error">
            {this.state.error?.toString()}
          </pre>
          <div className="mt-6 flex justify-center space-x-4">
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center space-x-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white cursor-pointer"
            >
              <span>Try Again</span>
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center space-x-2 rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg px-4 py-2 text-sm font-semibold text-brand-heading cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function CollegePredictorContent({ onBack, setActiveTab }) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const renderTrialBadge = () => {
    if (user) return null;
    const count = parseInt(localStorage.getItem('cm_prediction_count') || '0', 10);
    let remainingText = '';
    let badgeColor = '';
    if (count === 0) {
      remainingText = 'Predictions Remaining: 2';
      badgeColor = 'bg-primary/10 border-primary/20 text-primary';
    } else if (count === 1) {
      remainingText = 'Predictions Remaining: 1';
      badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500';
    } else {
      remainingText = 'Free Trial Completed';
      badgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500';
    }

    return (
      <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${badgeColor} shadow-sm transition-all duration-200`}>
        <span>🎁 Free Trial</span>
        <span className="h-1.5 w-1.5 rounded-full bg-current/40"></span>
        <span>{remainingText}</span>
      </div>
    );
  };
  const [colleges, setColleges] = useState([]);
  const [branches, setBranches] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [predictionsCutoffs, setPredictionsCutoffs] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  // Cycling prediction loader messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = useMemo(() => [
    "Preparing student profile...",
    "Loading cutoff database...",
    "Matching colleges...",
    "Calculating probabilities...",
    "Finalizing recommendations..."
  ], []);

  useEffect(() => {
    let interval;
    if (predicting) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [predicting, loadingMessages]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        console.log("[Predictor] Initial data load: Colleges & Branches");
        const [colList, branchList] = await Promise.all([
          dbService.getColleges(),
          dbService.getBranches()
        ]);
        setColleges(colList || []);
        setBranches(branchList || []);
      } catch (err) {
        console.error('Error fetching database tables in predictor:', err);
        setError(err.message || String(err));
        
        // Fallback to whatever local mock data is available
        try {
          const fallbackCols = await dbService.getColleges();
          const fallbackBrs = await dbService.getBranches();
          setColleges(fallbackCols || []);
          setBranches(fallbackBrs || []);
        } catch (e) {
          console.error("Local fallback also failed:", e);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-predict after redirecting from authentication
  useEffect(() => {
    if (user && colleges.length > 0) {
      const pending = localStorage.getItem('cm_pending_prediction');
      if (pending) {
        localStorage.removeItem('cm_pending_prediction');
        localStorage.removeItem('cm_auth_redirect');
        try {
          const profile = JSON.parse(pending);
          handlePredict(profile);
        } catch (e) {
          console.error("Failed to parse pending prediction:", e);
        }
      }
    }
  }, [user, colleges]);

  const handlePredict = async (profile) => {
    if (!profile) {
      setPredictions(null);
      setCurrentProfile(null);
      setPredictionError(null);
      return;
    }

    // Check prediction limit for guest users
    if (!user) {
      const count = parseInt(localStorage.getItem('cm_prediction_count') || '0', 10);
      if (count >= 2) {
        setShowLoginModal(true);
        localStorage.setItem('cm_pending_prediction', JSON.stringify(profile));
        localStorage.setItem('cm_auth_redirect', 'predictor');
        return;
      }
    }
    
    setPredicting(true);
    setPredictionError(null);
    try {
      console.log(`[Predictor] Fetching cutoffs for pathway: ${profile.admissionType}...`);
      let cutList = [];
      try {
        cutList = await dbService.getCutoffsFiltered({
          admissionType: profile.admissionType
        });
      } catch (err) {
        console.error("Failed to fetch filtered cutoffs from Supabase:", err);
        setPredictionError("Failed to load official cutoff records from the cloud. Falling back to local offline mock records.");
        // Fallback: get cutoffs locally
        cutList = await dbService.getCutoffs();
      }
      
      const currentCutoffs = cutList || [];
      setPredictionsCutoffs(currentCutoffs);
      setCurrentProfile(profile);
      
      const results = predictColleges(profile, colleges, currentCutoffs);
      setPredictions(results);

      // Increment count on successful prediction for guests
      if (!user) {
        const count = parseInt(localStorage.getItem('cm_prediction_count') || '0', 10);
        localStorage.setItem('cm_prediction_count', (count + 1).toString());
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setPredictionError(err.message || String(err));
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200 text-left animate-fadeIn">
      
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

      {/* HEADER Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-heading">
            CAP Round Predictor
          </h1>
          <p className="mt-1 text-sm text-brand-body">
            {predictions 
              ? "Analyze your customized admission probability results and generate option form sequencing."
              : "Enter your academic details below to predict college admission chances."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {renderTrialBadge()}
          {predictions && !predicting && (
            <button
              onClick={() => handlePredict(null)}
              className="px-4 py-2 border border-brand-border bg-brand-card text-xs font-bold rounded-xl text-brand-heading hover:bg-brand-bg transition-colors flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Modify Details</span>
            </button>
          )}
        </div>
      </div>

      {/* ERROR OR LOADING NOTIFICATIONS */}
      {error && (
        <div className="mb-6 flex items-start space-x-2.5 rounded-xl border border-error/20 bg-error/5 p-4 text-xs text-error animate-slideDown">
          <Info className="h-5 w-5 shrink-0 text-error mt-0.5" />
          <div>
            <span className="font-bold block">Database Connection Warning</span>
            <p className="mt-1 text-brand-muted leading-relaxed">
              We couldn't connect to the Supabase database. The predictor has fallen back to offline mock records so you can still use the tool. (Error: {error})
            </p>
          </div>
        </div>
      )}

      {predictionError && (
        <div className="mb-6 flex items-start space-x-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-600 dark:text-amber-500 animate-slideDown">
          <Info className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-bold block">Prediction Connection Warning</span>
            <p className="mt-1 leading-relaxed">
              {predictionError}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-6 flex items-center space-x-2 rounded-xl border border-brand-border bg-brand-card/50 p-4 text-xs text-brand-muted">
          <Loader className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span>Initializing college database from Supabase... Form remains editable.</span>
        </div>
      )}

      {/* FULL WIDTH CONDITIONAL CONTENT AREA */}
      <div>
        {predicting ? (
          <div className="space-y-8 py-8">
            {/* Premium Progress Loader Header */}
            <div className="flex flex-col items-center justify-center p-8 bg-brand-card border border-brand-border/60 rounded-2xl shadow-lg max-w-2xl mx-auto text-center space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Outer spinning ring */}
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                {/* Inner pulse */}
                <div className="absolute h-10 w-10 bg-primary/10 rounded-full animate-pulse flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-brand-heading">Running College Predictor Engine</h4>
                <p className="text-sm font-bold text-primary transition-all duration-300 animate-pulse">
                  {loadingMessages[loadingMsgIdx]}
                </p>
              </div>
              {/* Simulated progress bar */}
              <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden max-w-md mx-auto border border-brand-border/40">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((loadingMsgIdx + 1) / loadingMessages.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="animate-pulse border border-brand-border bg-brand-card rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                      <div className="h-3 bg-brand-border rounded w-1/4"></div>
                      <div className="h-4 bg-brand-border rounded w-full"></div>
                    </div>
                    <div className="h-8 bg-brand-border rounded-full w-1/4"></div>
                  </div>
                  <div className="border-t border-brand-border pt-4 space-y-2">
                    <div className="h-3 bg-brand-border rounded w-3/4"></div>
                    <div className="h-3 bg-brand-border rounded w-1/2"></div>
                    <div className="h-3 bg-brand-border rounded w-2/3"></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-brand-border pt-4">
                    <div className="h-8 bg-brand-border rounded"></div>
                    <div className="h-8 bg-brand-border rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : predictions ? (
          <PredictorResults 
            predictions={predictions} 
            cutoffs={predictionsCutoffs}
            currentProfile={currentProfile} 
            onModify={() => handlePredict(null)}
          />
        ) : (
          <PredictorForm onPredict={handlePredict} branches={branches} />
        )}

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-border bg-brand-card p-6 shadow-2xl space-y-6 text-center animate-scaleIn">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-brand-muted hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-brand-heading tracking-tight">
                  Unlock Unlimited Predictions
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  You have already used your 2 free college predictions. Create a FREE CollegeMate account to continue predicting colleges, save your profile, compare colleges, and unlock unlimited predictions.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('cm_auth_tab', 'signup');
                    localStorage.setItem('cm_auth_redirect', 'predictor');
                    setShowLoginModal(false);
                    if (setActiveTab) setActiveTab('auth');
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('cm_auth_tab', 'login');
                    localStorage.setItem('cm_auth_redirect', 'predictor');
                    setShowLoginModal(false);
                    if (setActiveTab) setActiveTab('auth');
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-sm font-semibold text-brand-heading hover:bg-brand-border/40 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-xs font-semibold text-brand-muted hover:text-brand-heading py-2 transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default function CollegePredictor(props) {
  return (
    <ErrorBoundary>
      <CollegePredictorContent {...props} />
    </ErrorBoundary>
  );
}
