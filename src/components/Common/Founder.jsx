import React from 'react';
import { Mail, Globe } from 'lucide-react';

// Custom inline SVG for LinkedIn
const LinkedinIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Custom inline SVG for GitHub
const GithubIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Founder() {
  return (
    <div 
      id="founder-section" 
      className="w-full transition-colors duration-200 animate-fadeIn"
    >
      <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-card/75 backdrop-blur-md p-8 sm:p-10 lg:p-12 shadow-2xl flex flex-col items-center justify-center text-center gap-6">
        
        {/* Soft background glows */}
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>

        {/* Left Side: Profile Photo */}
        <div className="flex justify-center relative z-10">
          <div className="group relative">
            {/* Soft decorative glow ring behind photo */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-indigo-600 opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"></div>
            
            <img 
              src="https://github.com/Devesh023.png" 
              alt="Devesh Sonawane" 
              loading="lazy"
              className="relative h-[120px] w-[120px] rounded-full object-cover border-4 border-brand-card shadow-lg transform group-hover:scale-105 transition-all duration-300 ease-out select-none"
              onError={(e) => {
                // Fallback avatar if offline
                e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80";
              }}
            />
          </div>
        </div>

        {/* Right Side: Text & Contact */}
        <div className="space-y-4 relative z-10 w-full flex flex-col items-center">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Meet the Founder
            </span>
            <h2 id="founder-title" className="text-xl sm:text-2xl font-bold tracking-tight text-brand-heading">
              Devesh Sonawane
            </h2>
            <p className="text-xs font-semibold text-secondary">
              Founder & Full Stack Developer
            </p>
          </div>

          <p className="text-sm text-brand-body leading-relaxed max-w-[280px]">
            Computer Technology student passionate about building educational technology solutions that simplify engineering admissions and help students make informed career decisions.
          </p>

          {/* Social Links & Info Grid - Compact */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-left text-xs max-w-[280px] w-full pt-1">
            {/* Email */}
            <a 
              href="mailto:deveshsonawane023@gmail.com" 
              className="flex items-center space-x-2 text-brand-body hover:text-primary transition-colors focus:outline-none focus:underline"
              aria-label="Email"
            >
              <Mail className="h-4 w-4 shrink-0 text-brand-muted" />
              <span>Email</span>
            </a>
            
            {/* LinkedIn */}
            <a 
              href="https://www.linkedin.com/in/devesh-sonawane-4b7965366/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-2 text-brand-body hover:text-primary transition-colors focus:outline-none focus:underline"
              aria-label="LinkedIn"
            >
              <LinkedinIcon className="h-4 w-4 shrink-0 text-brand-muted" />
              <span>LinkedIn</span>
            </a>

            {/* Portfolio */}
            <a 
              href="https://deveshsonawane.dev" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-2 text-brand-body hover:text-primary transition-colors focus:outline-none focus:underline"
              aria-label="Portfolio"
            >
              <Globe className="h-4 w-4 shrink-0 text-brand-muted" />
              <span>Portfolio</span>
            </a>

            {/* GitHub */}
            <a 
              href="https://github.com/Devesh023" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-2 text-brand-body hover:text-primary transition-colors focus:outline-none focus:underline"
              aria-label="GitHub"
            >
              <GithubIcon className="h-4 w-4 shrink-0 text-brand-muted" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Action Buttons in a Single Row */}
          <div className="flex flex-row gap-3 w-full max-w-[280px] pt-3 justify-center">
            <a
              href="https://www.linkedin.com/in/devesh-sonawane-4b7965366/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary hover:bg-primary-hover px-4 text-xs font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-center"
            >
              View LinkedIn
            </a>
            <a
              href="mailto:deveshsonawane023@gmail.com"
              className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border border-brand-border bg-brand-bg hover:bg-brand-border/40 px-4 text-xs font-bold text-brand-heading transition-colors text-center"
            >
              Contact Email
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
