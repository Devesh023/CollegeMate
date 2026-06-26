import React, { useState, useEffect, useMemo } from 'react';
import PredictorForm from './PredictorForm';
import PredictorResults from './PredictorResults';
import { dbService } from '../../services/dbService';
import { predictColleges } from '../../services/predictor';
import { Sparkles, Info, ArrowLeft, Loader } from 'lucide-react';

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

function CollegePredictorContent({ onBack }) {
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

  const handlePredict = async (profile) => {
    if (!profile) {
      setPredictions(null);
      setCurrentProfile(null);
      setPredictionError(null);
      return;
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-brand-border pb-6">
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
        {predictions && !predicting && (
          <button
            onClick={() => handlePredict(null)}
            className="mt-4 sm:mt-0 px-4 py-2 border border-brand-border bg-brand-card text-xs font-bold rounded-xl text-brand-heading hover:bg-brand-bg transition-colors flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Modify Details</span>
          </button>
        )}
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
