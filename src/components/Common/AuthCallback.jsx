import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/dbService';

export default function AuthCallback({ setActiveTab }) {
  const { user, loading: authLoading, authError } = useAuth();
  const [status, setStatus] = useState('Completing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        let session = null;
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        if (!active) return;

        // If we have a session or if the session resolution is complete
        if (session || (!authLoading && user)) {
          setStatus('Session restored! Finalizing redirect...');
          
          // Read cm_auth_redirect and fallback to dashboard
          const redirect = localStorage.getItem('cm_auth_redirect') || 'dashboard';
          localStorage.removeItem('cm_auth_redirect');
          
          // Clear callback URL in browser history using replaceState
          let targetPath = '/dashboard';
          if (redirect === 'predictor') targetPath = '/predictor';
          else if (redirect === 'search') targetPath = '/search';
          else if (redirect === 'branches') targetPath = '/branches';
          else if (redirect === 'rankings') targetPath = '/rankings';
          else if (redirect === 'compare') targetPath = '/compare';
          else if (redirect === 'profile') targetPath = '/profile';
          else if (redirect === 'landing') targetPath = '/';

          window.history.replaceState(null, '', targetPath);
          setActiveTab(redirect);
        } else if (!authLoading && !user) {
          // If auth loading finished, but there's no user session, fail
          throw new Error('No user session resolved after authentication callback.');
        }
      } catch (err) {
        console.error('[AuthCallback] Authentication check failed:', err);
        if (active) {
          setError(err.message || String(err));
        }
      }
    }

    checkSession();

    // Fallback: 5-second timeout
    const timeout = setTimeout(() => {
      if (active && !user && !error) {
        console.warn('[AuthCallback] Session check timed out. Redirecting to landing.');
        window.history.replaceState(null, '', '/');
        setActiveTab('landing');
      }
    }, 5000);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [user, authLoading, error, setActiveTab]);

  if (error || authError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-bg transition-colors duration-200 text-center px-4">
        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-card/75 backdrop-blur-xl p-8 max-w-sm w-full shadow-2xl space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-brand-heading">Authentication Error</h3>
            <p className="text-sm text-brand-body leading-relaxed">
              {error || authError}
            </p>
          </div>
          <button
            onClick={() => {
              window.history.replaceState(null, '', '/login');
              setActiveTab('auth');
            }}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-bg transition-colors duration-200 text-center px-4">
      <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-card/75 backdrop-blur-xl p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-brand-heading">Completing Sign In</h3>
          <p className="text-sm text-brand-body">{status}</p>
        </div>
      </div>
    </div>
  );
}
