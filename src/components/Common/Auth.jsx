import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';
import { CITIES, UNIVERSITIES, BRANCHES as MOCK_BRANCHES } from '../../db/mockData';
import { dbService } from '../../services/dbService';

export default function Auth({ onAuthSuccess, authWarning, setAuthWarning }) {
  const { login, signup, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [branchesList, setBranchesList] = useState(MOCK_BRANCHES);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [admissionType, setAdmissionType] = useState('CET');
  const [score, setScore] = useState('');
  const [category, setCategory] = useState('OPEN');
  const [gender, setGender] = useState('Male');
  const [homeUniversity, setHomeUniversity] = useState('SPPU (Pune)');
  const [branchPreference, setBranchPreference] = useState('Computer Engineering');

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await dbService.getBranches();
        if (list && list.length > 0) {
          setBranchesList(list);
        }
      } catch (err) {
        console.error('Failed to load branches from DB', err);
      }
    };
    loadBranches();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setLoading(true);
    try {
      await login(signInEmail, signInPassword);
      if (onAuthSuccess) onAuthSuccess('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName || !score) return;
    setLoading(true);
    try {
      const profileData = {
        name: signUpName,
        admissionType,
        score: parseFloat(score),
        category,
        gender,
        homeUniversity,
        branchPreference
      };
      await signup(signUpEmail, signUpPassword, profileData);
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess('dashboard');
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Brand Logo and Title */}
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/src/assets/logocm.png" alt="CollegeMate Logo" className="h-16 w-auto object-contain mb-2" />
        <h2 className="text-xl font-bold text-brand-heading">
          College<span className="text-primary">Mate</span>
        </h2>
        <p className="text-xs text-brand-muted mt-1">Your Smart Admission Companion</p>
      </div>

      {/* CARD FRAME */}
      <div className="overflow-hidden rounded-2xl bg-brand-card shadow-lg border border-brand-border transition-colors duration-200">
        
        {/* Warning messages */}
        {authWarning && !authError && !successMsg && (
          <div className="mx-6 mt-6 flex items-center space-x-2 rounded-lg bg-warning/10 p-3 text-xs text-warning border border-warning/20">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{authWarning}</span>
          </div>
        )}

        {/* TAB HEADERS */}
        <div className="flex border-b border-brand-border bg-brand-bg/50">
          <button
            onClick={() => { setIsLogin(true); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
              isLogin 
                ? 'bg-brand-card border-b-2 border-primary text-primary' 
                : 'text-brand-muted hover:text-brand-heading'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
              !isLogin 
                ? 'bg-brand-card border-b-2 border-primary text-primary' 
                : 'text-brand-muted hover:text-brand-heading'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="px-6 py-8 sm:px-10">
          {authError && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg bg-error/10 p-3 text-sm text-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg bg-success/10 p-3 text-sm text-success">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {isLogin ? (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-heading mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="student@collegemate.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-heading mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-heading mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Amit Patil"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="block h-11 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-heading mb-1">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="amit@gmail.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="block h-11 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-heading mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="block h-11 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              </div>

              {/* ACADEMICS */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border">
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">Admission Type</label>
                  <select
                    value={admissionType}
                    onChange={(e) => setAdmissionType(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="CET">1st Year (MHT-CET)</option>
                    <option value="DSE">Direct 2nd Yr (Diploma)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">
                    {admissionType === 'CET' ? 'CET Percentile' : 'Diploma %'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="96.50"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-3 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="OPEN">OPEN (General)</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="VJ">VJ (DT-A)</option>
                    <option value="NT-A">NT-A (NT1)</option>
                    <option value="NT-B">NT-B (NT2)</option>
                    <option value="NT-C">NT-C (NT3)</option>
                    <option value="NT-D">NT-D (NT4)</option>
                    <option value="SBC">SBC</option>
                    <option value="SEBC">SEBC</option>
                    <option value="EWS">EWS</option>
                    <option value="TFWS">TFWS</option>
                    <option value="PWD">PWD</option>
                    <option value="DEFENCE">DEFENCE</option>
                    <option value="ORPHAN">ORPHAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-body mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-body mb-1">Home University Region</label>
                <select
                  value={homeUniversity}
                  onChange={(e) => setHomeUniversity(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  <option value="SPPU (Pune)">SPPU (Pune Region)</option>
                  <option value="MU (Mumbai)">MU (Mumbai Region)</option>
                  <option value="Shivaji (Sangli/Kolhapur)">Shivaji University</option>
                  <option value="DBATU (Statewide)">DBATU (Autonomous/Other)</option>
                  <option value="RTMNU (Nagpur)">RTMNU (Nagpur Region)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-body mb-1">Branch Preference</label>
                <select
                  value={branchPreference}
                  onChange={(e) => setBranchPreference(e.target.value)}
                  className="block h-10 w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 text-brand-heading focus:border-primary focus:outline-none text-xs"
                >
                  {branchesList.map(b => (
                    <option key={b.code} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors pt-2.5"
              >
                <UserPlus className="h-5 w-5" />
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
