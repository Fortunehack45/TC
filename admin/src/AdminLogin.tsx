import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabase';

const getAdminEmails = (): string[] => {
  const envAdmins = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (envAdmins) {
    return envAdmins.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return ['fortunedomination@gmail.com', 'progressomemi@gmail.com'];
};

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'setup_request' | 'setup_verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Setup / OTP States
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cleanEmail = email.trim().toLowerCase();

  const isEmailAuthorized = (targetEmail: string) => {
    return getAdminEmails().includes(targetEmail.toLowerCase());
  };

  // 1. Sign In with Email & Password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!cleanEmail) {
      setErrorMessage('Please enter your administrative email address.');
      return;
    }

    if (!isEmailAuthorized(cleanEmail)) {
      setErrorMessage('Access Denied: Only accredited editorial administrators can access this console.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Invalid password or password not yet configured. Click "Set up password with verification code" below.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.user) {
        onLoginSuccess(data.user.email || cleanEmail);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP Code for Password Setup
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!cleanEmail) {
      setErrorMessage('Please enter your administrative email.');
      return;
    }

    if (!isEmailAuthorized(cleanEmail)) {
      setErrorMessage('Access Denied: Only accredited editorial administrators can set up credentials.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setErrorMessage(`Failed to send verification code: ${error.message}`);
        return;
      }

      setSuccessMessage(`A 6-digit verification code has been dispatched to ${cleanEmail}. Please inspect your inbox.`);
      setMode('setup_verify');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP Code and Set New Password
  const handleVerifyOtpAndSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const code = otpToken.trim();
    if (!code || code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      // Step A: Verify the OTP token
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: 'email',
      });

      if (verifyError) {
        setErrorMessage(`Invalid or expired verification code: ${verifyError.message}`);
        return;
      }

      // Step B: Set the permanent password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setErrorMessage(`Failed to set password: ${updateError.message}`);
        return;
      }

      setSuccessMessage('Password successfully configured! Authenticating into console...');
      setTimeout(() => {
        onLoginSuccess(verifyData.user?.email || cleanEmail);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification and password setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-stone-200 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#E50914] selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1112] via-[#0E0E0E] to-[#0A0A0A]" />

      <div className="relative z-10 w-full max-w-md bg-[#161616] border border-[#262626] shadow-2xl p-6 sm:p-8 rounded-xs">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/logo.png"
              alt="The Chronicles"
              className="h-9 w-auto object-contain rounded-xs shadow"
            />
          </div>
          <span className="font-mono-meta text-[10px] uppercase font-bold tracking-widest text-[#E50914] flex items-center gap-1.5 bg-[#E50914]/10 border border-[#E50914]/30 px-2.5 py-0.5 rounded-xs mb-2">
            <ShieldAlert className="w-3 h-3 text-[#E50914]" />
            RESTRICTED EDITORIAL ACCESS
          </span>
          <h1 className="font-editorial text-2xl font-bold text-white tracking-tight">
            The Chronicles Console
          </h1>
          <p className="font-mono-meta text-xs text-stone-400 mt-1">
            Editorial Administration & Content Governance Hub
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xs flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xs flex items-start gap-2.5 text-xs text-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* MODE 1: Standard Password Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thechronicles.press"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 text-sm font-sans-body transition-colors rounded-xs"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('setup_request');
                  }}
                  className="font-mono-meta text-[11px] text-[#E50914] hover:underline cursor-pointer"
                >
                  Set up or reset password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 pr-10 text-sm font-sans-body transition-colors rounded-xs"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 text-white font-mono-meta text-xs uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xs"
            >
              {loading ? (
                <>Authenticating...</>
              ) : (
                <>
                  Enter Editorial Console <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-[#222222] text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('setup_request');
                }}
                className="font-mono-meta text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                First time administrator?{' '}
                <span className="text-[#E50914] font-bold">Request email verification code</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Request Setup Code */}
        {mode === 'setup_request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="p-3 bg-[#111111] border border-[#252525] rounded-xs mb-3 text-xs text-stone-400 leading-relaxed">
              Enter your authorized admin email. Supabase will send a secure 6-digit single-use code to your inbox to configure your password.
            </div>

            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                Authorized Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thechronicles.press"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 text-sm font-sans-body transition-colors rounded-xs"
                />
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 text-white font-mono-meta text-xs uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xs"
            >
              {loading ? 'Dispatching Code...' : 'Send Verification Code'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('signin');
                }}
                className="font-mono-meta text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Password Sign In
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: Enter Code & Choose New Password */}
        {mode === 'setup_verify' && (
          <form onSubmit={handleVerifyOtpAndSetPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="font-mono-meta text-[11px] text-[#E50914] hover:underline cursor-pointer"
                >
                  Resend code?
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 text-center tracking-widest font-mono text-base transition-colors rounded-xs"
                />
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                New Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose strong password"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 pr-10 text-sm font-sans-body transition-colors rounded-xs"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono-meta text-xs uppercase tracking-wider text-stone-300 font-bold mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full bg-[#111111] border border-[#303030] focus:border-[#E50914] focus:outline-none text-white px-3.5 py-2.5 pl-10 text-sm font-sans-body transition-colors rounded-xs"
                />
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#B80710] disabled:opacity-50 text-white font-mono-meta text-xs uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg rounded-xs"
            >
              {loading ? 'Verifying & Saving...' : 'Verify Code & Set Password'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('signin');
                }}
                className="font-mono-meta text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Password Sign In
              </button>
            </div>
          </form>
        )}

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-[#202020] text-center text-[10px] font-mono-meta text-stone-500">
          Restricted Portal • Authorized Editorial Administration Only
        </div>
      </div>
    </div>
  );
};
