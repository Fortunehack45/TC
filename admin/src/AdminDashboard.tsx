import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Flag, Eye, Edit3, Trash2, Search, ArrowLeft, BarChart2,
  Clock, Check, X, ShieldAlert, Sparkles, Users, UserCheck, UserX, UserMinus, ShieldCheck,
  Activity, RefreshCw, LogOut
} from 'lucide-react';
import { DBArticle, DBReport, Profile } from './database.types';
import {
  getArticles, deleteArticle, upsertArticle, getReports, updateReportStatus,
  deleteComment, getUsers, updateUserStatus, updateUserRole, deleteUser
} from './supabase';
import { WordEditor } from './WordEditor';
import { ArticlePreviewModal } from './ArticlePreviewModal';
import { CustomDropdown } from './CustomDropdown';
import { computeArticleLifecycle, ArticleLifecycle, LifecycleStatus } from './lib/lifecycle';
import { getPostPreviewImage } from './lib/imageHelper';

interface AdminDashboardProps {
  adminEmail?: string;
  onSignOut?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail, onSignOut }) => {
  const getInitialTab = (): 'list' | 'editor' | 'reports' | 'users' => {
    try {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'editor' || tab === 'reports' || tab === 'users' || tab === 'list') {
        return tab;
      }
      const saved = sessionStorage.getItem('tc_admin_tab');
      if (saved === 'editor' || saved === 'reports' || saved === 'users' || saved === 'list') {
        return saved;
      }
    } catch {}
    return 'list';
  };

  const [activeTab, setActiveTabState] = useState<'list' | 'editor' | 'reports' | 'users'>(getInitialTab);

  const setActiveTab = (tab: 'list' | 'editor' | 'reports' | 'users') => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('tc_admin_tab', tab);
      const params = new URLSearchParams(window.location.search);
      if (tab === 'list') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const q = params.toString();
      const newUrl = q ? `${window.location.pathname}?${q}` : window.location.pathname;
      window.history.replaceState({ tab }, '', newUrl);
    } catch {}
  };

  const [editingArticle, setEditingArticle] = useState<DBArticle | null>(null);

  const [articles, setArticles] = useState<DBArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'published' | 'draft'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<'ALL' | LifecycleStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [reports, setReports] = useState<DBReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'pending' | 'resolved' | 'dismissed'>('pending');

  // User Analytics & Management State
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'admin' | 'user'>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [previewArticle, setPreviewArticle] = useState<DBArticle | null>(null);

  // Pagination for 500+ dispatches
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadArticles = async () => {
    setLoadingArticles(true);
    try {
      const data = await getArticles(undefined, true);
      setArticles(data);
    } catch (err) {
      console.warn('Failed to load articles for admin:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.warn('Failed to load users for admin:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadArticles();
    loadReports();
    loadUsers();
  }, []);

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the dispatch:\n"${title}"?`)) return;
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleTogglePublish = async (article: DBArticle) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await upsertArticle({
        ...article,
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : article.published_at,
      });
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleUpdateReport = async (reportId: string, newStatus: DBReport['status']) => {
    try {
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(`Failed to update report: ${err.message}`);
    }
  };

  const handleRemoveReportedItem = async (report: DBReport) => {
    if (!confirm(`Delete offending ${report.item_type}?`)) return;
    try {
      if (report.item_type === 'comment' || report.item_type === 'reply') {
        await deleteComment(report.item_id);
      } else if (report.item_type === 'article') {
        await deleteArticle(report.item_id);
      }
      await updateReportStatus(report.id, 'resolved');
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'resolved' } : r))
      );
      alert('Offending content deleted and report resolved.');
      loadArticles();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  // User status toggling (Active <-> Inactive)
  const handleToggleUserStatus = async (targetUser: Profile) => {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(targetUser.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message}`);
    }
  };

  // User role toggling (Admin <-> Reader)
  const handleToggleUserRole = async (targetUser: Profile) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(targetUser.id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
    } catch (err: any) {
      alert(`Failed to update user role: ${err.message}`);
    }
  };

  // User deletion
  const handleDeleteUser = async (targetUser: Profile) => {
    if (!confirm(`Permanently remove reader "${targetUser.display_name || targetUser.email}"?`)) return;
    try {
      await deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && a.category_id !== categoryFilter) return false;
    if (lifecycleFilter !== 'ALL') {
      const lc = computeArticleLifecycle(a.published_at, a.lifecycle_stage);
      if (lc.status !== lifecycleFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchAuthor = a.author_name.toLowerCase().includes(q);
      const matchTag = a.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchAuthor && !matchTag) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const filteredReports = reports.filter((r) => {
    if (reportFilter !== 'ALL' && r.status !== reportFilter) return false;
    return true;
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchName = (u.display_name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const totalViews = articles.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  // Real User Metrics
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const inactiveUsersCount = users.filter((u) => u.status === 'inactive').length;

  if (activeTab === 'editor') {
    return (
      <WordEditor
        initialArticle={editingArticle}
        onSaved={() => {
          setEditingArticle(null);
          setActiveTab('list');
          loadArticles();
        }}
        onCancel={() => {
          setEditingArticle(null);
          setActiveTab('list');
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#101010] text-stone-200 font-sans-body pb-24">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#161616] border-b border-[#252525] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="The Chronicles"
            className="h-7 w-auto object-contain rounded-xs shadow"
          />
          <span className="font-editorial text-sm sm:text-base font-bold text-white hidden md:inline">
            Independent Editorial Administration Hub
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto max-w-full scrollbar-none py-1">
          {/* Dispatches Tab Button */}
          <button
            onClick={() => setActiveTab('list')}
            className={`px-2.5 sm:px-3 py-1.5 font-mono-meta text-xs uppercase font-bold rounded-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-black'
                : 'text-stone-400 hover:text-white bg-[#1F1F1F]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">DISPATCHES </span>({totalArticles})</span>
          </button>

          {/* Users Directory Tab Button */}
          <button
            onClick={() => setActiveTab('users')}
            className={`px-2.5 sm:px-3 py-1.5 font-mono-meta text-xs uppercase font-bold rounded-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#E50914] text-white'
                : 'text-stone-400 hover:text-white bg-[#1F1F1F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span><span className="hidden sm:inline">USERS </span>({totalUsers})</span>
            {activeUsersCount > 0 && (
              <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {activeUsersCount} ACTIVE
              </span>
            )}
          </button>

          {/* Reports Moderation Tab Button */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 sm:px-3 py-1.5 font-mono-meta text-xs uppercase font-bold rounded-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#E50914] text-white'
                : 'text-stone-400 hover:text-white bg-[#1F1F1F]'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">REPORTS</span>
            {pendingReportsCount > 0 && (
              <span className="bg-white text-[#E50914] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingReportsCount}
              </span>
            )}
          </button>

          {/* Write New Dispatch Button */}
          <button
            onClick={() => {
              setEditingArticle(null);
              setActiveTab('editor');
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-[#E50914] hover:bg-[#C40711] text-white rounded-xs font-mono-meta text-xs uppercase font-bold tracking-wider transition-colors shadow-lg shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">WRITE NEW DISPATCH</span>
            <span className="md:hidden">WRITE</span>
          </button>

          {/* Admin Identity & Sign Out */}
          {onSignOut && (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#2F2F2F] shrink-0">
              {adminEmail && (
                <span
                  className="hidden xl:inline-block text-[11px] font-mono-meta text-stone-300 font-bold truncate max-w-[170px]"
                  title={adminEmail}
                >
                  {adminEmail}
                </span>
              )}
              <button
                onClick={onSignOut}
                title="Sign out of Admin Console"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#202020] hover:bg-[#E50914] text-stone-300 hover:text-white rounded-xs font-mono-meta text-xs transition-colors cursor-pointer border border-[#303030]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 mt-6">
        {/* Executive Real-Time Metric Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-stone-500 uppercase tracking-widest block mb-1">
              TOTAL DISPATCHES
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-white">
              {totalArticles}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-emerald-400 uppercase tracking-widest block mb-1">
              LIVE & PUBLISHED
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-emerald-400">
              {publishedCount}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-stone-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-stone-400" /> TOTAL USERS
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-white">
              {totalUsers}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-emerald-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE USERS
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-emerald-400">
              {activeUsersCount}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-amber-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
              <UserX className="w-3 h-3 text-amber-500" /> INACTIVE USERS
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-amber-400">
              {inactiveUsersCount}
            </span>
          </div>

          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xs">
            <span className="text-[10px] font-mono-meta text-stone-400 uppercase tracking-widest block mb-1">
              TOTAL VIEWS
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-black text-white">
              {totalViews.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DISPATCHES LIST */}
        {/* ========================================================================= */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="bg-[#161616] border border-[#282828] p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search headlines, tags, reporters..."
                    className="bg-[#1F1F1F] border border-[#333] pl-9 pr-4 py-1.5 text-xs font-mono-meta rounded-xs text-stone-200 placeholder:text-stone-500 w-64 sm:w-80 focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-[#202020] border border-[#333] p-0.5 rounded-xs font-mono-meta text-xs">
                  {(['ALL', 'published', 'draft'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setStatusFilter(st);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-xs uppercase transition-colors cursor-pointer ${
                        statusFilter === st ? 'bg-[#E50914] text-white font-bold' : 'text-stone-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <CustomDropdown
                  value={categoryFilter}
                  onChange={(val) => {
                    setCategoryFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'ALL', label: 'All Beats (500)' },
                    { value: 'WORLD', label: 'World (50)' },
                    { value: 'POLITICS', label: 'Politics (50)' },
                    { value: 'FINANCE', label: 'Finance (50)' },
                    { value: 'TECHNOLOGY', label: 'Technology (50)' },
                    { value: 'SCIENCE', label: 'Science (50)' },
                    { value: 'LIFESTYLE', label: 'Lifestyle (50)' },
                    { value: 'FASHION', label: 'Fashion (50)' },
                    { value: 'CELEBRITY', label: 'Celebrity (50)' },
                    { value: 'SPORT', label: 'Sport (50)' },
                    { value: 'EDUCATION', label: 'Education (50)' },
                  ]}
                  className="w-44"
                />

                <CustomDropdown
                  value={lifecycleFilter}
                  onChange={(val) => {
                    setLifecycleFilter(val as any);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'ALL', label: 'All Lifecycles (Decay)' },
                    { value: 'BREAKING', label: 'Breaking (0–6h)' },
                    { value: 'HEADLINE', label: 'Headline (6–24h)' },
                    { value: 'DEVELOPING', label: 'Developing (24–48h)' },
                    { value: 'REGULAR', label: 'Regular Feed (48–72h)' },
                    { value: 'ARCHIVED', label: 'Archived (72h+)' },
                  ]}
                  className="w-48"
                />
              </div>

              <div className="text-xs font-mono-meta text-stone-400">
                Found <span className="text-white font-bold">{filteredArticles.length}</span> dispatches
              </div>
            </div>

            {loadingArticles ? (
              <div className="py-24 text-center text-stone-500 font-mono-meta text-xs animate-pulse">
                INITIALIZING EDITORIAL REPOSITORY FROM SUPABASE...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-[#161616] border border-dashed border-[#282828] p-12 text-center text-stone-400 font-mono-meta text-xs">
                No matching dispatches found. Try adjusting your query or filter.
              </div>
            ) : (
              <>
                <div className="bg-[#161616] border border-[#262626] rounded-xs overflow-hidden shadow-2xl">
                  {/* Desktop Table View (>=768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left font-mono-meta text-xs">
                      <thead className="bg-[#1D1D1D] text-stone-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                        <tr>
                          <th className="py-3 px-4">Headline / Story</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Lifecycle</th>
                          <th className="py-3 px-4">Author</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Metrics</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {paginatedArticles.map((art) => {
                          const lc = computeArticleLifecycle(art.published_at, art.lifecycle_stage);
                          return (
                            <tr key={art.id} className="hover:bg-[#1C1C1C] transition-colors group">
                              <td className="py-3.5 px-4 max-w-md">
                                <div className="flex items-center gap-3">
                                  {getPostPreviewImage(art) && (
                                    <div className="relative shrink-0">
                                      <img
                                        src={getPostPreviewImage(art)}
                                        alt=""
                                        className="w-12 h-9 object-cover rounded-xs border border-[#333]"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/og-image.png';
                                        }}
                                      />
                                      {art.video_url && !art.cover_image_url && (
                                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono-meta text-white px-1 rounded-xs">
                                          VID
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <h4
                                      onClick={() => {
                                        setEditingArticle(art);
                                        setActiveTab('editor');
                                      }}
                                      className="font-editorial font-bold text-white group-hover:text-[#E50914] cursor-pointer line-clamp-1"
                                    >
                                      {art.title}
                                    </h4>
                                    <p className="text-[11px] text-stone-500 font-sans-body line-clamp-1">
                                      {art.subtitle || 'No lead deck recorded.'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-[#202020] text-stone-300 border border-[#333] text-[10px] rounded-xs uppercase font-bold">
                                  {art.category_id}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded-xs border w-fit ${lc.badgeClass}`}>
                                    {lc.badgeText}
                                  </span>
                                  <span className="text-[10px] text-stone-500 font-mono-meta">{lc.timeAgoFormatted}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4 text-stone-300">
                                {art.author_name}
                              </td>

                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleTogglePublish(art)}
                                  className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-xs transition-colors cursor-pointer border ${
                                    art.status === 'published'
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                      : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
                                  }`}
                                  title="Click to toggle status"
                                >
                                  {art.status}
                                </button>
                              </td>

                              <td className="py-3 px-4 text-stone-400 text-[11px]">
                                <span className="text-stone-300 font-bold">{art.views_count || 0}</span> views &bull;{' '}
                                <span className="text-stone-300 font-bold">{art.likes_count || 0}</span> likes
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setPreviewArticle(art)}
                                    className="p-1.5 text-stone-400 hover:text-white bg-[#222] hover:bg-[#2C2C2C] rounded-xs transition-colors cursor-pointer"
                                    title="Live Article Preview"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingArticle(art);
                                      setActiveTab('editor');
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-white bg-[#222] hover:bg-[#2C2C2C] rounded-xs transition-colors cursor-pointer"
                                    title="Edit in Rich Editor"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#E50914]" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteArticle(art.id, art.title)}
                                    className="p-1.5 text-stone-400 hover:text-red-400 bg-[#222] hover:bg-red-950/50 rounded-xs transition-colors cursor-pointer"
                                    title="Permanently Delete Dispatch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 100% Mobile Optimized Card Feed (<768px) */}
                  <div className="md:hidden divide-y divide-[#222222]">
                    {paginatedArticles.map((art) => {
                      const lc = computeArticleLifecycle(art.published_at, art.lifecycle_stage);
                      return (
                        <div key={art.id} className="p-4 bg-[#161616] flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 bg-[#202020] text-stone-300 border border-[#333] text-[9px] rounded-xs uppercase font-bold">
                                  {art.category_id}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded-xs border ${lc.badgeClass}`}>
                                  {lc.badgeText}
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono-meta">{lc.timeAgoFormatted}</span>
                              </div>
                              <h4
                                onClick={() => {
                                  setEditingArticle(art);
                                  setActiveTab('editor');
                                }}
                                className="font-editorial font-bold text-sm text-white hover:text-[#E50914] cursor-pointer line-clamp-2"
                              >
                                {art.title}
                              </h4>
                              <p className="text-[11px] text-stone-400 font-sans-body line-clamp-1 mt-1">
                                By {art.author_name}
                              </p>
                            </div>
                            {getPostPreviewImage(art) && (
                              <div className="relative shrink-0">
                                <img
                                  src={getPostPreviewImage(art)}
                                  alt=""
                                  className="w-14 h-12 object-cover rounded-xs border border-[#333]"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/og-image.png';
                                  }}
                                />
                                {art.video_url && !art.cover_image_url && (
                                  <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono-meta text-white px-1 rounded-xs">
                                    VID
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-[#242424] text-[11px] font-mono-meta text-stone-400">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTogglePublish(art)}
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-xs border cursor-pointer ${
                                  art.status === 'published'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                    : 'bg-amber-950/80 text-amber-300 border-amber-700'
                                }`}
                              >
                                {art.status}
                              </button>
                              <span>{art.views_count || 0} views</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPreviewArticle(art)}
                                className="p-2 text-stone-400 hover:text-white bg-[#222] rounded-xs cursor-pointer"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingArticle(art);
                                  setActiveTab('editor');
                                }}
                                className="p-2 text-stone-400 hover:text-white bg-[#222] rounded-xs cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4 text-[#E50914]" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(art.id, art.title)}
                                className="p-2 text-stone-400 hover:text-red-400 bg-[#222] rounded-xs cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="bg-[#161616] border border-[#282828] p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-meta">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Rows per page:</span>
                    <CustomDropdown
                      value={String(pageSize)}
                      onChange={(v) => {
                        setPageSize(Number(v));
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: '25', label: '25 PER PAGE' },
                        { value: '50', label: '50 PER PAGE' },
                        { value: '100', label: '100 PER PAGE' },
                        { value: '500', label: 'ALL 500' },
                      ]}
                      className="w-36"
                    />
                    <span className="text-stone-500">
                      Showing {(safeCurrentPage - 1) * pageSize + 1} - {Math.min(safeCurrentPage * pageSize, filteredArticles.length)} of {filteredArticles.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage === 1}
                      className="px-2 py-1 bg-[#202020] hover:bg-[#2C2C2C] disabled:opacity-40 disabled:hover:bg-[#202020] border border-[#333] text-stone-300 rounded-xs cursor-pointer"
                    >
                      FIRST
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1 bg-[#202020] hover:bg-[#2C2C2C] disabled:opacity-40 disabled:hover:bg-[#202020] border border-[#333] text-stone-300 rounded-xs cursor-pointer"
                    >
                      PREV
                    </button>

                    <span className="px-3 py-1 bg-[#1A1A1A] border border-[#2D2D2D] text-white font-bold">
                      PAGE {safeCurrentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2.5 py-1 bg-[#202020] hover:bg-[#2C2C2C] disabled:opacity-40 disabled:hover:bg-[#202020] border border-[#333] text-stone-300 rounded-xs cursor-pointer"
                    >
                      NEXT
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="px-2 py-1 bg-[#202020] hover:bg-[#2C2C2C] disabled:opacity-40 disabled:hover:bg-[#202020] border border-[#333] text-stone-300 rounded-xs cursor-pointer"
                    >
                      LAST
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USER DIRECTORY & REAL-TIME ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-[#161616] border border-[#282828] p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#E50914]" />
                <span className="font-editorial text-lg font-bold text-white">
                  Chronicles Subscriber & Member Directory
                </span>
                <span className="bg-[#222] border border-[#333] px-2 py-0.5 text-xs font-mono-meta text-stone-300 rounded-xs">
                  {totalUsers} Members &bull; <span className="text-emerald-400 font-bold">{activeUsersCount} Active</span> &bull; <span className="text-amber-400 font-bold">{inactiveUsersCount} Inactive</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search name or email..."
                    className="bg-[#1F1F1F] border border-[#333] pl-9 pr-4 py-1.5 text-xs font-mono-meta rounded-xs text-stone-200 placeholder:text-stone-500 w-56 sm:w-72 focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-[#202020] border border-[#333] p-0.5 rounded-xs font-mono-meta text-xs">
                  {(['ALL', 'active', 'inactive'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setUserStatusFilter(st)}
                      className={`px-3 py-1 rounded-xs uppercase transition-colors cursor-pointer ${
                        userStatusFilter === st ? 'bg-[#E50914] text-white font-bold' : 'text-stone-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Role Filter */}
                <CustomDropdown
                  value={userRoleFilter}
                  onChange={(val) => setUserRoleFilter(val as any)}
                  options={[
                    { value: 'ALL', label: 'All Roles' },
                    { value: 'admin', label: 'Administrators' },
                    { value: 'user', label: 'Standard Readers' },
                  ]}
                  className="w-40"
                />

                <button
                  onClick={loadUsers}
                  className="p-1.5 text-stone-400 hover:text-white bg-[#222] hover:bg-[#2C2C2C] rounded-xs transition-colors cursor-pointer"
                  title="Refresh users directory"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="py-24 text-center text-stone-500 font-mono-meta text-xs animate-pulse">
                RETRIEVING REGISTERED SUBSCRIBERS FROM DATABASE...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-[#161616] border border-dashed border-[#282828] p-12 text-center text-stone-400 font-mono-meta text-xs">
                No users matched the selected query.
              </div>
            ) : (
              <div className="bg-[#161616] border border-[#262626] rounded-xs overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-meta text-xs">
                    <thead className="bg-[#1D1D1D] text-stone-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                      <tr>
                        <th className="py-3 px-4">Reader / Member</th>
                        <th className="py-3 px-4">Contact Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Engagement Status</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {filteredUsers.map((userItem) => {
                        const isActive = userItem.status === 'active';
                        return (
                          <tr key={userItem.id} className="hover:bg-[#1C1C1C] transition-colors group">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                {userItem.avatar_url ? (
                                  <img
                                    src={userItem.avatar_url}
                                    alt=""
                                    className="w-8 h-8 rounded-full border border-[#383838] shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#2A2A2A] text-stone-300 font-bold flex items-center justify-center shrink-0">
                                    {(userItem.display_name || userItem.email || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-white block">
                                    {userItem.display_name || 'Anonymous Reader'}
                                  </span>
                                  <span className="text-[10px] text-stone-500 font-mono-meta">
                                    ID: {userItem.id.substring(0, 13)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-stone-300">
                              {userItem.email || 'No email attached'}
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleUserRole(userItem)}
                                className={`px-2 py-0.5 rounded-xs text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                                  userItem.role === 'admin'
                                    ? 'bg-[#E50914]/20 text-[#E50914] border-[#E50914]/40 hover:bg-[#E50914]/30'
                                    : 'bg-[#222] text-stone-300 border-[#333] hover:bg-[#2A2A2A]'
                                }`}
                                title="Click to toggle role (Admin / Reader)"
                              >
                                {userItem.role === 'admin' ? 'CHIEF ADMIN' : 'READER'}
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleUserStatus(userItem)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                    : 'bg-stone-800 text-stone-400 border-stone-600 hover:bg-stone-700'
                                }`}
                                title="Click to toggle status (Active / Inactive)"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isActive ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                                  }`}
                                />
                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                              </button>
                            </td>

                            <td className="py-3 px-4 text-stone-400 text-[11px]">
                              {userItem.last_active_at
                                ? new Date(userItem.last_active_at).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent session'}
                            </td>

                            <td className="py-3 px-4 text-stone-400 text-[11px]">
                              {userItem.created_at
                                ? new Date(userItem.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Recent'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(userItem)}
                                  className="px-2 py-1 text-[10px] bg-[#222] hover:bg-[#2C2C2C] text-stone-300 rounded-xs transition-colors cursor-pointer"
                                  title="Change Active / Inactive"
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem)}
                                  className="p-1 text-stone-500 hover:text-red-400 hover:bg-red-950/40 rounded-xs transition-colors cursor-pointer"
                                  title="Delete user profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AUDIT REPORTS & MODERATION */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-[#161616] border border-[#282828] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-[#E50914]" />
                <span className="font-editorial text-lg font-bold text-white">
                  Subscriber Reports & Moderation Queue
                </span>
              </div>

              <div className="flex items-center bg-[#202020] border border-[#333] p-0.5 rounded-xs font-mono-meta text-xs">
                {(['ALL', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportFilter(st)}
                    className={`px-3 py-1 rounded-xs uppercase transition-colors cursor-pointer ${
                      reportFilter === st ? 'bg-[#E50914] text-white font-bold' : 'text-stone-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingReports ? (
              <div className="py-16 text-center text-stone-500 font-mono-meta text-xs animate-pulse">
                LOADING AUDIT REPORTS...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="bg-[#161616] border border-dashed border-[#282828] p-12 text-center text-stone-400 font-mono-meta text-xs">
                No reports found in this queue.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-[#161616] border border-[#262626] p-5 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono-meta font-bold bg-[#E50914] text-white px-2 py-0.5 rounded-xs uppercase">
                          {report.item_type}
                        </span>
                        <span className="text-xs font-bold text-white font-editorial">
                          Reason: {report.reason}
                        </span>
                        <span
                          className={`text-[9px] font-mono-meta uppercase px-2 py-0.2 rounded-xs border ${
                            report.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : report.status === 'resolved'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-stone-800 text-stone-400 border-stone-600'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      {report.details && (
                        <p className="text-xs text-stone-300 italic border-l-2 border-stone-600 pl-2">
                          &ldquo;{report.details}&rdquo;
                        </p>
                      )}

                      <div className="text-[11px] font-mono-meta text-stone-500">
                        Item ID: <code className="text-stone-400">{report.item_id}</code> &bull;{' '}
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRemoveReportedItem(report)}
                            className="bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 px-3 py-1.5 text-xs font-mono-meta font-bold uppercase transition-colors cursor-pointer"
                          >
                            Delete Offending Item
                          </button>

                          <button
                            onClick={() => handleUpdateReport(report.id, 'dismissed')}
                            className="bg-[#242424] hover:bg-[#303030] text-stone-300 px-3 py-1.5 text-xs font-mono-meta uppercase transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {previewArticle && (
        <ArticlePreviewModal
          isOpen={true}
          title={previewArticle.title}
          subtitle={previewArticle.subtitle || ''}
          category={previewArticle.category_id}
          tags={previewArticle.tags || []}
          coverImageUrl={previewArticle.cover_image_url || ''}
          videoUrl={previewArticle.video_url || ''}
          contentHtml={previewArticle.content_html}
          authorName={previewArticle.author_name || 'Ajayi-Ojo Progress'}
          readTime={previewArticle.read_time || '5 min read'}
          status={previewArticle.status}
          publishedAt={previewArticle.published_at || previewArticle.created_at}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
};
