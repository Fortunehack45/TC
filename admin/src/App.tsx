import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';

const ALLOWED_ADMIN_EMAILS = [
  'fortunedomination@gmail.com',
  'progressomemi@gmail.com',
];

export default function App() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          if (ALLOWED_ADMIN_EMAILS.includes(email)) {
            setAdminEmail(email);
          } else {
            // Unauthorized email logged in -> sign out immediately
            await supabase.auth.signOut();
            setAdminEmail(null);
          }
        } else {
          setAdminEmail(null);
        }
      } catch (err) {
        console.warn('Session verification error:', err);
        setAdminEmail(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          if (ALLOWED_ADMIN_EMAILS.includes(email)) {
            setAdminEmail(email);
          } else {
            await supabase.auth.signOut();
            setAdminEmail(null);
          }
        } else {
          setAdminEmail(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setAdminEmail(null);
  };

  // Editorial Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center text-stone-200">
        <img
          src="/logo.png"
          alt="The Chronicles"
          className="h-10 w-auto object-contain mb-4 animate-pulse"
        />
        <div className="font-mono-meta text-xs tracking-widest uppercase text-stone-400">
          Verifying Editorial Administrative Credentials...
        </div>
      </div>
    );
  }

  // If authenticated and authorized, show Dashboard
  if (adminEmail) {
    return (
      <AdminDashboard
        adminEmail={adminEmail}
        onSignOut={handleSignOut}
      />
    );
  }

  // Otherwise, require Admin Login
  return (
    <AdminLogin
      onLoginSuccess={(email) => setAdminEmail(email.toLowerCase())}
    />
  );
}
