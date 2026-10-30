import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  Reply,
  Send,
  Check,
  Share2,
  Bookmark,
  Flag,
  Trash2,
  User,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Minus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getComments, addComment, toggleCommentLike, deleteComment } from '../lib/supabase';
import { DBComment } from '../lib/database.types';
import { ReportModal } from './ReportModal';

interface CommentsSectionProps {
  articleId: string;
  articleTitle: string;
  articleLikes: number;
  isArticleLiked: boolean;
  onToggleArticleLike: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
  copiedShareLink: boolean;
  onOpenAuth?: () => void;
}

// Helper to count all comments including nested descendants
const countAllComments = (list: DBComment[]): number => {
  return list.reduce(
    (acc, curr) => acc + 1 + (curr.replies && curr.replies.length > 0 ? countAllComments(curr.replies) : 0),
    0
  );
};

// Helper to count total replies beneath a specific comment
const countTotalReplies = (comment: DBComment): number => {
  if (!comment.replies || comment.replies.length === 0) return 0;
  return comment.replies.reduce((sum, r) => sum + 1 + countTotalReplies(r), 0);
};

// Helper to recursively update a comment in the tree
const updateCommentRecursively = (
  list: DBComment[],
  targetId: string,
  updater: (c: DBComment) => DBComment
): DBComment[] => {
  return list.map((item) => {
    if (item.id === targetId) {
      return updater(item);
    }
    if (item.replies && item.replies.length > 0) {
      return {
        ...item,
        replies: updateCommentRecursively(item.replies, targetId, updater),
      };
    }
    return item;
  });
};

// Helper to recursively delete a comment from the tree
const deleteCommentRecursively = (list: DBComment[], targetId: string): DBComment[] => {
  return list
    .filter((item) => item.id !== targetId)
    .map((item) => ({
      ...item,
      replies: item.replies ? deleteCommentRecursively(item.replies, targetId) : [],
    }));
};

// Helper to format comment timestamps cleanly
const formatCommentTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'recently';
  }
};

// Recursive Comment Item Component
interface CommentItemProps {
  comment: DBComment;
  depth: number;
  parentAuthorName?: string;
  user: any;
  isAdmin: boolean;
  replyingToId: string | null;
  replyText: string;
  submitting: boolean;
  collapsedReplies: Set<string>;
  collapsedFullComments: Set<string>;
  onToggleRepliesCollapse: (id: string) => void;
  onToggleFullCollapse: (id: string) => void;
  onStartReply: (id: string, authorName: string) => void;
  onCancelReply: () => void;
  onChangeReplyText: (text: string) => void;
  onSubmitReply: (parentId: string) => void;
  onToggleLike: (commentId: string, currentlyLiked: boolean) => void;
  onDelete: (commentId: string) => void;
  onReport: (type: 'comment' | 'reply', id: string, title: string) => void;
  onOpenAuth?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth,
  parentAuthorName,
  user,
  isAdmin,
  replyingToId,
  replyText,
  submitting,
  collapsedReplies,
  collapsedFullComments,
  onToggleRepliesCollapse,
  onToggleFullCollapse,
  onStartReply,
  onCancelReply,
  onChangeReplyText,
  onSubmitReply,
  onToggleLike,
  onDelete,
  onReport,
  onOpenAuth,
}) => {
  const isAuthor = user?.id === comment.user_id;
  const canDelete = isAuthor || isAdmin;
  const displayName = comment.user_profile?.display_name || 'Subscriber';
  const avatarUrl =
    comment.user_profile?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=e50914`;

  const totalReplies = countTotalReplies(comment);
  const isRepliesCollapsed = collapsedReplies.has(comment.id);
  const isFullCollapsed = collapsedFullComments.has(comment.id);
  const isReplying = replyingToId === comment.id;

  // If the user fully collapsed this comment branch, show a minimal single-line bar
  if (isFullCollapsed) {
    return (
      <div
        onClick={() => onToggleFullCollapse(comment.id)}
        className="group flex items-center justify-between p-2.5 bg-[#171717] hover:bg-[#1E1E1E] border border-[#262626] rounded-xs cursor-pointer transition-colors text-xs font-mono-meta"
      >
        <div className="flex items-center gap-2 text-stone-400 group-hover:text-stone-200">
          <Plus className="w-3.5 h-3.5 text-[#E50914]" />
          <span className="font-bold text-stone-300">{displayName}</span>
          <span className="text-stone-600">&bull;</span>
          <span className="text-stone-500">{formatCommentTime(comment.created_at)}</span>
          {totalReplies > 0 && (
            <span className="text-stone-400 bg-[#222222] px-2 py-0.5 rounded-xs text-[10px]">
              {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'} collapsed
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-500 uppercase tracking-wider group-hover:text-stone-300 flex items-center gap-1">
          Expand <ChevronDown className="w-3 h-3" />
        </span>
      </div>
    );
  }

  // Visual container styles based on nesting depth
  const containerBg =
    depth === 0
      ? 'bg-[#161616] border-[#252525] p-4 sm:p-5'
      : depth === 1
      ? 'bg-[#1A1A1A] border-[#282828] p-3.5 sm:p-4'
      : 'bg-[#181818] border-[#262626] p-3 sm:p-3.5';

  return (
    <div className={`border rounded-xs transition-colors ${containerBg}`}>
      {/* Comment Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <img
            src={avatarUrl}
            alt={displayName}
            className={`${
              depth === 0 ? 'w-8 h-8' : 'w-7 h-7'
            } rounded-full border border-stone-600 bg-stone-800 object-cover flex-shrink-0`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
            }}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono-meta text-xs font-bold text-stone-100">
              {displayName}
            </span>

            {comment.user_profile?.role === 'admin' && (
              <span className="bg-[#E50914] text-white text-[8px] sm:text-[9px] font-mono-meta font-bold px-1.5 py-0.2 rounded-xs">
                EDITORIAL
              </span>
            )}

            {/* If replying to a parent author, show who this reply is addressing */}
            {parentAuthorName && (
              <span className="text-[11px] text-stone-500 font-mono-meta flex items-center gap-1">
                <CornerDownRight className="w-3 h-3 text-stone-600 inline" />
                <span>replying to</span>
                <span className="text-[#E50914] font-semibold">@{parentAuthorName}</span>
              </span>
            )}

            <span className="font-mono-meta text-[11px] text-stone-500">
              &bull; {formatCommentTime(comment.created_at)}
            </span>
          </div>
        </div>

        {/* Header Actions: Minimize / Report / Delete */}
        <div className="flex items-center gap-1.5 text-stone-500">
          <button
            onClick={() => onToggleFullCollapse(comment.id)}
            className="hover:text-stone-300 p-1 text-[11px] font-mono-meta transition-colors"
            title="Minimize this comment branch"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              onReport(
                depth === 0 ? 'comment' : 'reply',
                comment.id,
                comment.content.slice(0, 40) + '...'
              )
            }
            className="hover:text-red-400 p-1 text-[11px] font-mono-meta transition-colors"
            title="Report this entry"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="hover:text-red-500 p-1 text-[11px] font-mono-meta transition-colors"
              title="Delete this entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comment Body */}
      <p
        className={`text-stone-300 text-sm leading-relaxed mb-3 ${
          depth === 0 ? 'pl-0 sm:pl-10' : 'pl-0 sm:pl-9'
        }`}
      >
        {comment.content}
      </p>

      {/* Action Bar (Like / Reply / Collapse-Expand Replies) */}
      <div
        className={`flex flex-wrap items-center gap-3 sm:gap-4 pt-2 border-t border-[#222222] font-mono-meta text-xs ${
          depth === 0 ? 'pl-0 sm:pl-10' : 'pl-0 sm:pl-9'
        }`}
      >
        {/* Like Button */}
        <button
          onClick={() => onToggleLike(comment.id, !!comment.is_liked_by_me)}
          className={`flex items-center gap-1.5 transition-colors ${
            comment.is_liked_by_me ? 'text-[#E50914]' : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Like"
        >
          <Heart className={`w-3.5 h-3.5 ${comment.is_liked_by_me ? 'fill-current' : ''}`} />
          <span>{comment.likes_count}</span>
        </button>

        {/* Reply Button (Allows replying to any comment or reply at any depth) */}
        <button
          onClick={() => {
            if (!user) {
              onOpenAuth?.();
            } else {
              onStartReply(comment.id, displayName);
            }
          }}
          className="flex items-center gap-1.5 text-stone-400 hover:text-[#E50914] transition-colors"
          title="Reply directly under this comment"
        >
          <Reply className="w-3.5 h-3.5" />
          <span>REPLY</span>
        </button>

        {/* Collapse / Uncollapse Replies Toggle Button */}
        {totalReplies > 0 && (
          <button
            onClick={() => onToggleRepliesCollapse(comment.id)}
            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors ml-auto text-[11px]"
            title={isRepliesCollapsed ? 'Expand replies' : 'Collapse replies'}
          >
            {isRepliesCollapsed ? (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Show {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                <span>Hide {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Inline Reply Box (Opens right under the active comment or reply) */}
      {isReplying && (
        <div className={`mt-3 pt-3 border-t border-[#262626] ${depth === 0 ? 'pl-0 sm:pl-10' : 'pl-0 sm:pl-9'}`}>
          <div className="bg-[#1D1D1D] border border-[#333333] p-3 sm:p-3.5 rounded-xs">
            <div className="flex items-center justify-between text-[11px] font-mono-meta text-stone-400 mb-2">
              <span>
                Replying to <span className="text-[#E50914] font-bold">@{displayName}</span>:
              </span>
              <button
                type="button"
                onClick={onCancelReply}
                className="text-stone-500 hover:text-stone-300 uppercase tracking-wider"
              >
                Close
              </button>
            </div>
            <textarea
              autoFocus
              rows={2}
              value={replyText}
              onChange={(e) => onChangeReplyText(e.target.value)}
              placeholder={`Write your dispatch reply to @${displayName}...`}
              className="w-full bg-[#141414] border border-[#2E2E2E] text-stone-100 p-2.5 text-xs focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 resize-none mb-2.5"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                className="px-3 py-1.5 text-[11px] font-mono-meta uppercase text-stone-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !replyText.trim()}
                onClick={() => onSubmitReply(comment.id)}
                className="bg-[#E50914] hover:bg-[#C40711] text-white px-4 py-1.5 text-[11px] font-mono-meta font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>{submitting ? 'DISPATCHING...' : 'SEND REPLY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Replies Section with Collapse/Uncollapse */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {isRepliesCollapsed ? (
            /* Collapsed Banner */
            <button
              onClick={() => onToggleRepliesCollapse(comment.id)}
              className="w-full mt-2 flex items-center justify-between p-2.5 bg-[#1B1B1B] hover:bg-[#222222] border border-[#2A2A2A] rounded-xs text-xs font-mono-meta text-stone-400 hover:text-stone-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[#E50914]" />
                <span className="font-bold text-stone-300">
                  {totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}
                </span>
                <span className="text-stone-500">collapsed</span>
              </div>
              <span className="text-[11px] text-[#E50914] uppercase tracking-wider flex items-center gap-1 font-semibold">
                Click to expand <ChevronDown className="w-3 h-3" />
              </span>
            </button>
          ) : (
            /* Expanded Replies Tree with Thread Guide Line */
            <div className={`relative ${depth >= 2 ? 'pl-2 sm:pl-3' : 'pl-2.5 sm:pl-4'} space-y-3 mt-3`}>
              {/* Interactive Left Threadline: Hoverable and clickable to collapse */}
              <div
                onClick={() => onToggleRepliesCollapse(comment.id)}
                title="Click threadline to collapse replies"
                className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#2B2B2B] hover:bg-[#E50914] cursor-pointer transition-colors"
              />
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  parentAuthorName={displayName}
                  user={user}
                  isAdmin={isAdmin}
                  replyingToId={replyingToId}
                  replyText={replyText}
                  submitting={submitting}
                  collapsedReplies={collapsedReplies}
                  collapsedFullComments={collapsedFullComments}
                  onToggleRepliesCollapse={onToggleRepliesCollapse}
                  onToggleFullCollapse={onToggleFullCollapse}
                  onStartReply={onStartReply}
                  onCancelReply={onCancelReply}
                  onChangeReplyText={onChangeReplyText}
                  onSubmitReply={onSubmitReply}
                  onToggleLike={onToggleLike}
                  onDelete={onDelete}
                  onReport={onReport}
                  onOpenAuth={onOpenAuth}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  articleId,
  articleTitle,
  articleLikes,
  isArticleLiked,
  onToggleArticleLike,
  isBookmarked,
  onToggleBookmark,
  onShare,
  copiedShareLink,
  onOpenAuth,
}) => {
  const { user, profile, isAdmin } = useAuth();

  const [comments, setComments] = useState<DBComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');

  // Active reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Collapse / Uncollapse state sets
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());
  const [collapsedFullComments, setCollapsedFullComments] = useState<Set<string>>(new Set());

  // Reporting State
  const [reportTarget, setReportTarget] = useState<{
    isOpen: boolean;
    type: 'article' | 'comment' | 'reply';
    id: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'article',
    id: articleId,
    title: articleTitle,
  });

  const loadAllComments = async () => {
    try {
      const data = await getComments(articleId, user?.id);
      setComments(data);
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllComments();
  }, [articleId, user?.id]);

  // Handle posting top-level article comments
  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(articleId, user.id, newCommentText.trim());
      setNewCommentText('');
      await loadAllComments();
    } catch (err: any) {
      alert(`Could not post comment: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle posting a reply under any comment or existing reply (at any nesting level)
  const handlePostReply = async (parentId: string) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await addComment(articleId, user.id, replyText.trim(), parentId);
      setReplyText('');
      setReplyingToId(null);
      // Auto-uncollapse this comment's replies so the user immediately sees their reply
      setCollapsedReplies((prev) => {
        if (!prev.has(parentId)) return prev;
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
      await loadAllComments();
    } catch (err: any) {
      alert(`Could not post reply: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle liking a comment or reply with full recursive optimistic update
  const handleToggleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }

    setComments((prev) =>
      updateCommentRecursively(prev, commentId, (c) => ({
        ...c,
        is_liked_by_me: !currentlyLiked,
        likes_count: currentlyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1,
      }))
    );

    try {
      await toggleCommentLike(commentId, user.id, currentlyLiked);
    } catch (err) {
      console.warn('Failed to toggle comment like:', err);
      loadAllComments();
    }
  };

  // Toggle deleting a comment or reply with recursive optimistic update
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to remove this dispatch comment?')) return;

    setComments((prev) => deleteCommentRecursively(prev, commentId));

    try {
      await deleteComment(commentId);
      await loadAllComments();
    } catch (err: any) {
      alert(`Failed to delete comment: ${err.message}`);
      loadAllComments();
    }
  };

  // Collapse / Uncollapse handlers
  const handleToggleRepliesCollapse = (commentId: string) => {
    setCollapsedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleToggleFullCollapse = (commentId: string) => {
    setCollapsedFullComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleStartReply = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyText('');
  };

  const handleOpenReport = (type: 'comment' | 'reply', id: string, title: string) => {
    setReportTarget({
      isOpen: true,
      type,
      id,
      title,
    });
  };

  const totalCommentCount = countAllComments(comments);

  return (
    <section className="w-full mt-12 pt-8 border-t border-[#262626] font-sans-body">
      {/* Primary Interaction Action Bar */}
      <div className="bg-[#181818] border border-[#2B2B2B] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Like Article Button */}
          <button
            onClick={() => {
              if (!user) onOpenAuth?.();
              else onToggleArticleLike();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xs font-mono-meta text-xs font-bold uppercase transition-colors ${
              isArticleLiked
                ? 'bg-[#E50914] text-white shadow-md'
                : 'bg-[#222222] text-stone-300 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isArticleLiked ? 'fill-current' : ''}`} />
            <span>{articleLikes} LIKES</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => {
              if (!user) onOpenAuth?.();
              else onToggleBookmark();
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xs font-mono-meta text-xs font-bold uppercase transition-colors ${
              isBookmarked
                ? 'bg-[#E50914] text-white shadow-md'
                : 'bg-[#222222] text-stone-300 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'SAVED' : 'BOOKMARK'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white rounded-xs font-mono-meta text-xs font-bold uppercase transition-colors"
          >
            {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedShareLink ? 'LINK COPIED' : 'SHARE'}</span>
          </button>
        </div>

        {/* Report Article Button */}
        <button
          onClick={() =>
            setReportTarget({
              isOpen: true,
              type: 'article',
              id: articleId,
              title: articleTitle,
            })
          }
          className="flex items-center gap-1.5 text-stone-500 hover:text-red-400 font-mono-meta text-xs transition-colors"
          title="Report this article to editors"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>REPORT ARTICLE</span>
        </button>
      </div>

      {/* Header for Readers Debate */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-editorial text-2xl font-bold text-white tracking-tight">
            Editorial Debate & Comments
          </h3>
          <p className="font-mono-meta text-xs text-stone-400 mt-1">
            {totalCommentCount} Reader Dispatches &bull; Moderated according to The Chronicles Standards
          </p>
        </div>
      </div>

      {/* Main Comment Input Box */}
      {user ? (
        <form onSubmit={handlePostTopComment} className="bg-[#161616] border border-[#2A2A2A] p-4 sm:p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=e50914`
              }
              alt={profile?.display_name || 'User'}
              className="w-8 h-8 rounded-full border border-stone-600 bg-stone-800 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-mono-meta text-xs font-bold text-white">
                {profile?.display_name || user.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="bg-[#E50914] text-white text-[9px] font-mono-meta font-bold px-1.5 py-0.5 rounded-xs">
                  EDITORIAL
                </span>
              )}
            </div>
          </div>
          <textarea
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Contribute your perspective to this dispatch..."
            className="w-full bg-[#1F1F1F] border border-[#333333] text-stone-100 p-3 text-sm focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 resize-none font-sans-body mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newCommentText.trim()}
              className="bg-[#E50914] hover:bg-[#C40711] text-white px-5 py-2 font-mono-meta text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'DISPATCHING...' : 'POST COMMENT'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-[#161616] border border-[#2A2A2A] p-6 text-center mb-8 space-y-3">
          <User className="w-8 h-8 text-stone-500 mx-auto" />
          <h4 className="font-editorial text-lg text-white font-semibold">Join the Editorial Discussion</h4>
          <p className="text-xs font-mono-meta text-stone-400 max-w-md mx-auto">
            Subscribers can contribute commentary, debate dispatches, and reply directly to correspondents.
          </p>
          <button
            onClick={onOpenAuth}
            className="bg-[#E50914] hover:bg-[#C40711] text-white px-6 py-2.5 font-mono-meta text-xs font-bold tracking-widest uppercase inline-flex items-center gap-2 transition-colors"
          >
            SIGN IN OR REGISTER TO COMMENT
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-stone-500 font-mono-meta text-xs animate-pulse">
          LOADING SUBSCRIBER DISPATCHES...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-stone-500 font-mono-meta text-xs border border-dashed border-[#282828] p-8">
          No comments yet. Be the first to open the debate.
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              user={user}
              isAdmin={isAdmin}
              replyingToId={replyingToId}
              replyText={replyText}
              submitting={submitting}
              collapsedReplies={collapsedReplies}
              collapsedFullComments={collapsedFullComments}
              onToggleRepliesCollapse={handleToggleRepliesCollapse}
              onToggleFullCollapse={handleToggleFullCollapse}
              onStartReply={handleStartReply}
              onCancelReply={handleCancelReply}
              onChangeReplyText={setReplyText}
              onSubmitReply={handlePostReply}
              onToggleLike={handleToggleLike}
              onDelete={handleDelete}
              onReport={handleOpenReport}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportTarget.isOpen}
        onClose={() => setReportTarget((prev) => ({ ...prev, isOpen: false }))}
        itemType={reportTarget.type}
        itemId={reportTarget.id}
        itemTitle={reportTarget.title}
      />
    </section>
  );
};
