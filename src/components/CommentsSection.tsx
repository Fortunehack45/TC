import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Reply, Send, Check, Share2, Bookmark } from 'lucide-react';

export interface CommentReply {
  id: string;
  parentId?: string;
  author: string;
  replyToAuthor?: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies: CommentReply[];
}

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
}) => {
  // Load initial comments from localStorage or default seed
  const [comments, setComments] = useState<ArticleComment[]>(() => {
    try {
      const saved = localStorage.getItem(`tan_comments_${articleId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }

    // Default seeded editorial comments with replies
    return [
      {
        id: 'c1',
        articleId,
        author: 'Elena Rostova',
        text: 'A profoundly insightful critique! The shift towards post-colonial curation in major European museums is long overdue.',
        timestamp: '2 hours ago',
        likes: 18,
        isLiked: false,
        replies: [
          {
            id: 'r1',
            author: 'Marcus Vance',
            replyToAuthor: 'Elena Rostova',
            text: 'Agreed! Tate Modern and the Mauritshuis are setting a benchmark for international collaborative loans.',
            timestamp: '1 hour ago',
            likes: 6,
            isLiked: false,
          },
          {
            id: 'r2',
            author: 'Sophia Chen',
            replyToAuthor: 'Marcus Vance',
            text: 'Exactly Marcus, the upcoming Vermeer exhibition in Amsterdam is proof that shared heritage builds stronger cultural ties.',
            timestamp: '30 mins ago',
            likes: 4,
            isLiked: false,
          },
        ],
      },
      {
        id: 'c2',
        articleId,
        author: 'Julian Thorne',
        text: 'Does anyone know if this exhibition catalog will be available in hardback for international shipping?',
        timestamp: '5 hours ago',
        likes: 7,
        isLiked: false,
        replies: [],
      },
    ];
  });

  const [newAuthor, setNewAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // Target for reply form: { commentId: string, replyToAuthor?: string }
  const [activeReplyTarget, setActiveReplyTarget] = useState<{
    commentId: string;
    replyToAuthor?: string;
  } | null>(null);

  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyText, setReplyText] = useState('');

  // Persist comments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`tan_comments_${articleId}`, JSON.stringify(comments));
    } catch {
      // Ignore
    }
  }, [comments, articleId]);

  // Add new top-level comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: ArticleComment = {
      id: 'c_' + Date.now(),
      articleId,
      author: newAuthor.trim() || 'Anonymous Reader',
      text: newCommentText.trim(),
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setComments([newComment, ...comments]);
    setNewCommentText('');
  };

  // Add reply under comment OR reply under a reply
  const handleAddReply = (commentId: string, replyToAuthor?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const newReply: CommentReply = {
      id: 'r_' + Date.now(),
      parentId: commentId,
      author: replyAuthor.trim() || 'Anonymous Reader',
      replyToAuthor: replyToAuthor,
      text: replyToAuthor ? `@${replyToAuthor} ${replyText.trim()}` : replyText.trim(),
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, replies: [...c.replies, newReply] };
        }
        return c;
      })
    );

    setActiveReplyTarget(null);
    setReplyText('');
  };

  // Toggle comment like
  const handleToggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likes: isLiked ? c.likes + 1 : c.likes - 1,
          };
        }
        return c;
      })
    );
  };

  // Toggle reply like
  const handleToggleReplyLike = (commentId: string, replyId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const updatedReplies = c.replies.map((r) => {
            if (r.id === replyId) {
              const isLiked = !r.isLiked;
              return {
                ...r,
                isLiked,
                likes: isLiked ? r.likes + 1 : r.likes - 1,
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      })
    );
  };

  return (
    <section className="w-full pt-10 mt-12 border-t border-[#282828]">
      {/* Article Engagement Bar (Like, Save, Share) */}
      <div className="bg-[#181818] border border-[#282828] p-4 sm:p-6 rounded-xs mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Like Article */}
          <button
            onClick={onToggleArticleLike}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs font-mono-meta text-xs font-bold transition-colors min-h-[44px] ${
              isArticleLiked
                ? 'bg-[#E50914] text-white'
                : 'bg-[#222222] text-stone-300 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isArticleLiked ? 'fill-white' : ''}`} />
            <span>{articleLikes} LIKES</span>
          </button>

          {/* Bookmark Article */}
          <button
            onClick={onToggleBookmark}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xs font-mono-meta text-xs font-bold transition-colors min-h-[44px] ${
              isBookmarked
                ? 'bg-[#E50914] text-white'
                : 'bg-[#222222] text-stone-300 hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
            <span>{isBookmarked ? 'SAVED' : 'SAVE ARTICLE'}</span>
          </button>
        </div>

        {/* Share Article */}
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#222222] hover:bg-[#2A2A2A] text-stone-300 hover:text-white rounded-xs font-mono-meta text-xs font-bold transition-colors min-h-[44px]"
        >
          {copiedShareLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">LINK COPIED!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>SHARE STORY</span>
            </>
          )}
        </button>
      </div>

      {/* Comments Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#282828]">
        <h3 className="font-masthead text-xl sm:text-2xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#E50914]" />
          READER DISCUSSION ({comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)})
        </h3>
        <span className="font-mono-meta text-xs text-stone-400">EDITORIAL FORUM</span>
      </div>

      {/* New Top-Level Comment Input Form */}
      <form onSubmit={handleAddComment} className="bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Your Name (optional)"
            className="sm:w-1/3 bg-[#121212] border border-[#282828] focus:border-[#E50914] px-3 py-2 rounded-xs text-xs font-mono-meta text-white placeholder-stone-500 focus:outline-none"
          />
        </div>
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Join the discussion... Share your thoughts on this article."
          rows={3}
          className="w-full bg-[#121212] border border-[#282828] focus:border-[#E50914] p-3 rounded-xs text-xs sm:text-sm font-sans-body text-white placeholder-stone-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#E50914] hover:bg-[#C40711] text-white px-5 py-2.5 rounded-xs font-mono-meta text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors min-h-[40px]"
          >
            <Send className="w-3.5 h-3.5" /> POST COMMENT
          </button>
        </div>
      </form>

      {/* Comments & Multi-Tier Reply List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-[#181818] border border-[#282828] p-4 sm:p-5 rounded-xs space-y-3">
            {/* Comment Header */}
            <div className="flex items-center justify-between text-xs font-mono-meta text-stone-400">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#282828] text-stone-200 flex items-center justify-center font-bold text-xs uppercase">
                  {comment.author.charAt(0)}
                </div>
                <span className="font-bold text-white">{comment.author}</span>
              </div>
              <span>{comment.timestamp}</span>
            </div>

            {/* Comment Text */}
            <p className="text-xs sm:text-sm text-stone-300 font-sans-body leading-relaxed">
              {comment.text}
            </p>

            {/* Comment Actions (Like Comment & Reply) */}
            <div className="flex items-center gap-4 text-xs font-mono-meta pt-2 border-t border-[#222222]">
              <button
                onClick={() => handleToggleCommentLike(comment.id)}
                className={`flex items-center gap-1.5 transition-colors min-h-[36px] px-1.5 ${
                  comment.isLiked ? 'text-[#E50914] font-bold' : 'text-stone-400 hover:text-white'
                }`}
                title="Like comment"
              >
                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-[#E50914]' : ''}`} />
                <span>{comment.likes} {comment.likes === 1 ? 'LIKE' : 'LIKES'}</span>
              </button>

              <button
                onClick={() =>
                  setActiveReplyTarget(
                    activeReplyTarget?.commentId === comment.id && !activeReplyTarget.replyToAuthor
                      ? null
                      : { commentId: comment.id }
                  )
                }
                className="text-stone-400 hover:text-white flex items-center gap-1.5 transition-colors min-h-[36px] px-1.5"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>REPLY ({comment.replies.length})</span>
              </button>
            </div>

            {/* Nested Reply Form */}
            {activeReplyTarget?.commentId === comment.id && (
              <form
                onSubmit={(e) => handleAddReply(comment.id, activeReplyTarget.replyToAuthor, e)}
                className="mt-3 pt-3 border-t border-[#282828] pl-3 sm:pl-6 space-y-2 bg-[#141414] p-3 rounded-xs"
              >
                <div className="text-xs font-mono-meta text-[#E50914] font-bold">
                  {activeReplyTarget.replyToAuthor
                    ? `REPLYING TO @${activeReplyTarget.replyToAuthor}`
                    : `REPLYING TO ${comment.author}`}
                </div>
                <input
                  type="text"
                  value={replyAuthor}
                  onChange={(e) => setReplyAuthor(e.target.value)}
                  placeholder="Your Name (optional)"
                  className="sm:w-1/3 bg-[#121212] border border-[#282828] focus:border-[#E50914] px-3 py-1.5 rounded-xs text-xs font-mono-meta text-white placeholder-stone-500 focus:outline-none"
                />
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full bg-[#121212] border border-[#282828] focus:border-[#E50914] p-2.5 rounded-xs text-xs font-sans-body text-white placeholder-stone-500 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyTarget(null)}
                    className="bg-[#222222] text-stone-400 hover:text-white px-3 py-1.5 rounded-xs font-mono-meta text-[11px]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="bg-[#E50914] hover:bg-[#C40711] text-white px-4 py-1.5 rounded-xs font-mono-meta text-[11px] font-bold"
                  >
                    POST REPLY
                  </button>
                </div>
              </form>
            )}

            {/* Replies List (Support Reply to Reply & Like Reply) */}
            {comment.replies.length > 0 && (
              <div className="mt-3 pl-3 sm:pl-6 border-l-2 border-[#E50914]/40 space-y-3 pt-2">
                {comment.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-[#121212] p-3 rounded-xs space-y-2 border border-[#222222] hover:border-[#333333] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono-meta text-stone-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-200">{reply.author}</span>
                        {reply.replyToAuthor && (
                          <span className="text-[10px] text-[#E50914] font-semibold">
                            ↳ @{reply.replyToAuthor}
                          </span>
                        )}
                      </div>
                      <span>{reply.timestamp}</span>
                    </div>

                    <p className="text-xs text-stone-300 font-sans-body leading-relaxed">
                      {reply.text}
                    </p>

                    {/* Actions for Reply (Like Reply & Reply to Reply) */}
                    <div className="flex items-center gap-4 text-[11px] font-mono-meta pt-1 border-t border-[#222222]">
                      <button
                        onClick={() => handleToggleReplyLike(comment.id, reply.id)}
                        className={`flex items-center gap-1 transition-colors min-h-[32px] px-1 ${
                          reply.isLiked ? 'text-[#E50914] font-bold' : 'text-stone-400 hover:text-white'
                        }`}
                        title="Like reply"
                      >
                        <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-[#E50914]' : ''}`} />
                        <span>{reply.likes} {reply.likes === 1 ? 'LIKE' : 'LIKES'}</span>
                      </button>

                      {/* Reply to this specific Reply */}
                      <button
                        onClick={() =>
                          setActiveReplyTarget({
                            commentId: comment.id,
                            replyToAuthor: reply.author,
                          })
                        }
                        className="text-stone-400 hover:text-white flex items-center gap-1 transition-colors min-h-[32px] px-1"
                      >
                        <Reply className="w-3 h-3" />
                        <span>REPLY</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
