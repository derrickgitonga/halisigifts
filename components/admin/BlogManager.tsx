"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { generateSlug } from "@/lib/slug";

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BlogManagerProps {
  onNotify?: (message: string, type: "success" | "error") => void;
}

export default function BlogManager({ onNotify }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("Halisi Gifts Team");
  const [published, setPublished] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    if (onNotify) {
      onNotify(msg, type);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        if (data.stats) setStats(data.stats);
      } else {
        notify(data.error || "Failed to load blogs", "error");
      }
    } catch {
      notify("Network error while loading blogs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts();
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setTags("");
    setAuthor("Halisi Gifts Team");
    setPublished(false);
    setEditingPostId(null);
    setEditorMode("visual");
    setShowSettings(false);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = "";
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const openEditModal = (post: BlogPostItem) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setCoverImage(post.coverImage || "");
    setTags((post.tags || []).join(", "));
    setAuthor(post.author || "Halisi Gifts Team");
    setPublished(post.published);
    setIsEditorOpen(true);
    setEditorMode("visual");
    setShowSettings(false);

    setTimeout(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = post.content || "";
      }
    }, 40);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPostId) {
      setSlug(generateSlug(val));
    }
  };

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setContent(visualEditorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorMode !== "visual") return;
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
      setContent(visualEditorRef.current.innerHTML);
    }
  };

  const applyFormatBlock = (tag: string) => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  const handleAddLink = () => {
    const url = prompt("Enter link URL (e.g. https://... or /category/...):");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    notify(data.error || "Upload failed", "error");
    return null;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCover(true);
    try {
      const url = await uploadFile(files[0]);
      if (url) {
        setCoverImage(url);
        notify("Cover image uploaded");
      }
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  const insertImageHtml = (url: string) => {
    const imgHtml = `<figure class="my-5"><img src="${url}" alt="Article photo" class="w-full rounded-2xl object-cover shadow-sm max-h-[500px]" /><figcaption class="text-xs text-center text-gray-500 mt-2">Halisi Gifts Shop</figcaption></figure><p><br></p>`;
    if (editorMode === "visual" && visualEditorRef.current) {
      visualEditorRef.current.focus();
      document.execCommand("insertHTML", false, imgHtml);
      setContent(visualEditorRef.current.innerHTML);
    } else {
      setContent((prev) => prev + "\n" + imgHtml);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const url = await uploadFile(files[0]);
      if (url) {
        insertImageHtml(url);
        notify("Photo inserted into article");
      }
    } finally {
      setUploadingImage(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setUploadingImage(true);
        try {
          const url = await uploadFile(file);
          if (url) {
            insertImageHtml(url);
            notify("Photo uploaded and inserted");
          }
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        setUploadingImage(true);
        try {
          const url = await uploadFile(file);
          if (url) {
            insertImageHtml(url);
            notify("Pasted photo inserted");
          }
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const finalContent = editorMode === "visual" && visualEditorRef.current
      ? visualEditorRef.current.innerHTML.trim()
      : content.trim();

    if (!cleanTitle) {
      notify("Please provide a title for the blog post", "error");
      return;
    }

    if (!finalContent || finalContent === "<p><br></p>") {
      notify("Article content cannot be empty", "error");
      return;
    }

    setSaving(true);
    try {
      const extractedCover = finalContent.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || null;
      const payload = {
        title: cleanTitle,
        slug: slug.trim() || generateSlug(cleanTitle),
        excerpt: excerpt.trim() || null,
        content: finalContent,
        coverImage: coverImage.trim() || extractedCover || null,
        author: author.trim() || "Halisi Gifts Team",
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        published,
      };

      const endpoint = editingPostId ? `/api/admin/blogs/${editingPostId}` : "/api/admin/blogs";
      const method = editingPostId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        notify(editingPostId ? "Blog post updated successfully" : "Blog post created successfully");
        setIsEditorOpen(false);
        resetForm();
        loadPosts();
      } else {
        notify(data.error || "Failed to save blog post", "error");
      }
    } catch {
      notify("Error saving blog post", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (post: BlogPostItem) => {
    setTogglingId(post.id);
    const newStatus = !post.published;
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, published: newStatus } : p))
        );
        setStats((prev) => ({
          ...prev,
          published: newStatus ? prev.published + 1 : prev.published - 1,
          drafts: newStatus ? prev.drafts - 1 : prev.drafts + 1,
        }));
        notify(`Post is now ${newStatus ? "published" : "in draft"}`);
      } else {
        notify(data.error || "Failed to toggle status", "error");
      }
    } catch {
      notify("Error updating status", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (post: BlogPostItem) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(post.id);
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setStats((prev) => ({
          total: prev.total - 1,
          published: post.published ? prev.published - 1 : prev.published,
          drafts: !post.published ? prev.drafts - 1 : prev.drafts,
        }));
        notify("Blog post deleted successfully");
      } else {
        notify(data.error || "Failed to delete post", "error");
      }
    } catch {
      notify("Error deleting blog post", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const rawText = content.replace(/<[^>]*>/g, " ").trim();
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeEstimate = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1B1C1C]">Blog &amp; Gift Guides Manager</h2>
          <p className="text-xs text-black/60 mt-1">
            Write articles with side by side live preview, headers, bold text, bullet lists, and embedded images.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#266e00] hover:bg-[#1b4f00] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Write New Blog Post
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            statusFilter === "all" ? "border-[#266e00] ring-2 ring-[#266e00]/20" : "border-black/10 hover:border-black/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-black/50 block">All Articles</span>
          <span className="text-2xl font-serif font-bold text-[#1B1C1C] mt-1 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter("published")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            statusFilter === "published" ? "border-emerald-600 ring-2 ring-emerald-600/20" : "border-black/10 hover:border-black/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">Published</span>
          <span className="text-2xl font-serif font-bold text-emerald-700 mt-1 block">{stats.published}</span>
        </div>

        <div
          onClick={() => setStatusFilter("draft")}
          className={`cursor-pointer bg-white p-4 rounded-xl border transition-all ${
            statusFilter === "draft" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-black/10 hover:border-black/20"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">Drafts</span>
          <span className="text-2xl font-serif font-bold text-amber-700 mt-1 block">{stats.drafts}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-black/15 rounded-lg focus:outline-none focus:border-[#266e00]"
          />
          <svg className="w-4 h-4 text-black/40 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="text-xs font-semibold text-black/70 hover:text-[#266e00] inline-flex items-center gap-1.5 px-3 py-2 border border-black/15 rounded-lg bg-gray-50"
          >
            <span>Preview Public Blog Page</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-xs text-black/50">Loading blog articles...</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-black">No blog posts found</p>
            <p className="text-xs text-black/50 mt-1">Get started by creating your first article or gift guide.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#266e00] text-white text-xs font-semibold rounded-lg hover:bg-[#1b4f00] transition-colors"
            >
              Write First Post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-black/[0.01] transition-colors"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative border border-black/10">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-medium">
                        No cover
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          post.published
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                      <span className="text-[11px] text-black/40">
                        {new Date(post.createdAt).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#1B1C1C] mt-1 truncate">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-xs text-black/60 mt-1 line-clamp-1">{post.excerpt}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-mono text-gray-500">/blog/{post.slug}</span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="hidden md:flex items-center gap-1">
                          {post.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {post.published && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="p-2 text-gray-600 hover:text-[#266e00] border border-black/10 rounded-lg hover:border-[#266e00]/30 transition-colors"
                      title="View Live Article"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  )}

                  <button
                    type="button"
                    disabled={togglingId === post.id}
                    onClick={() => handleTogglePublished(post)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-black/15 bg-white hover:bg-gray-50 text-black/80 transition-colors"
                  >
                    {togglingId === post.id
                      ? "Updating..."
                      : post.published
                      ? "Unpublish"
                      : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(post)}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-black text-white rounded-lg transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === post.id}
                    onClick={() => handleDelete(post)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Post"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-[1540px] h-[94vh] rounded-2xl shadow-2xl border border-black/15 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/10 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Post Title (e.g. Best Luxury Watch Gift Ideas in Kenya)..."
                  className="w-full text-base sm:text-lg font-serif font-bold text-black border-none focus:outline-none focus:ring-0 placeholder:text-gray-400 placeholder:font-sans"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <input
                  type="file"
                  ref={coverFileInputRef}
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#266e00]/30 bg-[#266e00]/10 hover:bg-[#266e00]/20 text-[#266e00] transition-colors inline-flex items-center gap-1.5"
                  title="Upload Cover Photo"
                >
                  <svg className="w-3.5 h-3.5 text-[#266e00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{uploadingCover ? "Uploading..." : coverImage ? "Cover Added" : "Cover Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                    showSettings ? "bg-black text-white border-black" : "bg-gray-100 hover:bg-gray-200 text-black border-black/10"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Post Settings</span>
                </button>

                <label className="hidden sm:flex items-center gap-1.5 text-xs text-black font-semibold cursor-pointer pl-1 pr-2">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="w-4 h-4 text-[#266e00] rounded border-black/20 focus:ring-[#266e00]"
                  />
                  <span>Published</span>
                </label>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-4 sm:px-5 py-2 bg-[#266e00] hover:bg-[#1b4f00] text-white text-xs font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap"
                >
                  {saving ? "Saving..." : editingPostId ? "Save Changes" : "Publish Post"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-black/50 hover:text-black hover:bg-black/5"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {showSettings && (
              <div className="bg-gray-50 border-b border-black/10 p-4 sm:p-5 flex-shrink-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      URL Slug
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="article-slug"
                        className="flex-1 px-3 py-1.5 text-xs font-mono border border-black/15 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setSlug(generateSlug(title))}
                        className="px-2 py-1 text-[11px] text-[#266e00] font-semibold border border-[#266e00]/20 bg-white rounded-lg hover:bg-emerald-50"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Halisi Gifts Team"
                      className="w-full px-3 py-1.5 text-xs border border-black/15 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Luxury Watches, Gift Sets, Perfumes"
                      className="w-full px-3 py-1.5 text-xs border border-black/15 rounded-lg bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                      Cover Photo
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={uploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-black/15 rounded-lg hover:bg-gray-100 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{uploadingCover ? "Uploading..." : coverImage ? "Replace" : "Upload"}</span>
                      </button>

                      {coverImage && (
                        <button
                          type="button"
                          onClick={() => setCoverImage("")}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-black uppercase tracking-wider block">
                    Short Excerpt / Summary
                  </label>
                  <input
                    type="text"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief 1-2 sentence summary shown on blog preview cards and search engines..."
                    className="w-full px-3 py-1.5 text-xs border border-black/15 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/10 min-h-0 overflow-hidden">
              <div className="flex flex-col h-full bg-white overflow-hidden">
                <div className="px-3 py-2 bg-gray-50/90 border-b border-black/10 flex flex-wrap items-center justify-between gap-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => executeCommand("bold")}
                        className="w-8 h-8 font-bold text-xs hover:bg-gray-100 flex items-center justify-center transition-colors text-black"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("italic")}
                        className="w-8 h-8 italic font-serif text-xs hover:bg-gray-100 flex items-center justify-center transition-colors text-black border-l border-black/10"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("underline")}
                        className="w-8 h-8 underline text-xs hover:bg-gray-100 flex items-center justify-center transition-colors text-black border-l border-black/10"
                        title="Underline"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("strikeThrough")}
                        className="w-8 h-8 line-through text-xs hover:bg-gray-100 flex items-center justify-center transition-colors text-black border-l border-black/10"
                        title="Strikethrough"
                      >
                        S
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => applyFormatBlock("h2")}
                        className="px-2.5 h-8 text-xs font-bold hover:bg-gray-100 flex items-center justify-center text-black"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatBlock("h3")}
                        className="px-2.5 h-8 text-xs font-bold hover:bg-gray-100 flex items-center justify-center text-black border-l border-black/10"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatBlock("p")}
                        className="px-2.5 h-8 text-xs hover:bg-gray-100 flex items-center justify-center text-gray-700 border-l border-black/10"
                        title="Normal Paragraph"
                      >
                        P
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => executeCommand("insertUnorderedList")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-black"
                        title="Bullet List"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("insertOrderedList")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-black border-l border-black/10 text-xs font-semibold"
                        title="Numbered List"
                      >
                        1.
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatBlock("blockquote")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-black border-l border-black/10 font-serif font-bold text-sm"
                        title="Quote"
                      >
                        &ldquo;
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden shadow-2xs">
                      <input
                        type="file"
                        ref={inlineImageInputRef}
                        accept="image/*"
                        onChange={handleInlineImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => inlineImageInputRef.current?.click()}
                        className="px-2.5 h-8 hover:bg-emerald-50 text-emerald-800 flex items-center gap-1.5 text-xs font-semibold"
                        title="Insert Photo Media into Post"
                      >
                        <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{uploadingImage ? "Uploading..." : "Photo"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-black border-l border-black/10"
                        title="Insert Hyperlink"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center bg-white border border-black/15 rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => executeCommand("undo")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-700"
                        title="Undo"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a5 5 0 015 5v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("redo")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-700 border-l border-black/10"
                        title="Redo"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10H11a5 5 0 00-5 5v2m15-7l-6 6m6-6l-6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeCommand("removeFormat")}
                        className="w-8 h-8 hover:bg-gray-100 flex items-center justify-center text-gray-700 border-l border-black/10 text-xs"
                        title="Clear Formatting"
                      >
                        Tx
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-black/50 font-medium">
                      {wordCount} words
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (editorMode === "visual" && visualEditorRef.current) {
                          setContent(visualEditorRef.current.innerHTML);
                        } else if (editorMode === "html" && visualEditorRef.current) {
                          visualEditorRef.current.innerHTML = content;
                        }
                        setEditorMode(editorMode === "visual" ? "html" : "visual");
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-gray-700 hover:text-black border border-black/10 rounded bg-white"
                    >
                      {editorMode === "visual" ? "HTML" : "Visual"}
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 overflow-y-auto p-5 sm:p-7 relative cursor-text"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onPaste={handlePaste}
                >
                  {editorMode === "visual" ? (
                    <div
                      ref={visualEditorRef}
                      contentEditable
                      onInput={handleVisualInput}
                      className="w-full h-full min-h-[420px] focus:outline-none text-base leading-relaxed text-black/90 blog-article-content"
                      data-placeholder="Write here... Type your article, add headers with H2/H3, bold key points, bullet lists, or drag and drop photos directly onto this space."
                    />
                  ) : (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write HTML content here..."
                      className="w-full h-full min-h-[420px] font-mono text-xs border-none focus:outline-none focus:ring-0 resize-none"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full bg-[#FDFBF7] overflow-hidden">
                <div className="px-5 py-3 border-b border-black/10 flex items-center justify-between bg-white flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-black">
                      Live Article Preview
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-black/10">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`p-1.5 rounded-md transition-colors ${
                        previewDevice === "desktop" ? "bg-white text-black shadow-2xs" : "text-gray-500 hover:text-black"
                      }`}
                      title="Desktop View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`p-1.5 rounded-md transition-colors ${
                        previewDevice === "mobile" ? "bg-white text-black shadow-2xs" : "text-gray-500 hover:text-black"
                      }`}
                      title="Mobile View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
                  <div
                    className={`transition-all duration-300 w-full ${
                      previewDevice === "mobile"
                        ? "max-w-[390px] bg-white rounded-3xl shadow-xl border-4 border-gray-800 p-5 my-2"
                        : "max-w-2xl bg-white rounded-2xl shadow-sm border border-black/10 p-6 sm:p-8"
                    }`}
                  >
                    <div className="space-y-3 pb-4 border-b border-black/10 mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#266e00] font-bold text-xs flex items-center justify-center flex-shrink-0">
                          HG
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black leading-none">{author}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date().toLocaleDateString("en-KE", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            • {readTimeEstimate} min read
                          </p>
                        </div>
                      </div>

                      <h1 className="text-xl sm:text-2xl font-serif font-bold text-black leading-snug">
                        {title.trim() ? title : "Your Article Title Will Appear Here"}
                      </h1>

                      {excerpt && (
                        <p className="text-xs text-black/70 leading-relaxed font-normal">
                          {excerpt}
                        </p>
                      )}

                      {coverImage && (
                        <div className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden mt-3 border border-black/10">
                          <Image
                            src={coverImage}
                            alt="Cover preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                        </div>
                      )}
                    </div>

                    {content.trim() && content !== "<p><br></p>" ? (
                      <div
                        className="blog-article-content text-xs sm:text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    ) : (
                      <div className="py-12 text-center text-gray-400 space-y-2">
                        <p className="text-xs font-medium">Start writing and your post will appear here..</p>
                        <p className="text-[11px] text-gray-400">
                          You can add headings, bold text, bullet points, links, and embedded photos.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
