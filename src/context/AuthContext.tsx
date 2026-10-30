import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getProfile, upsertProfile } from '../lib/supabase';
import { Profile } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isDevAdminOverride: boolean;
  toggleDevAdmin: () => void;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfileName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dev admin toggle for convenient local testing
  const [isDevAdminOverride, setIsDevAdminOverride] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tc_dev_admin_override') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDevAdmin = () => {
    setIsDevAdminOverride((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tc_dev_admin_override', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const loadUserProfile = async (userId: string, userEmail?: string | null) => {
    try {
      let prof = await getProfile(userId);
      if (!prof) {
        // Auto-create profile
        const isMasterAdmin = userEmail?.toLowerCase() === 'fortunedomination@gmail.com';
        prof = await upsertProfile({
          id: userId,
          email: userEmail || null,
          display_name: userEmail?.split('@')[0] || 'Chronicles Reader',
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${userEmail || 'Reader'}&backgroundColor=e50914`,
          role: isMasterAdmin ? 'admin' : 'user',
        });
      }
      setProfile(prof);
    } catch (err) {
      console.warn('Could not load profile:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id, data.user.email);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  };

  const signUp = async (email: string, pass: string, displayName: string): Promise<{ error?: string }> => {
    try {
      const isMasterAdmin = email.toLowerCase() === 'fortunedomination@gmail.com';
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        setUser(data.user);
        // Create initial profile in tc_profiles
        const prof = await upsertProfile({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName || email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || email}&backgroundColor=e50914`,
          role: isMasterAdmin ? 'admin' : 'user',
        });
        setProfile(prof);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfileName = async (displayName: string) => {
    if (!user) return;
    const updated = await upsertProfile({
      id: user.id,
      display_name: displayName,
    });
    setProfile(updated);
  };

  // Determine admin access: role === 'admin' OR master email OR dev admin override
  const isAdmin =
    isDevAdminOverride ||
    profile?.role === 'admin' ||
    user?.email?.toLowerCase() === 'fortunedomination@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        isDevAdminOverride,
        toggleDevAdmin,
        signIn,
        signUp,
        signOut,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
