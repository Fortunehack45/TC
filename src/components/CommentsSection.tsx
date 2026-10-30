import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Reply, Send, Check, Share2, Bookmark, Flag, Trash2, User } from 'lucide-react';
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
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      await loadAllComments();
    } catch (err: any) {
      alert(`Could not post reply: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            is_liked_by_me: !currentlyLiked,
            likes_count: currentlyLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1,
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    is_liked_by_me: !currentlyLiked,
                    likes_count: currentlyLiked ? Math.max(0, r.likes_count - 1) : r.likes_count + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );

    try {
      await toggleCommentLike(commentId, user.id, currentlyLiked);
    } catch (err) {
      console.warn('Failed to toggle comment like:', err);
      loadAllComments();
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to remove this comment?')) return;
    try {
      await deleteComment(commentId);
      await loadAllComments();
    } catch (err: any) {
      alert(`Failed to delete comment: ${err.message}`);
    }
  };

  const totalCommentCount = comments.reduce(
    (acc, curr) => acc + 1 + (curr.replies?.length || 0),
    0
  );

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
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}&backgroundColor=e50914`}
              alt={profile?.display_name || 'User'}
              className="w-8 h-8 rounded-full border border-stone-600 bg-stone-800 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
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
          {comments.map((comment) => {
            const isAuthor = user?.id === comment.user_id;
            const canDelete = isAuthor || isAdmin;
            const displayName = comment.user_profile?.display_name || 'Subscriber';
            const avatarUrl =
              comment.user_profile?.avatar_url ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=e50914`;

            return (
              <div
                key={comment.id}
                className="bg-[#161616] border border-[#252525] p-4 sm:p-5 rounded-xs"
              >
                {/* Top-Level Comment Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border border-stone-600 bg-stone-800 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-meta text-xs font-bold text-stone-100">
                          {displayName}
                        </span>
                        {comment.user_profile?.role === 'admin' && (
                          <span className="bg-[#E50914] text-white text-[9px] font-mono-meta font-bold px-1.5 py-0.2 rounded-xs">
                            EDITORIAL
                          </span>
                        )}
                      </div>
                      <span className="font-mono-meta text-[11px] text-stone-500">
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-500">
                    <button
                      onClick={() =>
                        setReportTarget({
                          isOpen: true,
                          type: 'comment',
                          id: comment.id,
                          title: comment.content.slice(0, 40) + '...',
                        })
                      }
                      className="hover:text-red-400 p-1 text-[11px] font-mono-meta flex items-center gap-1 transition-colors"
                      title="Report comment"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="hover:text-red-500 p-1 text-[11px] font-mono-meta flex items-center gap-1 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-stone-300 text-sm leading-relaxed mb-3 pl-10">
                  {comment.content}
                </p>

                {/* Comment Actions (Like / Reply) */}
                <div className="flex items-center gap-4 pl-10 pt-2 border-t border-[#222222] font-mono-meta text-xs">
                  <button
                    onClick={() => handleToggleLike(comment.id, !!comment.is_liked_by_me)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      comment.is_liked_by_me ? 'text-[#E50914]' : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.is_liked_by_me ? 'fill-current' : ''}`} />
                    <span>{comment.likes_count}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!user) onOpenAuth?.();
                      else setReplyingToId(replyingToId === comment.id ? null : comment.id);
                    }}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-[#E50914] transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>REPLY</span>
                  </button>
                </div>

                {/* Inline Reply Input Box */}
                {replyingToId === comment.id && (
                  <div className="mt-4 pl-10 pt-3 border-t border-[#282828]">
                    <div className="bg-[#1C1C1C] border border-[#333333] p-3">
                      <div className="text-[11px] font-mono-meta text-stone-400 mb-1.5">
                        Replying to <span className="text-[#E50914]">@{displayName}</span>:
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full bg-[#141414] border border-[#2E2E2E] text-stone-100 p-2 text-xs focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 resize-none mb-2"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1 text-[11px] font-mono-meta uppercase text-stone-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting || !replyText.trim()}
                          onClick={() => handlePostReply(comment.id)}
                          className="bg-[#E50914] hover:bg-[#C40711] text-white px-4 py-1 text-[11px] font-mono-meta font-bold uppercase transition-colors disabled:opacity-50"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Threaded Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-8 sm:pl-10 space-y-3 border-l-2 border-[#282828]">
                    {comment.replies.map((reply) => {
                      const isReplyAuthor = user?.id === reply.user_id;
                      const canDeleteReply = isReplyAuthor || isAdmin;
                      const replyName = reply.user_profile?.display_name || 'Subscriber';
                      const replyAvatar =
                        reply.user_profile?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${replyName}&backgroundColor=e50914`;

                      return (
                        <div
                          key={reply.id}
                          className="bg-[#1A1A1A] border border-[#282828] p-3 rounded-xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <img
                                src={replyAvatar}
                                alt={replyName}
                                className="w-6 h-6 rounded-full border border-stone-600 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
                                }}
                              />
                              <span className="font-mono-meta text-[11px] font-bold text-stone-200">
                                {replyName}
                              </span>
                              {reply.user_profile?.role === 'admin' && (
                                <span className="bg-[#E50914] text-white text-[8px] font-mono-meta font-bold px-1 py-0.2 rounded-xs">
                                  EDITORIAL
                                </span>
                              )}
                              <span className="font-mono-meta text-[10px] text-stone-500">
                                {new Date(reply.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-stone-500">
                              <button
                                onClick={() =>
                                  setReportTarget({
                                    isOpen: true,
                                    type: 'reply',
                                    id: reply.id,
                                    title: reply.content.slice(0, 30) + '...',
                                  })
                                }
                                className="hover:text-red-400 text-[10px]"
                                title="Report reply"
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                              {canDeleteReply && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="hover:text-red-500 text-[10px]"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-stone-300 text-xs leading-relaxed pl-8">
                            {reply.content}
                          </p>

                          <div className="pl-8 pt-1.5 flex items-center gap-3 font-mono-meta text-[11px]">
                            <button
                              onClick={() => handleToggleLike(reply.id, !!reply.is_liked_by_me)}
                              className={`flex items-center gap-1 transition-colors ${
                                reply.is_liked_by_me ? 'text-[#E50914]' : 'text-stone-400 hover:text-stone-200'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reply.is_liked_by_me ? 'fill-current' : ''}`} />
                              <span>{reply.likes_count}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
