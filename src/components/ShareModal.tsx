import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, ExternalLink, Globe } from 'lucide-react';
import { Article } from '../data/artData';
import { getPostPreviewImage } from '../lib/imageHelper';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: (Article & { content_html?: string; cover_image_url?: string; video_url?: string; tags?: string[] }) | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, article }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !article) return null;

  const origin =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://tc-dusky.vercel.app';
  const shareSlug = article.slug || article.id;
  const shareUrl = `${origin}/p/${encodeURIComponent(shareSlug)}`;
  const shareTitle = article.title;
  const shareText = article.excerpt || article.subtitle || `Read this dispatch on The Chronicles: ${shareTitle}`;
  const previewImage = getPostPreviewImage(article);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share Intent URLs
  const socialPlatforms = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      bgHover: 'hover:bg-[#25D366]/20',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.13.17 1.76 2.68 4.26 3.76.59.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`,
    },
    {
      name: 'X (Twitter)',
      color: '#FFFFFF',
      bgHover: 'hover:bg-white/10',
      icon: (
        <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}&hashtags=TheChronicles,${article.category}`,
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      bgHover: 'hover:bg-[#1877F2]/20',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      bgHover: 'hover:bg-[#0A66C2]/20',
      icon: (
        <svg className="w-4 h-4 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.222 0h.003z" />
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      color: '#229ED9',
      bgHover: 'hover:bg-[#229ED9]/20',
      icon: (
        <svg className="w-5 h-5 fill-current text-[#229ED9]" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Email',
      color: '#E50914',
      bgHover: 'hover:bg-[#E50914]/20',
      icon: <Mail className="w-4 h-4 text-[#E50914]" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\nRead the full report on The Chronicles: ${shareUrl}`)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#161616] border border-[#2D2D2D] rounded-xs shadow-2xl max-w-lg w-full p-5 sm:p-6 text-stone-200 relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E50914]/20 text-[#E50914] rounded-xs">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-editorial text-lg font-bold text-white tracking-wide">
                Share Dispatch
              </h3>
              <p className="text-[11px] font-mono-meta text-stone-400">
                Share this story with readers, colleagues, and social networks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white hover:bg-[#252525] rounded-xs transition-colors cursor-pointer"
            title="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Social Media Preview Card Mockup */}
        <div className="bg-[#101010] border border-[#2A2A2A] rounded-xs overflow-hidden shadow-inner group">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#181818]">
            <img
              src={previewImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              onError={(e) => {
                // Fallback to og-image
                (e.target as HTMLImageElement).src = '/og-image.png';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
              <span className="bg-[#E50914] text-white text-[10px] font-mono-meta font-extrabold px-2 py-0.5 rounded-xs uppercase tracking-wider shadow">
                {article.category}
              </span>
              {article.video_url && (
                <span className="bg-black/80 text-white text-[10px] font-mono-meta px-1.5 py-0.5 rounded-xs border border-white/20">
                  VIDEO
                </span>
              )}
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="text-[10px] font-mono-meta text-stone-300 uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#E50914]" /> thechronicles.press
              </span>
            </div>
          </div>
          <div className="p-3.5 space-y-1.5 bg-[#141414]">
            <h4 className="font-editorial text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">
              {article.title}
            </h4>
            <p className="text-[12px] font-sans-body text-stone-400 line-clamp-2 leading-relaxed">
              {article.subtitle || article.excerpt}
            </p>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div>
          <span className="text-[11px] font-mono-meta uppercase tracking-wider text-stone-400 font-bold block mb-2.5">
            Share to Social Channels
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-1.5 p-2.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xs transition-all ${platform.bgHover} text-stone-300 hover:text-white cursor-pointer group`}
                title={`Share via ${platform.name}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#141414] flex items-center justify-center group-hover:scale-110 transition-transform">
                  {platform.icon}
                </div>
                <span className="text-[10px] font-mono-meta tracking-tight text-stone-400 group-hover:text-white truncate">
                  {platform.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Copy Direct Link Section */}
        <div className="space-y-2 pt-2 border-t border-[#262626]">
          <span className="text-[11px] font-mono-meta uppercase tracking-wider text-stone-400 font-bold block">
            Direct Dispatch Link
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#101010] border border-[#333] px-3 py-2 rounded-xs font-mono-meta text-xs text-stone-300 truncate select-all">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-mono-meta text-xs uppercase font-bold rounded-xs transition-colors shrink-0 cursor-pointer shadow ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#E50914] hover:bg-[#C40711] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native Device Share Action (Mobile / Supported Desktops) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] text-stone-300 hover:text-white rounded-xs font-mono-meta text-xs uppercase font-bold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#E50914]" />
            <span>More Sharing Options (AirDrop, Messages, Device)</span>
          </button>
        )}
      </div>
    </div>
  );
};
