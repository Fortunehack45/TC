import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { submitReport } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CustomDropdown } from './CustomDropdown';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'article' | 'comment' | 'reply';
  itemId: string;
  itemTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('Misinformation');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reasons = [
    'Misinformation or False Statements',
    'Harassment, Hate Speech or Threats',
    'Spam, Advertising or Bots',
    'Copyright Infringement',
    'Defamation or Personal Libel',
    'Inappropriate or Graphic Content',
    'Other Editorial Violation',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await submitReport(user?.id || null, itemType, itemId, reason, details);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit editorial report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#161616] border border-[#2E2E2E] shadow-2xl p-6 relative text-stone-200 font-sans-body"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-[#E50914]">
          <Flag className="w-5 h-5" />
          <span className="font-mono-meta text-xs font-bold uppercase tracking-widest">
            EDITORIAL INTEGRITY DISPATCH
          </span>
        </div>

        <h3 className="font-editorial text-xl font-bold text-white mb-1">
          Report {itemType === 'article' ? 'Dispatch' : itemType === 'reply' ? 'Reply' : 'Comment'}
        </h3>
        {itemTitle && (
          <p className="font-mono-meta text-xs text-stone-400 mb-4 line-clamp-1 border-l-2 border-[#E50914] pl-2">
            Target: &ldquo;{itemTitle}&rdquo;
          </p>
        )}

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-editorial text-lg text-white font-semibold">Report Received</h4>
            <p className="text-xs font-mono-meta text-stone-400">
              Our editorial compliance team will review this report against our standards.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <CustomDropdown
                label="Primary Reason for Report"
                value={reason}
                onChange={setReason}
                options={reasons}
                className="w-full"
                buttonClassName="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2">
                Context & Additional Observations (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe why this violates editorial standards..."
                className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 p-3 text-sm focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-mono-meta text-xs uppercase tracking-wider text-stone-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#E50914] hover:bg-[#C40711] text-white px-5 py-2 font-mono-meta text-xs uppercase font-bold tracking-widest transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
