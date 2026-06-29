import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, CheckCircle, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import { BRANCHES as MOCK_BRANCHES } from '../../db/mockData';
import { dbService } from '../../services/dbService';

export default function Profile({ onBack }) {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [branchesList, setBranchesList] = useState(MOCK_BRANCHES);

  // Form states
  const [name, setName] = useState(user?.profile?.name || '');
  const [admissionType, setAdmissionType] = useState(user?.profile?.admissionType || '');
  const [score, setScore] = useState(user?.profile?.score ?? '');
  const [category, setCategory] = useState(user?.profile?.category || '');
  const [gender, setGender] = useState(user?.profile?.gender || '');
  const [homeUniversity, setHomeUniversity] = useState(user?.profile?.homeUniversity || '');
  const [branchPreference, setBranchPreference] = useState(user?.profile?.branchPreference || '');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg('Full Name is required');
      return;
    }
    setLoading(true);
    setSuccess(false);
    setErrorMsg('');
    try {
      await updateProfile({
        name,
        admissionType: admissionType || null,
        score: score !== '' ? parseFloat(score) : null,
        category: category || null,
        gender: gender || null,
        homeUniversity: homeUniversity || null,
        branchPreference: branchPreference || null
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 transition-colors duration-200">
      
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
      
      {/* HEADER */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-brand-border">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-heading">Profile Settings</h1>
          <p className="text-sm text-brand-body">Manage your academic details for college prediction.</p>
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm">
        
        {success && (
          <div className="mb-4 flex items-center space-x-2 rounded-xl bg-success/10 p-3 text-sm text-success">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>Academic profile updated successfully!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 flex items-center space-x-2 rounded-xl bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* USER INFO */}
          <div>
            <label className="block text-sm font-medium text-brand-heading mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-4 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-heading mb-1.5">Admission Pathway</label>
              <select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value)}
                className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 text-brand-heading focus:border-primary focus:outline-none text-sm"
              >
                <option value="">Not Set</option>
                <option value="CET">First Year Engineering (MHT-CET)</option>
                <option value="DSE">Direct Second Year Engineering (Diploma)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-heading mb-1.5">
                {admissionType === 'CET' ? 'MHT-CET Percentile' : (admissionType === 'DSE' ? 'Diploma Overall Percentage' : 'Score / Percentile')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-4 text-brand-heading placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-heading mb-1.5">Admission Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 text-brand-heading focus:border-primary focus:outline-none text-sm"
              >
                <option value="">Not Set</option>
                <option value="OPEN">OPEN (General Merit)</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="VJ">VJ (De-Notified Tribe A)</option>
                <option value="NT-A">NT-A (Nomadic Tribe 1)</option>
                <option value="NT-B">NT-B (Nomadic Tribe 2)</option>
                <option value="NT-C">NT-C (Nomadic Tribe 3)</option>
                <option value="NT-D">NT-D (Nomadic Tribe 4)</option>
                <option value="SBC">SBC (Special Backward Class)</option>
                <option value="SEBC">SEBC (Backward Class)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="TFWS">TFWS (Tuition Fee Waiver Scheme)</option>
                <option value="PWD">PWD (Persons with Disability)</option>
                <option value="DEFENCE">DEFENCE (Defence Personnel)</option>
                <option value="ORPHAN">ORPHAN (Orphan Candidate)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-heading mb-1.5">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 text-brand-heading focus:border-primary focus:outline-none text-sm"
              >
                <option value="">Not Set</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            {/* Note: The label in UI is 'Home Region' for better UX, but we continue to use the database column 'home_university' to maintain compatibility without changing schema. */}
            <label className="block text-sm font-medium text-brand-heading mb-1.5">Home Region</label>
            <select
              value={homeUniversity}
              onChange={(e) => setHomeUniversity(e.target.value)}
              className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 text-brand-heading focus:border-primary focus:outline-none text-sm"
            >
              <option value="">Not Set</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Nashik">Nashik</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Amravati">Amravati</option>
              <option value="Aurangabad">Aurangabad</option>
              <option value="Kolhapur">Kolhapur</option>
              <option value="Nanded">Nanded</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-heading mb-1.5">Preferred Engineering Branch</label>
            <select
              value={branchPreference}
              onChange={(e) => setBranchPreference(e.target.value)}
              className="block h-12 w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 text-brand-heading focus:border-primary focus:outline-none text-sm"
            >
              <option value="">Not Set</option>
              {branchesList.map(b => (
                <option key={b.code} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 items-center justify-center space-x-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-sm hover:bg-primary-hover focus:outline-none disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
