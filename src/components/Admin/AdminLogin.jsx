import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, ShieldAlert, Sparkles, Loader } from 'lucide-react';

export default function AdminLogin({ onBack }) {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await adminLogin(email, password);
      // Auth success is captured in AppContent session state listener
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-md rounded-3xl border border-brand-border bg-brand-card/65 backdrop-blur-xl p-8 shadow-2xl space-y-6">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 -z-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 -z-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl"></div>

        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-heading">
            Admin Access Portal
          </h2>
          <p className="mt-1.5 text-xs text-brand-muted">
            Secure pathway for yearly cutoff data uploads and university catalog management.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center space-x-2.5 rounded-2xl border border-error/30 bg-error/5 p-3.5 text-xs text-error">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
              Admin Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@collegemate.com"
              className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-heading shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-heading shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader className="h-4.5 w-4.5 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4.5 w-4.5" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Diagnostics & Back Link */}
        <div className="flex items-center justify-between pt-3 text-xs font-bold text-brand-muted border-t border-brand-border/40 mt-4">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            ← Back to Home
          </button>
          <a
            href="/admin/debug"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, '', '/admin/debug');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-primary hover:underline cursor-pointer"
          >
            Diagnostics 🛠️
          </a>
        </div>

      </div>
    </div>
  );
}
