import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { CustomDropdown } from './CustomDropdown';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Table as TableIcon,
  Image as ImageIcon, Video, Link as LinkIcon,
  Undo, Redo, Minus, Eye, Save, Send,
  Upload, Tag, X, Check, AlertCircle, FileText,
  PlusCircle, Trash, Globe
} from 'lucide-react';

import { DBArticle } from './database.types';
import { uploadMedia, upsertArticle } from './supabase';
import { ArticlePreviewModal } from './ArticlePreviewModal';

interface WordEditorProps {
  initialArticle?: DBArticle | null;
  onSaved: (article: DBArticle) => void;
  onCancel: () => void;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  initialArticle,
  onSaved,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || '');
  const [authorName, setAuthorName] = useState(initialArticle?.author_name || 'Ajayi-Ojo Progress');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [category, setCategory] = useState(initialArticle?.category_id || 'WORLD');
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || ['Exclusive', 'Diplomacy']);
  const [tagInput, setTagInput] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.cover_image_url || '');
  const [videoUrl, setVideoUrl] = useState(initialArticle?.video_url || '');
  const [status, setStatus] = useState<'draft' | 'published'>(initialArticle?.status === 'published' ? 'published' : 'draft');
  const [lifecycleStage, setLifecycleStage] = useState<string>(initialArticle?.lifecycle_stage || 'auto');
  const [activeMobileEditorTab, setActiveMobileEditorTab] = useState<'content' | 'metadata'>('content');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const editorVideoInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!initialArticle) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#E50914] underline hover:text-[#C40711]' },
      }),
      Youtube.configure({ inline: false, controls: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Compose your authoritative journalistic dispatch here...',
      }),
    ],
    content: initialArticle?.content_html || '<p>Start drafting your dispatch here...</p>',
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror min-h-[500px] p-6 focus:outline-none text-stone-200 font-sans-body',
      },
    },
  });

  // Sync content when initialArticle changes
  useEffect(() => {
    if (initialArticle) {
      setTitle(initialArticle.title || '');
      setSubtitle(initialArticle.subtitle || '');
      setSlug(initialArticle.slug || '');
      setCategory(initialArticle.category_id || 'WORLD');
      setTags(initialArticle.tags || ['Exclusive', 'Diplomacy']);
      setCoverImageUrl(initialArticle.cover_image_url || '');
      setVideoUrl(initialArticle.video_url || '');
      setStatus(initialArticle.status === 'published' ? 'published' : 'draft');
      if (editor && initialArticle.content_html) {
        editor.commands.setContent(initialArticle.content_html);
      }
    }
  }, [initialArticle?.id, editor]);

  const [wordCount, setWordCount] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const updateStats = () => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    };
    editor.on('update', updateStats);
    updateStats();
    return () => {
      editor.off('update', updateStats);
    };
  }, [editor]);

  const readTimeEstimate = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const publicUrl = await uploadMedia(file, 'covers');
      setCoverImageUrl(publicUrl);
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploadingImage(true);
    try {
      const publicUrl = await uploadMedia(file, 'editor-images');
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch (err: any) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertImageUrl = () => {
    if (!editor) return;
    const url = prompt('Enter Direct Image URL (https://...):');
    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url.trim(), alt: 'Dispatch Artwork' }).run();
    }
  };

  const handleEditorVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploadingVideo(true);
    try {
      const publicUrl = await uploadMedia(file, 'editor-videos');
      editor.commands.insertContent(
        `<div class="my-4 aspect-video rounded-xs overflow-hidden border border-[#333]"><video controls class="w-full h-full" src="${publicUrl}"></video></div>`
      );
    } catch (err: any) {
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleInsertVideoUrl = () => {
    if (!editor) return;
    const url = prompt('Enter MP4 / WebM Video URL:');
    if (url && url.trim()) {
      editor.commands.insertContent(
        `<div class="my-4 aspect-video rounded-xs overflow-hidden border border-[#333]"><video controls class="w-full h-full" src="${url.trim()}"></video></div>`
      );
    }
  };

  const handleInsertYoutube = () => {
    const url = prompt('Enter YouTube Video URL (e.g. https://www.youtube.com/watch?v=...):');
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url.trim() });
    }
  };

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter Destination URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Article headline title is required.' });
      return;
    }
    if (!editor) return;

    setSaving(true);
    setFeedback(null);

    try {
      const contentHtml = editor.getHTML();
      const savedArticle = await upsertArticle({
        id: initialArticle?.id,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: slug.trim() || `dispatch-${Date.now()}`,
        category_id: category,
        tags,
        cover_image_url: coverImageUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        content_html: contentHtml,
        status: targetStatus,
        author_name: authorName.trim() || 'Ajayi-Ojo Progress',
        read_time: readTimeEstimate,
        lifecycle_stage: lifecycleStage,
        published_at: targetStatus === 'published' ? (initialArticle?.published_at || new Date().toISOString()) : null,
      });

      setStatus(targetStatus);
      setFeedback({
        type: 'success',
        message: targetStatus === 'published' ? 'Dispatch successfully published live!' : 'Draft saved to editorial archive.',
      });

      setTimeout(() => {
        onSaved(savedArticle);
      }, 700);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save article.' });
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    'WORLD', 'POLITICS', 'FINANCE', 'TECHNOLOGY', 'SCIENCE', 'EDUCATION',
    'LIFESTYLE', 'FASHION', 'CELEBRITY', 'SPORT', 'PODCASTS'
  ];

  const isTableActive = editor?.isActive('table');

  return (
    <div className="w-full bg-[#121212] min-h-screen text-stone-200 pb-20 font-sans-body">
      <div className="sticky top-0 z-40 bg-[#161616] border-b border-[#282828] px-4 sm:px-8 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="bg-[#E50914] text-white font-masthead font-black text-xs px-2.5 py-1">
            EDITORIAL DESK
          </span>
          <span className="font-mono-meta text-xs text-stone-400 hidden sm:inline">
            {initialArticle ? 'EDITING DISPATCH' : 'NEW DISPATCH COMPOSITION'}
          </span>
          <span
            className={`text-[10px] font-mono-meta font-bold uppercase px-2 py-0.5 rounded-xs ${
              status === 'published' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 font-mono-meta text-xs uppercase text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#2C2C2C] text-stone-300 hover:text-white rounded-xs font-mono-meta text-xs uppercase font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#E50914]" />
            <span>PREVIEW</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-stone-200 rounded-xs font-mono-meta text-xs uppercase font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE DRAFT</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E50914] hover:bg-[#C40711] text-white rounded-xs font-mono-meta text-xs uppercase font-bold tracking-wider transition-colors disabled:opacity-50 shadow-md cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? 'PUBLISHING...' : 'PUBLISH'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 mt-4">
          <div
            className={`p-3 text-xs font-mono-meta flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-red-950/60 border-red-700 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 mt-6">
        {/* Mobile View Switcher (Visible on <1024px screens) */}
        <div className="lg:hidden flex items-center bg-[#181818] border border-[#2E2E2E] p-1 rounded-xs mb-5">
          <button
            type="button"
            onClick={() => setActiveMobileEditorTab('content')}
            className={`flex-1 py-2 text-xs font-mono-meta font-bold rounded-xs transition-colors cursor-pointer ${
              activeMobileEditorTab === 'content'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            DISPATCH CONTENT
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileEditorTab('metadata')}
            className={`flex-1 py-2 text-xs font-mono-meta font-bold rounded-xs transition-colors cursor-pointer ${
              activeMobileEditorTab === 'metadata'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            METADATA & DECAY ({category})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className={`space-y-4 lg:col-span-8 ${activeMobileEditorTab === 'content' ? 'block' : 'hidden lg:block'}`}>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Headline Dispatch Title..."
            className="w-full bg-[#181818] border border-[#2E2E2E] text-white p-4 font-editorial text-2xl sm:text-4xl font-bold focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 transition-colors shadow-inner"
          />

          <textarea
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Editorial sub-headline summary or key thesis..."
            className="w-full bg-[#181818] border border-[#2E2E2E] text-stone-200 p-3 font-editorial italic text-base sm:text-lg focus:border-[#E50914] focus:outline-none placeholder:text-stone-600 resize-none transition-colors shadow-inner"
          />

          {editor && (
            <div className="bg-[#1C1C1C] border border-[#303030] p-2 flex flex-col gap-1.5 text-stone-300 rounded-t-xs shadow-md">
              {/* Main Formatting Toolbar (Touch Scrollable on Mobile) */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 scrollbar-none">
                {/* Paragraph / Heading Selector */}
                <CustomDropdown
                  value={
                    editor.isActive('heading', { level: 1 })
                      ? 'h1'
                      : editor.isActive('heading', { level: 2 })
                      ? 'h2'
                      : editor.isActive('heading', { level: 3 })
                      ? 'h3'
                      : 'p'
                  }
                  onChange={(val) => {
                    if (val === 'p') editor.chain().focus().setParagraph().run();
                    else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                    else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                    else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
                  }}
                  options={[
                    { value: 'p', label: 'Paragraph' },
                    { value: 'h1', label: 'Heading 1 (Lead)' },
                    { value: 'h2', label: 'Heading 2 (Section)' },
                    { value: 'h3', label: 'Heading 3 (Subhead)' },
                  ]}
                  className="w-40"
                />

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* Text Styling */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-[#E50914] text-white font-black' : 'hover:bg-[#2A2A2A]'}`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('underline') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Underline (Ctrl+U)"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('highlight') ? 'bg-amber-400 text-black font-bold' : 'hover:bg-[#2A2A2A]'}`}
                  title="Highlight Marker"
                >
                  <Highlighter className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('code') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* Alignment */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive({ textAlign: 'justify' }) ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* Lists & Quotes */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('blockquote') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Editorial Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  className="p-1.5 rounded-xs hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  title="Horizontal Divider"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* Table Tool */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (isTableActive) {
                      editor.chain().focus().deleteTable().run();
                    } else {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    }
                  }}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${isTableActive ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title={isTableActive ? 'Delete Table' : 'Insert 3x3 Table'}
                >
                  <TableIcon className="w-4 h-4" />
                </button>

                {/* Hyperlink */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSetLink}
                  className={`p-1.5 rounded-xs transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-[#E50914] text-white' : 'hover:bg-[#2A2A2A]'}`}
                  title="Add or Edit Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* Image Insertion: File Upload & URL */}
                <div className="flex items-center gap-1 bg-[#242424] p-0.5 rounded-xs">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={uploadingImage}
                    onClick={() => editorImageInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-[#333] text-stone-200 rounded-xs text-xs font-mono-meta transition-colors cursor-pointer"
                    title="Upload image from computer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Picture'}</span>
                  </button>
                  <input
                    ref={editorImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditorImageUpload}
                  />

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleInsertImageUrl}
                    className="px-1.5 py-1 hover:bg-[#333] text-stone-400 hover:text-white rounded-xs text-[11px] font-mono-meta transition-colors cursor-pointer"
                    title="Insert image from web URL"
                  >
                    URL
                  </button>
                </div>

                {/* Video Insertion: File Upload & URL */}
                <div className="flex items-center gap-1 bg-[#242424] p-0.5 rounded-xs">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={uploadingVideo}
                    onClick={() => editorVideoInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-[#333] text-stone-200 rounded-xs text-xs font-mono-meta transition-colors cursor-pointer"
                    title="Upload video from computer"
                  >
                    <Video className="w-3.5 h-3.5 text-[#E50914]" />
                    <span>{uploadingVideo ? 'Uploading...' : 'Video'}</span>
                  </button>
                  <input
                    ref={editorVideoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleEditorVideoUpload}
                  />

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleInsertVideoUrl}
                    className="px-1.5 py-1 hover:bg-[#333] text-stone-400 hover:text-white rounded-xs text-[11px] font-mono-meta transition-colors cursor-pointer"
                    title="Insert MP4 / WebM video link"
                  >
                    URL
                  </button>
                </div>

                {/* YouTube Video Embed */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleInsertYoutube}
                  className="px-2 py-1 bg-[#242424] hover:bg-[#333] text-stone-200 rounded-xs text-xs font-mono-meta transition-colors cursor-pointer"
                  title="Embed YouTube Video"
                >
                  YouTube
                </button>

                <div className="w-[1px] h-5 bg-[#333] mx-1" />

                {/* History: Undo / Redo */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().undo().run()}
                  className="p-1.5 rounded-xs hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().redo().run()}
                  className="p-1.5 rounded-xs hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>

              {/* Contextual Table Controls when inside a table */}
              {isTableActive && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#2A2A2A] text-xs font-mono-meta text-stone-300">
                  <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mr-1">Table Tools:</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-stone-200 rounded-xs hover:text-white"
                  >
                    + Row Above
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-stone-200 rounded-xs hover:text-white"
                  >
                    + Row Below
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-rose-300 rounded-xs hover:text-rose-200"
                  >
                    - Delete Row
                  </button>
                  <span className="text-[#444]">|</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-stone-200 rounded-xs hover:text-white"
                  >
                    + Col Left
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-stone-200 rounded-xs hover:text-white"
                  >
                    + Col Right
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="px-2 py-1 bg-[#282828] hover:bg-[#333] text-rose-300 rounded-xs hover:text-rose-200"
                  >
                    - Delete Col
                  </button>
                  <span className="text-[#444]">|</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="px-2 py-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 rounded-xs"
                  >
                    Delete Table
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#181818] border border-[#2E2E2E] rounded-b-xs shadow-inner">
            <EditorContent editor={editor} />
          </div>

          <div className="flex items-center justify-between text-xs font-mono-meta text-stone-400 px-3 py-2 bg-[#161616] border border-[#282828]">
            <span>WORDS: {wordCount} &bull; READ TIME: {readTimeEstimate}</span>
            <span>AUTOSAVE BUFFER ACTIVE</span>
          </div>
        </div>

        <div className={`space-y-6 lg:col-span-4 ${activeMobileEditorTab === 'metadata' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
              <span>Author Byline</span>
              <span className="text-[10px] text-stone-500 font-normal">Customizable</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Ajayi-Ojo Progress"
              className="w-full bg-[#141414] border border-[#333] text-stone-200 p-2.5 text-xs font-mono-meta rounded-xs focus:border-[#E50914] focus:outline-none"
            />
          </div>

          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold">
              Dispatch Category
            </label>
            <CustomDropdown
              value={category}
              onChange={setCategory}
              options={categories}
              className="w-full"
            />
          </div>

          {/* Dynamic Publication Lifecycle & Decay Stage */}
          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold flex items-center justify-between">
              <span>Lifecycle Status</span>
              <span className="text-[10px] text-[#E50914] font-normal">Decay Pipeline</span>
            </label>
            <CustomDropdown
              value={lifecycleStage}
              onChange={setLifecycleStage}
              options={[
                { value: 'auto', label: 'Auto (0-6h Breaking → Headline → Developing → Regular → Archived)' },
                { value: 'breaking', label: 'Pin to Breaking News (0–6h Highest Visibility)' },
                { value: 'headline', label: 'Pin to Daily Headline (6–24h Prominent)' },
                { value: 'developing', label: 'Pin to Developing Story (24–48h)' },
                { value: 'regular', label: 'Set as Regular Feed Post (48–72h)' },
                { value: 'archived', label: 'Move directly to Archive (72h+)' },
              ]}
              className="w-full"
            />
            <p className="text-[11px] text-stone-500 font-sans-body mt-2 leading-relaxed">
              Auto mode migrates the dispatch dynamically: 0–6h (Breaking), 6–24h (Headline), 24–48h (Developing), 48–72h (Regular Feed), 72h+ (Standard Archive).
            </p>
          </div>

          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold">
              Cover Lead Image
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="Image URL (https://...)"
                className="w-full bg-[#141414] border border-[#333] text-stone-200 p-2.5 text-xs font-mono-meta rounded-xs focus:border-[#E50914] focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverImageInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-stone-200 text-xs font-mono-meta rounded-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>{uploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                </button>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>

              {coverImageUrl && (
                <div className="aspect-video w-full rounded-xs overflow-hidden border border-[#333] relative group">
                  <img
                    src={coverImageUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/og-image.png';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#E50914]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold">
              Dispatch Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
                className="flex-1 bg-[#141414] border border-[#333] text-stone-200 p-2 text-xs font-mono-meta rounded-xs focus:border-[#E50914] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-[#252525] hover:bg-[#303030] text-white text-xs font-mono-meta rounded-xs transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#222] border border-[#333] text-stone-300 text-xs font-mono-meta rounded-xs"
                >
                  <Tag className="w-3 h-3 text-[#E50914]" />
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-stone-500 hover:text-white ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#181818] border border-[#2E2E2E] p-5 shadow-lg">
            <label className="block text-xs font-mono-meta text-stone-300 uppercase tracking-wider mb-2 font-bold">
              Canonical URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-[#141414] border border-[#333] text-stone-400 p-2 text-xs font-mono-meta rounded-xs focus:border-[#E50914] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>

      {isPreviewOpen && (
        <ArticlePreviewModal
          isOpen={true}
          title={title}
          subtitle={subtitle}
          category={category}
          tags={tags}
          coverImageUrl={coverImageUrl}
          videoUrl={videoUrl}
          contentHtml={editor?.getHTML() || ''}
          authorName={authorName.trim() || 'Ajayi-Ojo Progress'}
          readTime={readTimeEstimate}
          status={status}
          publishedAt={initialArticle?.published_at}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
};
