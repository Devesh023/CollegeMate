import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService, supabase } from '../services/dbService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const mapProfile = (userProfile, savedColleges = []) => {
    if (!userProfile) return null;
    return {
      name: userProfile.full_name || userProfile.name || '',
      admissionType: userProfile.admission_type || userProfile.admissionType || null,
      score: (userProfile.score !== undefined && userProfile.score !== null) ? parseFloat(userProfile.score) : null,
      category: userProfile.category || null,
      gender: userProfile.gender || null,
      homeUniversity: userProfile.home_university || userProfile.homeUniversity || null,
      branchPreference: userProfile.branch_preference || userProfile.branchPreference || null,
      savedColleges: savedColleges
    };
  };

  const ensureUserProfile = async (session) => {
    if (!session || !supabase) return null;
    try {
      let userProfile = await dbService.getProfile(session.user.id);
      if (!userProfile) {
        const defaultProfile = {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          email: session.user.email
        };
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert([defaultProfile])
          .select();
        if (error) {
          console.error("Error inserting default profile:", error);
        }
        if (newProfile && newProfile.length > 0) {
          userProfile = newProfile[0];
        } else {
          // fetch again as a fallback
          userProfile = await dbService.getProfile(session.user.id);
        }
      }
      return userProfile;
    } catch (e) {
      console.error("Failed to ensure user profile:", e);
      return null;
    }
  };

  // Initialize Auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Check if admin is authenticated locally first
        const adminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
        if (adminAuthenticated) {
          const adminEmail = localStorage.getItem('adminEmail');
          const adminRole = localStorage.getItem('adminRole') || 'admin';
          const loggedInUser = localStorage.getItem('collegemate_logged_in');
          const parsedUser = loggedInUser ? JSON.parse(loggedInUser) : null;
          
          setUser({
            id: parsedUser?.id || 'admin-id',
            email: adminEmail,
            role: adminRole,
            profile: parsedUser?.profile || {
              name: parsedUser?.profile?.name || 'Administrator',
              role: adminRole
            }
          });
        }

        if (supabase) {
          // Session initialization measurement
          console.time("Session Init");
          const { data: { session } } = await supabase.auth.getSession();
          console.timeEnd("Session Init");

          if (session && !adminAuthenticated) {
            // Render dashboard shell immediately by setting basic user info
            // and clearing the auth loading state. Profile load runs in the background.
            setUser({
              id: session.user.id,
              email: session.user.email,
              role: 'student',
              profile: { name: session.user.email.split('@')[0], savedColleges: [] }
            });
            setLoading(false);

            // User profile fetch measurement
            console.time("Profile Fetch");
            Promise.all([
              ensureUserProfile(session),
              dbService.getSavedCollegeIds(session.user.id)
            ]).then(([userProfile, savedColleges]) => {
              console.timeEnd("Profile Fetch");
              setUser({
                id: session.user.id,
                email: session.user.email,
                role: userProfile?.role || 'student',
                profile: mapProfile(userProfile, savedColleges) || { name: session.user.email.split('@')[0], savedColleges: [] }
              });
            }).catch(err => {
              console.error("Failed background profile fetch", err);
              console.timeEnd("Profile Fetch");
            });
          } else {
            setLoading(false);
          }
          
          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
              // Real Supabase session active (student). Clear local admin flags.
              localStorage.removeItem('adminAuthenticated');
              localStorage.removeItem('adminEmail');
              localStorage.removeItem('adminRole');
              
              // Pre-set basic user details so user is immediately logged in
              // and the dashboard/routing is not blocked.
              setUser(prev => {
                if (prev && prev.id === session.user.id && prev.profile && !prev.profile.isPlaceholder) {
                  return prev;
                }
                return {
                  id: session.user.id,
                  email: session.user.email,
                  role: 'student',
                  profile: { name: session.user.email.split('@')[0], savedColleges: [], isPlaceholder: true }
                };
              });

              // Load profile and saved colleges concurrently in background
              console.time("Profile Fetch");
              Promise.all([
                ensureUserProfile(session),
                dbService.getSavedCollegeIds(session.user.id)
              ]).then(([userProfile, savedColleges]) => {
                console.timeEnd("Profile Fetch");
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  role: userProfile?.role || 'student',
                  profile: mapProfile(userProfile, savedColleges) || { name: session.user.email.split('@')[0], savedColleges: [] }
                });
              }).catch(err => {
                console.error("Failed to load user profile on auth change:", err);
                console.timeEnd("Profile Fetch");
              });
            } else {
              // Only nullify if not admin authenticated
              const isStillAdmin = localStorage.getItem('adminAuthenticated') === 'true';
              if (!isStillAdmin) {
                setUser(null);
              }
            }
          });

          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // LocalStorage Mock mode
          if (!adminAuthenticated) {
            const loggedInUser = localStorage.getItem('collegemate_logged_in');
            if (loggedInUser) {
              const parsedUser = JSON.parse(loggedInUser);
              // Fetch only matching profile instead of all profiles
              const latestProfile = await dbService.getProfile(parsedUser.id);
              
              setUser({
                id: parsedUser.id,
                email: parsedUser.email,
                role: parsedUser.role,
                profile: mapProfile(latestProfile) || parsedUser.profile
              });
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // SHA-256 helper for admin password verification
  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const adminLogin = async (email, password) => {
    setAuthError(null);
    try {
      let admin;
      try {
        admin = await dbService.getAdminUser(email);
      } catch (dbErr) {
        console.error('Database query error:', dbErr);
        throw dbErr; // Propagate the actual Supabase/database error
      }

      if (!admin) {
        throw new Error('Admin account not found');
      }

      // Check if stored password is a SHA-256 hash (64 hex characters)
      const isStoredSha256 = /^[a-f0-9]{64}$/i.test(admin.password_hash);
      const enteredValueToCompare = isStoredSha256 ? await sha256(password) : password;
      const isMatch = (enteredValueToCompare === admin.password_hash);

      console.log('Stored Password:', admin.password_hash);
      console.log('Entered Password:', enteredValueToCompare);
      console.log('Password Match Result:', isMatch);

      if (!isMatch) {
        throw new Error('Invalid password');
      }

      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminEmail', admin.email);
      localStorage.setItem('adminRole', 'admin');

      const sessionUser = {
        id: admin.id || 'admin-id',
        email: admin.email,
        role: 'admin',
        profile: {
          name: admin.full_name || 'Administrator',
          role: 'admin'
        }
      };

      localStorage.setItem('collegemate_logged_in', JSON.stringify(sessionUser));
      setUser(sessionUser);

      // Redirect immediately to /admin
      window.history.pushState(null, '', '/admin');
      window.dispatchEvent(new PopStateEvent('popstate'));

      return true;
    } catch (err) {
      setAuthError(err.message || 'Admin login failed');
      throw err;
    }
  };

  const login = async (email, password) => {
    setAuthError(null);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Profile is handled via auth state listener
        return true;
      } else {
        // LocalStorage mock
        const users = JSON.parse(localStorage.getItem('collegemate_users') || '[]');
        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (matchedUser) {
          const sessionUser = {
            id: matchedUser.id,
            email: matchedUser.email,
            role: matchedUser.role,
            profile: matchedUser.profile
          };
          localStorage.setItem('collegemate_logged_in', JSON.stringify(sessionUser));
          setUser(sessionUser);
          return true;
        } else {
          throw new Error('Invalid email or password');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (email, password, profileData) => {
    setAuthError(null);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: profileData.name
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          // Update profile in profiles table (as trigger auto-created the default record)
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({
              full_name: profileData.name
            })
            .eq('id', data.user.id);
          if (profileErr) throw profileErr;
        }
        return true;
      } else {
        // LocalStorage mock signup
        const users = JSON.parse(localStorage.getItem('collegemate_users') || '[]');
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('Email already registered');
        }

        const newUser = {
          id: `user-${Date.now()}`,
          email: email.toLowerCase(),
          password: password,
          role: 'student',
          profile: {
            name: profileData.name,
            admissionType: null,
            score: null,
            category: null,
            gender: null,
            homeUniversity: null,
            branchPreference: null,
            savedColleges: []
          }
        };

        users.push(newUser);
        localStorage.setItem('collegemate_users', JSON.stringify(users));

        const sessionUser = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          profile: newUser.profile
        };
        localStorage.setItem('collegemate_logged_in', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return true;
      }
    } catch (err) {
      setAuthError(err.message || 'Signup failed');
      throw err;
    }
  };



  const logout = async () => {
    try {
      // Clear admin session info
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('collegemate_logged_in');

      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setUser(null);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const updatedProfile = await dbService.updateProfile(user.id, updates);
      
      const newUserState = {
        ...user,
        profile: {
          ...user.profile,
          ...updates
        }
      };

      if (!supabase) {
        localStorage.setItem('collegemate_logged_in', JSON.stringify(newUserState));
      }

      setUser(newUserState);
      return updatedProfile;
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    }
  };

  const toggleSavedCollege = async (collegeId) => {
    if (!user) return;
    try {
      const isSaved = await dbService.toggleSavedCollege(user.id, collegeId);
      
      let savedColleges = [...(user.profile.savedColleges || [])];
      if (isSaved) {
        if (!savedColleges.includes(collegeId)) {
          savedColleges.push(collegeId);
        }
      } else {
        savedColleges = savedColleges.filter(id => id !== collegeId);
      }

      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          savedColleges
        }
      };

      if (!supabase) {
        localStorage.setItem('collegemate_logged_in', JSON.stringify(updatedUser));
      }

      setUser(updatedUser);
      return isSaved;
    } catch (err) {
      console.error('Failed to toggle saved college', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    authError,
    login,
    adminLogin,
    signup,

    logout,
    updateProfile,
    toggleSavedCollege
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
