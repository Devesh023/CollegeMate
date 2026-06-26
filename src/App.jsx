import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
const Landing = React.lazy(() => import('./components/Common/Landing'));
const Dashboard = React.lazy(() => import('./components/Common/Dashboard'));
const CollegePredictor = React.lazy(() => import('./components/Predictor'));
const CollegeSearch = React.lazy(() => import('./components/Search'));
const CollegeComparison = React.lazy(() => import('./components/Comparison'));
const AdminPanel = React.lazy(() => import('./components/Admin'));
const AdminLogin = React.lazy(() => import('./components/Admin/AdminLogin'));
const Profile = React.lazy(() => import('./components/Common/Profile'));
const Auth = React.lazy(() => import('./components/Common/Auth'));
const AdminDebug = React.lazy(() => import('./components/Admin/AdminDebug'));
const CollegeDetails = React.lazy(() => import('./components/Search/CollegeDetails'));
const BranchExplorer = React.lazy(() => import('./components/Search/BranchExplorer'));
const TopRankings = React.lazy(() => import('./components/Search/TopRankings'));

const LoadingFallback = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center bg-transparent">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();
  
  // State to hold college code for detail routing
  const [selectedCollegeCode, setSelectedCollegeCode] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/college/')) {
      return path.split('/')[2];
    }
    return '';
  });

  // URL to State mapping on initial load
  const getTabFromPath = () => {
    const path = window.location.pathname;
    if (path === '/admin/debug') return 'admin-debug';
    if (path === '/admin/login') return 'admin-login';
    if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/predictor') return 'predictor';
    if (path === '/search') return 'search';
    if (path === '/branches') return 'branches';
    if (path === '/rankings') return 'rankings';
    if (path.startsWith('/college/')) return 'college-details';
    if (path === '/compare') return 'compare';
    if (path === '/profile') return 'profile';
    if (path === '/login') return 'auth';
    return 'landing';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [darkMode, setDarkMode] = useState(false);
  const [compareColleges, setCompareColleges] = useState([]);
  const [tabHistory, setTabHistory] = useState([getTabFromPath()]);
  const [authWarning, setAuthWarning] = useState('');

  // Handle popstate for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const target = getTabFromPath();
      handleSetActiveTab(target, true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Handle active session role changes and page redirects
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin/login') {
      if (user?.role === 'admin') {
        window.history.replaceState(null, '', '/admin');
        setActiveTab('admin');
      } else {
        setActiveTab('admin-login');
      }
    } else if (path === '/admin' || path.startsWith('/admin/')) {
      if (user?.role === 'admin') {
        setActiveTab('admin');
      } else {
        setAuthWarning('Admin access required.');
        window.history.replaceState(null, '', '/login');
        setActiveTab('auth');
      }
    } else if (['/dashboard', '/profile', '/predictor', '/compare'].includes(path)) {
      if (!user) {
        window.history.replaceState(null, '', '/');
        setActiveTab('landing');
      } else if (user.role === 'admin') {
        window.history.replaceState(null, '', '/admin');
        setActiveTab('admin');
      }
    } else if (path === '/login' || path === '/login/') {
      if (user) {
        if (user.role === 'admin') {
          window.history.replaceState(null, '', '/admin');
          setActiveTab('admin');
        } else {
          window.history.replaceState(null, '', '/dashboard');
          setActiveTab('dashboard');
        }
      }
    }
  }, [user, activeTab]);

  // Tab routing with route protection
  const handleSetActiveTab = (tab, bypassHistory = false) => {
    console.time(`RouteNavigation: ${tab}`);
    setAuthWarning('');

    const protectedTabs = ['dashboard', 'predictor', 'compare', 'profile'];
    
    // Admin Route Protection
    if (tab === 'admin') {
      if (user?.role !== 'admin') {
        setAuthWarning('Admin access required.');
        setActiveTab('auth');
        if (!bypassHistory) {
          window.history.pushState(null, '', '/login');
          setTabHistory(prev => [...prev, 'auth']);
        }
        console.timeEnd(`RouteNavigation: ${tab}`);
        return;
      }
      setActiveTab('admin');
      if (!bypassHistory) {
        const currentPath = window.location.pathname;
        const targetPath = (currentPath === '/admin' || currentPath.startsWith('/admin/')) ? currentPath : '/admin';
        window.history.pushState(null, '', targetPath);
        setTabHistory(prev => [...prev, 'admin']);
      }
      console.timeEnd(`RouteNavigation: ${tab}`);
      return;
    }

    if (tab === 'admin-login') {
      if (user?.role === 'admin') {
        setActiveTab('admin');
        if (!bypassHistory) {
          window.history.pushState(null, '', '/admin');
          setTabHistory(prev => [...prev, 'admin']);
        }
        console.timeEnd(`RouteNavigation: ${tab}`);
        return;
      }
      setActiveTab('admin-login');
      if (!bypassHistory) {
        window.history.pushState(null, '', '/admin/login');
        setTabHistory(prev => [...prev, 'admin-login']);
      }
      console.timeEnd(`RouteNavigation: ${tab}`);
      return;
    }

    if (tab === 'admin-debug') {
      setActiveTab('admin-debug');
      if (!bypassHistory) {
        window.history.pushState(null, '', '/admin/debug');
        setTabHistory(prev => [...prev, 'admin-debug']);
      }
      console.timeEnd(`RouteNavigation: ${tab}`);
      return;
    }

    if (!user && protectedTabs.includes(tab)) {
      setAuthWarning(tab === 'predictor' ? 'Login required to predict colleges.' : 'Please login to access College Predictions.');
      setActiveTab('auth');
      if (!bypassHistory) {
        window.history.pushState(null, '', '/login');
        setTabHistory(prev => [...prev, 'auth']);
      }
      console.timeEnd(`RouteNavigation: ${tab}`);
      return;
    }

    // Role verification: Student should not access admin pages
    if (tab === 'dashboard' && user?.role === 'admin') {
      setActiveTab('admin');
      if (!bypassHistory) {
        window.history.pushState(null, '', '/admin');
      }
      console.timeEnd(`RouteNavigation: ${tab}`);
      return;
    }

    setActiveTab(tab);
    if (!bypassHistory) {
      let path = '/';
      if (tab === 'dashboard') path = '/dashboard';
      else if (tab === 'predictor') path = '/predictor';
      else if (tab === 'search') path = '/search';
      else if (tab === 'branches') path = '/branches';
      else if (tab === 'rankings') path = '/rankings';
      else if (tab === 'compare') path = '/compare';
      else if (tab === 'profile') path = '/profile';
      else if (tab === 'auth') path = '/login';
      else if (tab === 'college-details') path = `/college/${selectedCollegeCode}`;
      window.history.pushState(null, '', path);
      setTabHistory(prev => [...prev, tab]);
    }
    console.timeEnd(`RouteNavigation: ${tab}`);
  };

  const handleGoBack = () => {
    if (tabHistory.length <= 1) {
      handleSetActiveTab('landing', true);
      return;
    }
    const newHistory = [...tabHistory];
    newHistory.pop(); // Remove current tab
    const prevTab = newHistory[newHistory.length - 1] || 'landing';
    setTabHistory(newHistory);
    handleSetActiveTab(prevTab, true);
  };

  const handleViewCollege = (code) => {
    setSelectedCollegeCode(code);
    setActiveTab('college-details');
    window.history.pushState(null, '', `/college/${code}`);
    setTabHistory(prev => [...prev, 'college-details']);
  };

  // Loading Screen Logo
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg transition-colors duration-200">
        <img src="/src/assets/logocm.png" alt="CollegeMate Logo" className="h-20 w-auto object-contain animate-pulse mb-6" />
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg transition-colors duration-200">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />
      
      <main className="flex-grow">
        <React.Suspense fallback={<LoadingFallback />}>
          {activeTab === 'landing' && <Landing setActiveTab={handleSetActiveTab} />}
          {activeTab === 'dashboard' && user && (
            <Dashboard setActiveTab={handleSetActiveTab} setCompareColleges={setCompareColleges} />
          )}
          {activeTab === 'predictor' && <CollegePredictor onBack={handleGoBack} />}
          {activeTab === 'search' && (
            <CollegeSearch 
              setCompareColleges={setCompareColleges} 
              setActiveTab={handleSetActiveTab} 
              onViewCollege={handleViewCollege}
            />
          )}
          {activeTab === 'branches' && (
            <BranchExplorer 
              onViewCollege={handleViewCollege} 
            />
          )}
          {activeTab === 'rankings' && (
            <TopRankings 
              onViewCollege={handleViewCollege} 
              onBack={handleGoBack}
              setCompareColleges={setCompareColleges}
              setActiveTab={handleSetActiveTab}
            />
          )}
          {activeTab === 'college-details' && (
            <CollegeDetails 
              collegeCode={selectedCollegeCode} 
              onBack={handleGoBack} 
            />
          )}
          {activeTab === 'compare' && (
            <CollegeComparison compareColleges={compareColleges} setCompareColleges={setCompareColleges} onBack={handleGoBack} />
          )}
          {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel onBack={handleGoBack} />}
          {activeTab === 'admin-login' && <AdminLogin onBack={() => handleSetActiveTab('landing')} />}
          {activeTab === 'admin-debug' && <AdminDebug onBack={() => handleSetActiveTab('admin-login')} />}
          {activeTab === 'profile' && user && <Profile onBack={handleGoBack} />}
          {activeTab === 'auth' && (
            <Auth 
              onAuthSuccess={handleSetActiveTab} 
              authWarning={authWarning} 
              setAuthWarning={setAuthWarning} 
            />
          )}
        </React.Suspense>
      </main>

      <Footer setActiveTab={handleSetActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
