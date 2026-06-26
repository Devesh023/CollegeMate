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

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-muted justify-center md:justify-start">
          <button onClick={() => setActiveTab('predictor')} className="hover:text-primary transition-colors cursor-pointer">Predictor</button>
          <button onClick={() => setActiveTab('search')} className="hover:text-primary transition-colors cursor-pointer">Search Colleges</button>
          <button onClick={() => setActiveTab('compare')} className="hover:text-primary transition-colors cursor-pointer">Compare</button>
          <button 
            onClick={() => {
              setActiveTab('landing');
              setTimeout(() => {
                const el = document.getElementById('feedback-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }} 
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Feedback
          </button>
          <button 
            onClick={() => {
              setActiveTab('landing');
              setTimeout(() => {
                const el = document.getElementById('founder-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }} 
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Meet the Founder
          </button>
        </div>

        <p className="text-xs text-brand-muted">
          &copy; {new Date().getFullYear()} CollegeMate. By Devesh Sonawane.
        </p>

      </div>
    </footer>
  );
}
