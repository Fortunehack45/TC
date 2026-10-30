import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Sync mode whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      resetFormState();
    }
  }, [isOpen, defaultMode]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  // Password validation helpers
  const isPasswordLongEnough = password.length >= 6;
  const hasLetterAndNumber = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      // 1. FORGOT PASSWORD MODE
      if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address to receive reset instructions.');
          setLoading(false);
          return;
        }

        const res = await resetPassword(email.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(
            `A secure password recovery dispatch has been transmitted to ${email.trim()}. Please review your inbox (and spam folder) to set a new password.`
          );
        }
        setLoading(false);
        return;
      }

      // 2. RESET PASSWORD (NEW PASSWORD) MODE
      if (mode === 'reset') {
        if (!newPassword) {
          setErrorMsg('Please enter your new password.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setErrorMsg('Password must be at least 6 characters in length.');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await updatePassword(newPassword);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Your password has been securely updated. You may now sign in.');
          setTimeout(() => {
            setMode('signin');
            resetFormState();
          }, 1400);
        }
        setLoading(false);
        return;
      }

      // 3. COMMON VALIDATION FOR SIGNIN & SIGNUP
      if (!email.trim() || !password) {
        setErrorMsg('Please provide both your registered email and password.');
        setLoading(false);
        return;
      }

      // 4. SIGN UP MODE
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name or editorial byline.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Password must contain at least 6 characters.');
          setLoading(false);
          return;
        }

        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Account created successfully! Welcome to The Chronicles subscriber circle.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
        setLoading(false);
        return;
      }

      // 5. SIGN IN MODE
      if (mode === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Authentication confirmed. Welcome back to The Chronicles.');
          setTimeout(() => {
            onClose();
          }, 600);
        }
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#161616] border border-[#2E2E2E] rounded-none shadow-2xl p-6 sm:p-8 relative text-stone-200 font-sans-body"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white transition-colors"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Masthead Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-[#E50914] text-white font-masthead font-black text-xs tracking-widest px-2.5 py-1 mb-2">
            THE CHRONICLES
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'signin' && 'Subscriber Sign In'}
            {mode === 'signup' && 'Create Reader Account'}
            {mode === 'forgot' && 'Reset Account Password'}
            {mode === 'reset' && 'Set New Password'}
          </h2>
          <p className="font-mono-meta text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            {mode === 'signin' &&
              'Access unmetered global dispatches, personal bookmarks, and live news comments.'}
            {mode === 'signup' &&
              'Join thousands of readers across 140 countries with full access to The Chronicles.'}
            {mode === 'forgot' &&
              'Enter your registered email address and we will dispatch a secure reset link.'}
            {mode === 'reset' &&
              'Choose a new secure password for your Chronicles subscriber account.'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only shown for Sign In & Register) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="flex border-b border-[#282828] mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`flex-1 py-2.5 font-mono-meta text-xs font-bold tracking-wider transition-colors border-b-2 ${
                mode === 'signin'
                  ? 'border-[#E50914] text-white'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`flex-1 py-2.5 font-mono-meta text-xs font-bold tracking-wider transition-colors border-b-2 ${
                mode === 'signup'
                  ? 'border-[#E50914] text-white'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              REGISTER
            </button>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FULL NAME (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
                Full Name / Pen Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Julian Vance"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-3 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
                />
              </div>
            </div>
          )}

          {/* EMAIL ADDRESS (Signin, Signup, and Forgot) */}
          {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="reader@thechronicles.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-3 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
                />
              </div>
            </div>
          )}

          {/* PASSWORD INPUT (Signin and Signup) */}
          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider">
                  Password
                </label>
              </div>

              {/* Password Input with Eye Visibility Toggle Button */}
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-11 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
                />

                {/* Eye Icon to Toggle Password Visibility (See / Unsee) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-white focus:outline-none transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#E50914]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* UNDER PASSWORD HELPER & ACTIONS */}
              <div className="mt-2 text-xs font-mono-meta flex items-center justify-between gap-2">
                {mode === 'signin' ? (
                  <>
                    <span className="text-[11px] text-stone-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                      Encrypted connection
                    </span>
                    {/* Forgot Password Trigger */}
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="text-[11px] text-[#E50914] hover:text-red-400 hover:underline font-bold transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </>
                ) : (
                  /* Signup Password Requirement Indicator Under Password */
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`flex items-center gap-1 ${
                          isPasswordLongEnough ? 'text-emerald-400 font-bold' : 'text-stone-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPasswordLongEnough ? 'bg-emerald-400' : 'bg-stone-600'
                          }`}
                        />
                        At least 6 characters
                      </span>

                      {password.length > 0 && (
                        <span
                          className={`text-[10px] font-bold ${
                            password.length >= 10
                              ? 'text-emerald-400'
                              : password.length >= 6
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {password.length >= 10 ? 'STRONG' : password.length >= 6 ? 'GOOD' : 'TOO SHORT'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NEW PASSWORD & CONFIRM PASSWORD (Reset Mode) */}
          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-11 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-white focus:outline-none transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-[#E50914]" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-11 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-white focus:outline-none transition-colors cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-[#E50914]" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Under Confirm Password Matching Helper */}
                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-1.5 text-[11px] font-mono-meta ${
                      newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </p>
                )}
              </div>
            </>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#E50914] hover:bg-[#C40711] text-white py-3 px-4 font-mono-meta text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? (
              <span className="animate-pulse">DISPATCHING REQUEST...</span>
            ) : (
              <>
                {mode === 'signin' && 'ENTER THE CHRONICLES'}
                {mode === 'signup' && 'ACTIVATE SUBSCRIPTION'}
                {mode === 'forgot' && 'DISPATCH RESET LINK'}
                {mode === 'reset' && 'SAVE NEW PASSWORD'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* BOTTOM ALTERNATE NAVIGATION LINKS */}
        <div className="mt-6 pt-4 border-t border-[#222222] text-center font-mono-meta text-xs text-stone-400">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className="inline-flex items-center gap-1.5 text-stone-300 hover:text-white font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E50914]" />
              <span>RETURN TO SIGN IN</span>
            </button>
          ) : mode === 'signin' ? (
            <p>
              New to The Chronicles?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-[#E50914] hover:underline font-bold transition-colors ml-1 cursor-pointer"
              >
                Create reader account →
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-[#E50914] hover:underline font-bold transition-colors ml-1 cursor-pointer"
              >
                Subscriber Sign In →
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
