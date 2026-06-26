import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="border-t border-brand-border bg-brand-card py-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-brand-heading">
            College<span className="text-primary">Mate</span>
          </span>
          <span className="text-xs text-brand-muted border-l border-brand-border pl-2">
            Your Smart Admission Companion
          </span>
        </div>

        <div className="flex space-x-6 text-sm text-brand-muted">
          <button onClick={() => setActiveTab('predictor')} className="hover:text-primary transition-colors">Predictor</button>
          <button onClick={() => setActiveTab('search')} className="hover:text-primary transition-colors">Search Colleges</button>
          <button onClick={() => setActiveTab('compare')} className="hover:text-primary transition-colors">Compare</button>
        </div>

        <p className="text-xs text-brand-muted">
          &copy; {new Date().getFullYear()} CollegeMate. By Devesh Sonawane.
        </p>

      </div>
    </footer>
  );
}
