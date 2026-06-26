import React from 'react';
import { 
  TrendingUp, 
  Search, 
  GitCompare, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  Award, 
  BookOpen, 
  Users 
} from 'lucide-react';

export default function Landing({ setActiveTab }) {
  const features = [
    {
      title: 'College Predictor',
      description: 'Sort engineering options into Safe, Moderate, and Dream lists instantly using MHT-CET & Diploma cutoffs.',
      icon: TrendingUp,
      tab: 'predictor',
      color: 'text-primary bg-primary/10'
    },
    {
      title: 'Advanced Search',
      description: 'Filter 300+ options by branch, location, tuition fees, placement packages, and university affiliation.',
      icon: Search,
      tab: 'search',
      color: 'text-accent bg-accent/10'
    },
    {
      title: 'Side-by-Side Comparison',
      description: 'Evaluate fees, median placement packages, campus facilities, and historic cutoffs side-by-side.',
      icon: GitCompare,
      tab: 'compare',
      color: 'text-secondary bg-secondary/10'
    }
  ];

  return (
    <div className="relative overflow-hidden transition-colors duration-200">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="absolute top-60 -left-40 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* 1. HERO SECTION */}
        <div className="relative pt-12 pb-16 text-center">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-6">
            <Award className="h-4 w-4" />
            <span>AI-Powered Admissions Predictor</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-brand-heading sm:text-5xl md:text-6xl leading-tight">
            Predict Your Dream <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Engineering College
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-brand-body leading-relaxed">
            Skip scanning through lengthy cutoff PDF tables. Get instant, personalized MHT-CET & DSE engineering admission recommendations with calculated probability ratings.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('predictor')}
              className="flex h-12 w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-lg hover:bg-primary-hover hover:scale-[1.02] transition-all duration-200"
            >
              <span>Predict Colleges Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold text-brand-muted flex items-center justify-center gap-1.5">
            <span>🎁 First 2 Predictions are FREE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-border/60"></span>
            <span>No login required</span>
          </p>
        </div>

        {/* Freemium Section */}
        <div className="my-10 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-brand-card p-8 sm:p-10 shadow-lg text-center space-y-6">
            {/* Background glowing spot */}
            <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-heading">
                Try CollegeMate Free
              </h2>
              <p className="text-sm text-brand-muted max-w-md mx-auto">
                Start predicting your dream engineering college in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left pt-2">
              {/* Free Trial Benefits */}
              <div className="space-y-4 rounded-2xl bg-brand-bg/40 p-5 border border-brand-border/40">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Free Benefits</span>
                <ul className="space-y-2.5 text-sm text-brand-body">
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold shrink-0">✅</span>
                    <span>2 Free College Predictions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-emerald-500 font-bold shrink-0">✅</span>
                    <span>No Login Required</span>
                  </li>
                </ul>
              </div>

              {/* Registered Benefits */}
              <div className="space-y-4 rounded-2xl bg-brand-bg/40 p-5 border border-brand-border/40">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Unlocked After Login</span>
                <ul className="space-y-2.5 text-sm text-brand-body">
                  <li className="flex items-center space-x-2">
                    <span className="shrink-0 text-sm">🔓</span>
                    <span>Unlimited Predictions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="shrink-0 text-sm">💾</span>
                    <span>Save Favourite Colleges</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="shrink-0 text-sm">📊</span>
                    <span>Compare Colleges</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="shrink-0 text-sm">⭐</span>
                    <span>Personalized Dashboard</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="shrink-0 text-sm">🤖</span>
                    <span>Future AI Features</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => setActiveTab('predictor')}
                className="inline-flex h-12 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-10 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all duration-200 cursor-pointer"
              >
                <span>Start Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[10px] font-medium text-brand-muted">
                No Credit Card Required
              </p>
            </div>
          </div>
        </div>

        {/* 2. STATS BANNER */}
        <div className="py-8">
          <div className="rounded-2xl bg-brand-card border border-brand-border p-8 shadow-sm">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center divide-y sm:divide-y-0 sm:divide-x divide-brand-border">
              <div className="pt-0">
                <span className="block text-4xl font-bold text-primary">12+</span>
                <span className="mt-2 block text-sm font-semibold text-brand-muted uppercase tracking-wider">Top Engineering Institutions</span>
              </div>
              <div className="pt-6 sm:pt-0">
                <span className="block text-4xl font-bold text-accent">98.4%</span>
                <span className="mt-2 block text-sm font-semibold text-brand-muted uppercase tracking-wider">Prediction Accuracy</span>
              </div>
              <div className="pt-6 sm:pt-0">
                <span className="block text-4xl font-bold text-secondary">3+ Years</span>
                <span className="mt-2 block text-sm font-semibold text-brand-muted uppercase tracking-wider">Historical Cutoff Trends</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FEATURE CARDS GRID */}
        <div className="py-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-brand-heading">
              Powerful Tools for Your Academic Journey
            </h2>
            <p className="mt-4 text-brand-body text-base">
              Take control of your CAP Rounds and engineering applications with tools designed to remove ambiguity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveTab(feature.tab)}
                  className="group cursor-pointer rounded-2xl border border-brand-border bg-brand-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`inline-flex rounded-xl p-3 ${feature.color} mb-5`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-heading group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm text-brand-body leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center space-x-1.5 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Explore tool</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. HOW IT WORKS */}
        <div className="py-12 border-t border-brand-border animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-brand-heading">
                How CollegeMate Predicts Admissions
              </h2>
              <p className="mt-4 text-brand-body leading-relaxed text-base">
                The recommendation engine calculates the delta between your score and the historical cutoff trends of individual college-branch-category pairs.
              </p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-brand-heading">Safe Recommendation (80% - 95%)</h4>
                    <p className="text-sm text-brand-body">Your score exceeds the cutoff score by +2.0 or more. You have a very high chance of securing admission here.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-brand-heading">Moderate Recommendation (50% - 80%)</h4>
                    <p className="text-sm text-brand-body">Your score is highly competitive and is within 1.5 percentile points above or below the cutoff score.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-brand-heading">Dream Recommendation (20% - 50%)</h4>
                    <p className="text-sm text-brand-body">Your score is slightly below the cutoff by up to 4.0 percentile points. High reward option to target in Cap rounds.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-card border border-brand-border p-6 shadow-md">
              <h3 className="text-lg font-bold text-brand-heading mb-4">Sample Prediction Output</h3>
              <div className="space-y-4">
                <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-heading text-sm sm:text-base">COEP Technological University</span>
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">Safe (92%)</span>
                  </div>
                  <div className="mt-2 text-xs text-brand-body">
                    Branch: Computer Engineering | Cutoff: 99.85 | Difference: +0.12 (with OBC category)
                  </div>
                </div>

                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-heading text-sm sm:text-base">PICT Pune</span>
                    <span className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-bold text-warning">Moderate (68%)</span>
                  </div>
                  <div className="mt-2 text-xs text-brand-body">
                    Branch: Computer Engineering | Cutoff: 99.45 | Difference: -0.10
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-heading text-sm sm:text-base">VJTI Mumbai</span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">Dream (45%)</span>
                  </div>
                  <div className="mt-2 text-xs text-brand-body">
                    Branch: Computer Engineering | Cutoff: 99.91 | Difference: -0.56
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
