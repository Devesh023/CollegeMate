import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logocm.png';
import { LogIn, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';
import { CITIES, UNIVERSITIES, BRANCHES as MOCK_BRANCHES } from '../../db/mockData';
import { dbService } from '../../services/dbService';

export default function Auth({ onAuthSuccess, authWarning, setAuthWarning }) {
  const { login, signup, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(() => {
    return localStorage.getItem('cm_auth_tab') !== 'signup';
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const redirectAfterAuth = () => {
    const target = localStorage.getItem('cm_auth_redirect') || 'dashboard';
    localStorage.removeItem('cm_auth_redirect');
    localStorage.removeItem('cm_auth_tab');
    if (onAuthSuccess) onAuthSuccess(target);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setLoading(true);
    try {
      await login(signInEmail, signInPassword);
      redirectAfterAuth();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName) return;
    setLoading(true);
    try {
      const profileData = {
        name: signUpName
      };
      await signup(signUpEmail, signUpPassword, profileData);
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        redirectAfterAuth();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInEmail) {
      alert("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('../../services/dbService');
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(signInEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        alert("Password reset email sent!");
      } else {
        alert("Mock password reset link sent to " + signInEmail);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Brand Logo and Title */}
      <div className="flex flex-col items-center justify-center mb-6">
        <img src={logoImg} alt="CollegeMate Logo" className="h-16 w-auto object-contain mb-2" />
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-brand-heading">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-primary hover:text-primary-hover focus:outline-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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
                className="flex h-12 w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors cursor-pointer"
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

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors pt-2.5 cursor-pointer"
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
