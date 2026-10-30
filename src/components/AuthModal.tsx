import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setErrorMsg('Please enter your full name or pen name.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Welcome back to The Chronicles.');
          setTimeout(() => {
            onClose();
          }, 600);
        }
      } else {
        const res = await signUp(email, password, displayName);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Account created successfully! You are now signed in.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#161616] border border-[#2E2E2E] rounded-none shadow-2xl p-6 sm:p-8 relative text-stone-200 font-sans-body"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Masthead Header */}
        <div className="text-center mb-6">
          <div className="inline-block bg-[#E50914] text-white font-masthead font-black text-xs tracking-widest px-2.5 py-1 mb-2">
            THE CHRONICLES
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'signin' ? 'Subscriber Sign In' : 'Create Reader Account'}
          </h2>
          <p className="font-mono-meta text-xs text-stone-400 mt-1">
            Access unlimited dispatches, personal bookmarks, and editorial debates
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#282828] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
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
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 font-mono-meta text-xs font-bold tracking-wider transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
                Full Name / Pen Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
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

          <div>
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="email"
                required
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-3 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 pl-10 pr-3 py-2.5 text-sm focus:border-[#E50914] focus:outline-none font-sans-body placeholder:text-stone-600 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#E50914] hover:bg-[#C40711] text-white py-3 px-4 font-mono-meta text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">PROCESSING...</span>
            ) : (
              <>
                {mode === 'signin' ? 'ENTER THE CHRONICLES' : 'REGISTER SUBSCRIPTION'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
