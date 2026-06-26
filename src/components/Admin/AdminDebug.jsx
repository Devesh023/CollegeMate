import React, { useState, useEffect } from 'react';
import { dbService, supabase } from '../../services/dbService';
import { ShieldCheck, ShieldAlert, ArrowLeft, RefreshCw, Server } from 'lucide-react';

export default function AdminDebug({ onBack }) {
  const [supabaseConnected, setSupabaseConnected] = useState('Checking...');
  const [adminUsersTable, setAdminUsersTable] = useState('Checking...');
  const [adminCount, setAdminCount] = useState('Checking...');
  const [envUrlLoaded, setEnvUrlLoaded] = useState('Checking...');
  const [envKeyLoaded, setEnvKeyLoaded] = useState('Checking...');
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    setEnvUrlLoaded(url ? 'Loaded' : 'Missing');
    setEnvKeyLoaded(key ? 'Loaded' : 'Missing');

    if (!url || !key || !supabase) {
      setSupabaseConnected('No');
      setAdminUsersTable('No');
      const localAdmins = JSON.parse(localStorage.getItem('collegemate_admin_users') || '[]');
      setAdminCount(`${localAdmins.length} (LocalStorage Fallback)`);
      setLoading(false);
      return;
    }

    try {
      // Check colleges connection
      const { data: cols, error: colErr } = await supabase
        .from('colleges')
        .select('id')
        .limit(1);

      if (colErr) {
        setSupabaseConnected('No (' + colErr.message + ')');
      } else {
        setSupabaseConnected('Yes');
      }

      // Check admin_users table
      const { data: admins, error: adminErr } = await supabase
        .from('admin_users')
        .select('*');

      if (adminErr) {
        console.error('admin_users check error:', adminErr);
        setAdminUsersTable('No (' + adminErr.message + ')');
        
        // Count from local storage
        const localAdmins = JSON.parse(localStorage.getItem('collegemate_admin_users') || '[]');
        setAdminCount(`${localAdmins.length} (LocalStorage Fallback)`);
      } else {
        setAdminUsersTable('Yes');
        setAdminCount(`${admins.length} (Supabase Cloud)`);
      }
    } catch (e) {
      setSupabaseConnected('No');
      setAdminUsersTable('No');
      setAdminCount('0 (Connection Error)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center space-x-1.5 text-xs font-bold text-brand-muted hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Portal</span>
      </button>

      <div className="rounded-3xl border border-brand-border bg-brand-card/70 backdrop-blur-xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 -z-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl"></div>

        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center space-x-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-heading">Admin Diagnostics</h2>
              <p className="text-xs text-brand-muted mt-0.5">Database connectivity and system configuration checks.</p>
            </div>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="rounded-xl border border-brand-border p-2.5 text-brand-body hover:bg-brand-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-brand-border">
            <span className="text-sm font-medium text-brand-muted">VITE_SUPABASE_URL</span>
            <span className={`text-sm font-bold ${envUrlLoaded === 'Loaded' ? 'text-success' : 'text-error'}`}>
              {envUrlLoaded}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-brand-border">
            <span className="text-sm font-medium text-brand-muted">VITE_SUPABASE_ANON_KEY</span>
            <span className={`text-sm font-bold ${envKeyLoaded === 'Loaded' ? 'text-success' : 'text-error'}`}>
              {envKeyLoaded}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-brand-border">
            <span className="text-sm font-medium text-brand-muted">Supabase Connected</span>
            <span className={`text-sm font-bold flex items-center space-x-1.5 ${supabaseConnected.startsWith('Yes') ? 'text-success' : 'text-error'}`}>
              {supabaseConnected.startsWith('Yes') ? (
                <ShieldCheck className="h-4.5 w-4.5" />
              ) : (
                <ShieldAlert className="h-4.5 w-4.5" />
              )}
              <span>{supabaseConnected}</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-brand-border">
            <span className="text-sm font-medium text-brand-muted">admin_users Table</span>
            <span className={`text-sm font-bold ${adminUsersTable.startsWith('Yes') ? 'text-success' : 'text-error'}`}>
              {adminUsersTable}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-brand-muted">Admin Account Count</span>
            <span className="text-sm font-bold text-brand-heading">
              {adminCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
