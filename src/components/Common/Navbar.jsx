import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Search, 
  GitCompare, 
  MessageSquare, 
  Settings, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  User, 
  Menu, 
  X,
  ChevronDown,
  Bookmark
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, darkMode, setDarkMode }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Extract first name and format it
  const firstName = user?.profile?.name 
    ? user.profile.name.trim().split(' ')[0] 
    : (user?.email ? user.email.split('@')[0] : 'User');
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Before login: Home, College Predictor, Search Colleges, Compare, Admin Portal
  const beforeLoginLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'predictor', label: 'College Predictor' },
    { id: 'search', label: 'Search Colleges' },
    { id: 'branches', label: 'Branch Explorer' },
    { id: 'rankings', label: 'Top Rankings' },
    { id: 'compare', label: 'Compare' },
    { id: 'admin-login', label: 'Admin Portal' }
  ];

  // After login: Predictor, Search, Compare
  const afterLoginLinks = [
    { id: 'predictor', label: 'Predictor' },
    { id: 'search', label: 'Search' },
    { id: 'branches', label: 'Branch Explorer' },
    { id: 'rankings', label: 'Top Rankings' },
    { id: 'compare', label: 'Compare' }
  ];

  // Mobile menu items (Task 5)
  const mobileLinks = [
    { id: 'predictor', label: 'College Predictor' },
    { id: 'search', label: 'Search Colleges' },
    { id: 'branches', label: 'Branch Explorer' },
    { id: 'rankings', label: 'Top Rankings' },
    { id: 'compare', label: 'Compare' },
    { id: 'admin-login', label: 'Admin Portal' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border bg-brand-card/85 backdrop-blur-md transition-colors duration-200">
      {/* Center aligned content with max-width 1280px */}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
        
        {/* LOGO */}
        <div 
          onClick={() => handleTabClick('landing')} 
          className="flex cursor-pointer items-center space-x-2.5 hover:opacity-90 shrink-0"
        >
          <img src="/src/assets/logocm.png" alt="CollegeMate Logo" className="h-9 w-auto object-contain shrink-0" />
          <span className="text-xl font-bold tracking-tight text-brand-heading">
            College<span className="text-primary">Mate</span>
          </span>
        </div>

        {/* DESKTOP NAV LINKS - gap: 32px (lg:flex, hidden under 1024px) */}
        <nav 
          className="hidden lg:flex items-center" 
          style={{ gap: '32px' }}
        >
          {user ? (
            // After Login Navigation
            afterLoginLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-brand-body hover:text-brand-heading'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          ) : (
            // Before Login Navigation
            beforeLoginLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-brand-body hover:text-brand-heading'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </nav>

        {/* CONTROLS (Theme Toggle, Auth Button, Profile Dropdown) - gap: 32px */}
        <div 
          className="hidden lg:flex items-center shrink-0" 
          style={{ gap: '32px' }}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="rounded-xl p-2 text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer select-none"
            title="Toggle Theme"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-primary" />
            ) : (
              <Moon className="h-5 w-5 text-brand-body" />
            )}
          </button>

          {user ? (
            /* Profile Dropdown container */
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 rounded-xl py-1.5 px-2.5 text-sm font-semibold text-brand-heading hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
              >
                {/* Profile Avatar / Student Name */}
                <span className="text-base select-none mr-0.5">👤</span>
                <span className="max-w-[120px] truncate text-brand-heading font-semibold">
                  {formattedName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-brand-muted shrink-0" />
              </button>

              {/* Glassmorphic Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setProfileDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-brand-border bg-brand-card/95 backdrop-blur-xl p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleTabClick(user.role === 'admin' ? 'admin' : 'dashboard');
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="h-4.5 w-4.5 text-brand-muted" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleTabClick('profile');
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
                    >
                      <User className="h-4.5 w-4.5 text-brand-muted" />
                      <span>Profile</span>
                    </button>
                    {user.role === 'student' && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleTabClick('dashboard');
                          setTimeout(() => {
                            const el = document.getElementById('saved-colleges-section');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 150);
                        }}
                        className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
                      >
                        <Bookmark className="h-4.5 w-4.5 text-brand-muted" />
                        <span>Saved Colleges</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleTabClick('profile');
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
                    >
                      <Settings className="h-4.5 w-4.5 text-brand-muted" />
                      <span>Settings</span>
                    </button>
                    
                    <div className="my-1.5 border-t border-brand-border" />
                    
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                        handleTabClick('landing');
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-error hover:bg-error/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4.5 w-4.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleTabClick('auth')}
              className="flex items-center space-x-1.5 rounded-xl bg-primary px-4.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* MOBILE CONTROLS (lg:hidden, visible below 1024px) */}
        <div className="flex items-center space-x-2 lg:hidden shrink-0">
          <button
            onClick={toggleDarkMode}
            className="rounded-xl p-2 text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-brand-body hover:bg-brand-bg hover:text-brand-heading transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-brand-heading" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER (lg:hidden) */}
      {mobileMenuOpen && (
        <div className="border-t border-brand-border bg-brand-card px-3 pt-2 pb-5 lg:hidden animate-in fade-in duration-200">
          <div className="space-y-1">
            {/* Standard Mobile Links: College Predictor, Search Colleges, Compare, AI Counsellor, Admin Portal */}
            {mobileLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-base font-semibold transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-brand-body hover:bg-brand-bg hover:text-brand-heading'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {/* If user logged in, append dashboard options */}
            {user ? (
              <div className="border-t border-brand-border mt-3 pt-3 space-y-1">
                <div className="px-4 py-1.5 text-xs font-bold text-brand-muted uppercase tracking-wider">
                  Logged in as {formattedName}
                </div>
                <button
                  onClick={() => handleTabClick(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-base font-semibold text-brand-body hover:bg-brand-bg hover:text-brand-heading cursor-pointer`}
                >
                  <LayoutDashboard className="h-5 w-5 text-brand-muted" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleTabClick('profile')}
                  className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-base font-semibold text-brand-body hover:bg-brand-bg hover:text-brand-heading cursor-pointer`}
                >
                  <User className="h-5 w-5 text-brand-muted" />
                  <span>Profile Settings</span>
                </button>
                {user.role === 'student' && (
                  <button
                    onClick={() => {
                      handleTabClick('dashboard');
                      setTimeout(() => {
                        const el = document.getElementById('saved-colleges-section');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 150);
                    }}
                    className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-base font-semibold text-brand-body hover:bg-brand-bg hover:text-brand-heading cursor-pointer`}
                  >
                    <Bookmark className="h-5 w-5 text-brand-muted" />
                    <span>Saved Colleges</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    logout();
                    handleTabClick('landing');
                  }}
                  className="flex w-full items-center justify-center space-x-2.5 rounded-xl border border-error/20 bg-error/5 py-3 text-base font-bold text-error hover:bg-error/10 transition-colors mt-4 cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-brand-border mt-3 pt-4">
                <button
                  onClick={() => handleTabClick('auth')}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary py-3 text-base font-bold text-white hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
