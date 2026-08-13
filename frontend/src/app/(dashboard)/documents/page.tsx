"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, UploadCloud, Search,
  X, File, CheckCircle2, AlertCircle, Trash2,
  Globe, Link as LinkIcon
} from "lucide-react";
import { documentService } from "@/services/document.service";
import { workspaceService } from "@/services/workspace.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCrawlModalOpen, setIsCrawlModalOpen] = useState(false);

  // Dynamic State
  const [documents, setDocuments] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Deletion confirmation state ---
  const [docPendingDelete, setDocPendingDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- NEW: Extract user to check plan limits ---
  const { setAuth, accessToken, user } = useAuthStore();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedWorkspaces, fetchedDocs] = await Promise.all([
        workspaceService.getWorkspaces(),
        documentService.getDocuments()
      ]);
      setWorkspaces(fetchedWorkspaces);
      setDocuments(fetchedDocs);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load knowledge base.");
    } finally {
      setIsLoading(false);
    }
  };

  const pollData = async () => {
    try {
      const [fetchedWorkspaces, fetchedDocs] = await Promise.all([
        workspaceService.getWorkspaces(),
        documentService.getDocuments()
      ]);
      setWorkspaces(fetchedWorkspaces);
      setDocuments(fetchedDocs);
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll every 3 seconds IF there is a processing document or an active crawl
  useEffect(() => {
    const hasProcessingDocs = documents.some((doc) => doc.status === "processing");
    const hasCrawlingWorkspaces = workspaces.some(
      (ws) => ws.crawlingStatus?.status === "pending" || ws.crawlingStatus?.status === "crawling"
    );

    if (hasProcessingDocs || hasCrawlingWorkspaces) {
      const interval = setInterval(pollData, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, workspaces]);

  const filteredDocuments = documents.filter(doc => {
    const searchTarget = (doc.title || doc.fileName || doc.originalFileName || doc.sourceUrl || "").toLowerCase();
    return searchTarget.includes(searchQuery.toLowerCase());
  });

  const activeCrawls = workspaces
    .filter((ws) => ws.crawlingStatus?.status === "pending" || ws.crawlingStatus?.status === "crawling")
    .map((ws) => ({
      _id: `virtual-crawl-${ws._id}`,
      title: `Crawling Website Pages...`,
      sourceType: "webpage",
      workspace: ws._id,
      fileSizeByte: 0,
      isVirtualCrawl: true,
      pagesCrawled: ws.crawlingStatus?.pagesCrawled || 0
    }));

  const allDisplayItems = [...activeCrawls, ...filteredDocuments];

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getWorkspaceName = (workspaceId: string) => {
    if (typeof workspaceId === 'object' && workspaceId !== null) return (workspaceId as any).name;
    const ws = workspaces.find(w => w._id === workspaceId);
    return ws ? ws.name : "Unknown Workspace";
  };

  // Opens the confirmation modal instead of deleting immediately
  const requestDelete = (doc: any) => {
    setDocPendingDelete(doc);
  };

  const confirmDelete = async () => {
    if (!docPendingDelete) return;
    const doc = docPendingDelete;

    setIsDeleting(true);
    const toastId = toast.loading("Deleting document and fetching backup...");
    try {
      const response = await documentService.deleteDocument(doc._id);

      const contentDisposition = response.headers['content-disposition'];
      let filename = doc.originalFileName || doc.fileName || doc.title || "backup_document";

      if (contentDisposition && contentDisposition.includes('attachment')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      if (doc.sourceType === 'webpage' && !filename.endsWith('.txt')) {
        filename = `${filename.replace(/[^a-z0-9]/gi, '_')}.txt`;
      }

     const blob = new Blob([response.data], {
type: String(
  response.headers["content-type"] ?? "application/octet-stream"
),
});
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Document deleted. Backup downloaded securely.", { id: toastId });

      fetchData();
      const meRes = await authService.getMe();
      if (accessToken) setAuth(meRes.data, accessToken);
      setDocPendingDelete(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-8 lg:p-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white">Knowledge Base</h1>
          <p className="mt-2 text-sm text-white/40">Manage the documents and websites powering your AI Copilot.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCrawlModalOpen(true)}
            className="group flex items-center gap-2 rounded-2xl bg-white/5 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 active:scale-95"
          >
            <Globe className="h-4 w-4" />
            Crawl Website
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
          >
            <UploadCloud className="h-4 w-4" />
            Upload File
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search documents and pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-2xl bg-white/5 pl-11 pr-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-3xl bg-white/[0.02] ring-1 ring-white/[0.05] backdrop-blur-xl">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-white/40 text-sm">
            Loading knowledge base...
          </div>
        ) : allDisplayItems.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-white/40 text-sm">
            {searchQuery ? "No documents match your search." : "No documents or websites added yet."}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-white/70">
            <thead className="sticky top-0 z-10 border-b border-white/5 bg-[#070912]/80 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium text-white/40">Source Name</th>
                <th className="px-6 py-4 font-medium text-white/40">Workspace</th>
                <th className="px-6 py-4 font-medium text-white/40">Size</th>
                <th className="px-6 py-4 font-medium text-white/40">Status</th>
                <th className="px-6 py-4 text-right font-medium text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allDisplayItems.map((doc) => (
                <tr key={doc._id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                        {doc.sourceType === 'webpage' ? (
                          <Globe className={`h-4 w-4 ${doc.isVirtualCrawl ? 'text-blue-400 animate-pulse' : 'text-white'}`} />
                        ) : (
                          <FileText className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col max-w-xs">
                        <span className="font-medium text-white truncate max-w-[250px]" title={doc.title || doc.fileName || doc.originalFileName}>
                          {doc.title || doc.fileName || doc.originalFileName}
                        </span>
                        {doc.sourceType === 'webpage' && doc.sourceUrl && (
                          <span className="text-xs text-white/40 truncate max-w-[250px] flex items-center gap-1 mt-0.5">
                            <LinkIcon className="h-3 w-3" /> {doc.sourceUrl}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getWorkspaceName(doc.workspace || doc.workspaceId)}</td>
                  <td className="px-6 py-4">{formatSize(doc.fileSizeByte)}</td>
                  <td className="px-6 py-4">
                    {doc.isVirtualCrawl ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                        Crawling ({doc.pagesCrawled} pages)
                      </span>
                    ) : doc.status === 'ready' || doc.status === 'embedded' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Ready
                      </span>
                    ) : doc.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                        <AlertCircle className="h-3 w-3" /> Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" /> Processing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!doc.isVirtualCrawl && (
                      <button
                        onClick={() => requestDelete(doc)}
                        title="Delete document"
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isUploadModalOpen && (
        <UploadModal
          workspaces={workspaces}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={async () => {
            setIsUploadModalOpen(false);
            fetchData();
            const meRes = await authService.getMe();
            if (accessToken) setAuth(meRes.data, accessToken);
          }}
        />
      )}

      {isCrawlModalOpen && (
        <CrawlModal
          workspaces={workspaces}
          user={user} // Pass user state for limits
          onClose={() => setIsCrawlModalOpen(false)}
          onSuccess={async () => {
            setIsCrawlModalOpen(false);
            fetchData();
          }}
        />
      )}

      {docPendingDelete && (
        <DeleteConfirmModal
          doc={docPendingDelete}
          isDeleting={isDeleting}
          onCancel={() => !isDeleting && setDocPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

// --- Delete Confirmation Modal ---
function DeleteConfirmModal({
  doc,
  isDeleting,
  onCancel,
  onConfirm
}: {
  doc: any,
  isDeleting: boolean,
  onCancel: () => void,
  onConfirm: () => void
}) {
  const name = doc.title || doc.fileName || doc.originalFileName || "this document";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md animate-[rise_0.3s_ease-out_both] rounded-[32px] bg-white/[0.03] p-8 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">

        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute right-6 top-6 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
          <Trash2 className="h-5 w-5 text-red-400" />
        </div>

        <h2 className="mb-2 text-xl font-medium tracking-tight text-white">Delete document?</h2>
        <p className="mb-8 text-sm leading-relaxed text-white/40">
          <span className="text-white/70 font-medium">{name}</span> will be permanently removed from this workspace's knowledge base. A backup file will be downloaded before it's deleted, but this action can't be undone.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-12 flex-1 rounded-2xl bg-red-500 text-sm font-medium text-white transition-all hover:bg-red-500/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isDeleting ? "Deleting..." : "Delete Document"}
          </button>
        </div>

      </div>
    </div>
  );
}

// --- Crawl Modal Sub-Component ---
function CrawlModal({
  workspaces,
  user,
  onClose,
  onSuccess
}: {
  workspaces: any[],
  user: any,
  onClose: () => void,
  onSuccess: () => void
}) {
  const [workspaceId, setWorkspaceId] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const limits = user?.organization?.cachedLimits;
  const isCrawlingEnabled = limits ? limits.crawlingEnabled : true;
  const maxPages = limits?.maxPagesPerCrawl || 'allowed';

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl || !workspaceId) {
      toast.error("Please enter a URL and select a workspace.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Initializing web crawler...");

    try {
      await documentService.triggerWebsiteCrawl(workspaceId, sourceUrl);

      toast.success("Crawler started! Pages will appear as they are processed.", { id: loadingToast });
      onSuccess();
    } catch (err: any) {
      console.error("Crawl initialization failed:", err);
      toast.error(err.response?.data?.message || "Failed to start crawler.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg animate-[rise_0.3s_ease-out_both] rounded-[32px] bg-white/[0.03] p-8 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">

        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-6 top-6 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-medium tracking-tight text-white">Crawl Website</h2>
        <p className="mb-8 text-sm text-white/40 leading-relaxed">
          Omnix will scan this domain and extract all readable content into your Knowledge Base.
          {/* NEW: UX Warning message */}
          <br />
          <span className="text-amber-400 mt-2 block">
            ⚠️ Note: Workspaces allow one website at a time. Starting a new crawl will automatically replace any previously crawled website in this workspace.
          </span>
        </p>

        {!isCrawlingEnabled && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-400">Upgrade Required</h3>
              <p className="mt-1 text-xs text-red-400/80">
                Web crawling is not supported on your current plan. Please upgrade your plan to use this feature.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleCrawl}>
          <div className="mb-6 space-y-2">
            <label className="text-[13px] font-medium text-white/60">Target Workspace</label>
            <div className="relative">
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                disabled={isSubmitting || !isCrawlingEnabled}
                className="h-12 w-full appearance-none rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30 disabled:opacity-50 [&>option]:bg-[#0a0d16]"
              >
                <option value="" disabled>Select a workspace...</option>
                {workspaces.map(ws => (
                  <option key={ws._id} value={ws._id}>{ws.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">▼</div>
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <label className="text-[13px] font-medium text-white/60">Website URL</label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="url"
                required
                placeholder="https://www.yourdomain.com"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isSubmitting || !isCrawlingEnabled}
                className="h-12 w-full rounded-2xl bg-white/5 pl-11 pr-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-white/30 disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-white/40">
              Only pages on the exact domain will be captured (max {maxPages} pages per crawl).
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sourceUrl || !workspaceId || isSubmitting || !isCrawlingEnabled}
              className="h-12 flex-1 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:hover:bg-white disabled:active:scale-100"
            >
              {isSubmitting ? "Starting Crawler..." : "Start Crawling"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// --- Upload Modal Sub-Component ---
function UploadModal({
  workspaces,
  onClose,
  onSuccess
}: {
  workspaces: any[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !workspaceId) {
      toast.error("Please select a file and a workspace.");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading and processing document...");

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("workspaceId", workspaceId);

      await documentService.upload(formData);

      toast.success("Document uploaded successfully!", { id: loadingToast });
      setFile(null);
      onSuccess(); // Trigger parent refresh

    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload document.", { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg animate-[rise_0.3s_ease-out_both] rounded-[32px] bg-white/[0.03] p-8 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">

        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute right-6 top-6 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-medium tracking-tight text-white">Upload Knowledge</h2>
        <p className="mb-8 text-sm text-white/40">Assign a document to a workspace for vector embedding.</p>

        {/* 1. Workspace Selector */}
        <div className="mb-6 space-y-2">
          <label className="text-[13px] font-medium text-white/60">Target Workspace</label>
          <div className="relative">
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              disabled={isUploading}
              className="h-12 w-full appearance-none rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30 disabled:opacity-50 [&>option]:bg-[#0a0d16]"
            >
              <option value="" disabled>Select a workspace...</option>
              {workspaces.map(ws => (
                (ws.isActive && <option key={ws._id} value={ws._id}>{ws.name}</option>)
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              ▼
            </div>
          </div>
        </div>

        {/* 2. Drag & Drop Zone */}
        <div className="space-y-2 mb-8">
          <label className="text-[13px] font-medium text-white/60">Document File</label>

          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isUploading && inputRef.current?.click()}
              className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 transition-all ${dragActive
                ? "border-white/40 bg-white/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
                } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.csv"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition-transform group-hover:scale-110">
                <UploadCloud className="h-5 w-5 text-white/60 group-hover:text-white" />
              </div>
              <p className="text-sm font-medium text-white">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-white/40">PDF, TXT, DOCX, or CSV (Subject to plan size limits)</p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <File className="h-5 w-5 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-white/40">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                disabled={isUploading}
                className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !workspaceId || isUploading}
            className="h-12 flex-1 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:hover:bg-white disabled:active:scale-100"
          >
            {isUploading ? "Processing..." : "Upload Document"}
          </button>
        </div>

      </div>
    </div>
  );
}