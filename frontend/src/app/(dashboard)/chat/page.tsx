"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  MessageSquare, ArrowRight, ExternalLink, Bot, User as UserIcon, AlertTriangle,
  Check,
  ChevronDown,
  Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { chatService } from "@/services/chat.service";
import ReactMarkdown from "react-markdown";

import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import { useChatStore } from "@/store/useChatStore";
import { SPRING } from "@/components/ui/formInput";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

type Citation = {
  id: string;
  title: string;
  type: "file" | "webpage";
  url: string | null;
};

type Message = {
  id: string | number;
  role: "user" | "ai";
  content: string;
  citations?: Citation[];
  createdAt?: string;
};

const MESSAGE_PAGE_SIZE = 30;

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const { activeSessionId, setActiveSessionId, activeWorkspaceId, setActiveWorkspaceId } = useChatStore();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceRendered, setWorkspaceRendered] = useState(false);

  // --- pagination state for older messages ---
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // used to preserve scroll position when we prepend older messages
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);

  const openWorkspace = () => {
    setWorkspaceRendered(true);
    requestAnimationFrame(() => setWorkspaceOpen(true));
  };

  const closeWorkspace = () => {
    setWorkspaceOpen(false);
    setTimeout(() => setWorkspaceRendered(false), 400);
  };

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await workspaceService.getWorkspaces();
        setWorkspaces(data);
        if (data.length > 0) {
          setActiveWorkspaceId(data[0]._id);
        }
      } catch {
        toast.error("Failed to load workspaces.");
      }
    };
    fetchWorkspaces();
  }, [setActiveWorkspaceId]);

  // --- initial session load: fetch the most recent page of messages ---
  useEffect(() => {
    const loadSession = async () => {
      if (!activeSessionId) {
        const ws = workspaces.find(w => w._id === activeWorkspaceId);
        setMessages([{
          id: "init",
          role: "ai",
          content: `Hello ${user?.name || ''}! I am the Copilot for ${ws?.name || 'this workspace'}. How can I help you today?`
        }]);
        setHasMoreOlder(false);
        setOldestCursor(null);
        return;
      }

      try {
        setInitialLoading(true);
        setHasMoreOlder(false);
        setOldestCursor(null);

        const result = await chatService.getSessionMessages(activeSessionId, {
          limit: MESSAGE_PAGE_SIZE,
        });

        const formattedMessages: Message[] = result.data.map((msg: any) => ({
          id: msg.id ?? msg._id,
          role: msg.role === "assistant" ? "ai" : msg.role,
          content: msg.content,
          citations: msg.metadata?.citations ?? msg.citations ?? [],
          createdAt: msg.createdAt,
        }));

        setMessages(formattedMessages);
        setHasMoreOlder(result.meta.hasMore);
        setOldestCursor(result.meta.nextCursor);
      } catch {
        toast.error("Failed to load conversation history.");
        setActiveSessionId(null);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSession();
  }, [activeSessionId, activeWorkspaceId, workspaces, user, setActiveSessionId]);

  // --- load older messages when the top sentinel comes into view ---
  const loadOlderMessages = useCallback(async () => {
    if (!activeSessionId || !oldestCursor || isLoadingOlder) return;

    const container = scrollContainerRef.current;
    if (container) {
      preserveScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }

    setIsLoadingOlder(true);
    try {
      const result = await chatService.getSessionMessages(activeSessionId, {
        limit: MESSAGE_PAGE_SIZE,
        before: oldestCursor,
      });

      const olderMessages: Message[] = result.data.map((msg: any) => ({
        id: msg.id ?? msg._id,
        role: msg.role === "assistant" ? "ai" : msg.role,
        content: msg.content,
        citations: msg.metadata?.citations ?? msg.citations ?? [],
        createdAt: msg.createdAt,
      }));

      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMoreOlder(result.meta.hasMore);
      setOldestCursor(result.meta.nextCursor);
    } catch {
      toast.error("Failed to load earlier messages.");
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeSessionId, oldestCursor, isLoadingOlder]);

  const topSentinelRef = useInfiniteScroll({
    onLoadMore: loadOlderMessages,
    hasMore: hasMoreOlder,
    isLoading: isLoadingOlder,
    root: scrollContainerRef.current,
    rootMargin: "60px",
  });

  // restore scroll position right after older messages are prepended,
  // so the viewport doesn't visually jump
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const preserved = preserveScrollRef.current;
    if (!container || !preserved) return;

    const newHeight = container.scrollHeight;
    container.scrollTop = newHeight - preserved.height + preserved.top;
    preserveScrollRef.current = null;
  }, [messages]);

  // Auto-scroll to bottom for new messages / typing, not on older-message loads
  useEffect(() => {
    if (isLoadingOlder || preserveScrollRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isTyping]);

  // Auto-scroll to bottom once the initial message page has finished loading.
  useEffect(() => {
    if (initialLoading) return;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    });
  }, [initialLoading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceRendered &&
        workspaceRef.current &&
        !workspaceRef.current.contains(event.target as Node)
      ) {
        closeWorkspace();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [workspaceRendered]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeWorkspaceId) return;

    const userMessageContent = prompt;

    const newUserMsg: Message = { id: Date.now(), role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, newUserMsg]);
    setPrompt("");
    setIsTyping(true);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const response = await chatService.sendMessage({
        workspaceId: activeWorkspaceId,
        content: userMessageContent,
        sessionId: activeSessionId
      });

      if (!activeSessionId && response.sessionId) {
        setActiveSessionId(response.sessionId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: response.messageId,
          role: "ai",
          content: response.answer,
          citations: response.citations ?? []
        }
      ]);

      if (response.sourcesUsed === 0) {
        toast("No exact documents matched, AI used generic reasoning.", { icon: "ℹ️" });
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to get response from AI.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleLaunchERP = () => {
    const workspace = workspaces.find(w => w._id === activeWorkspaceId);
    if (!workspace) return;

    const rawUrl = workspace.website || "https://example-erp.com";

    try {
      const targetUrl = new URL(rawUrl);
      targetUrl.searchParams.set("omnix_auth", "true");
      targetUrl.searchParams.set("workspace_id", workspace._id);
      window.open(targetUrl.toString(), "_blank");
    } catch (e) {
      toast.error("Invalid ERP URL configured for this workspace.");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-2 sm:p-4 lg:p-4 relative">

      {/* --- Chat Feed Area --- */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl p-2 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:gap-6 pb-4">

          {/* top sentinel — triggers loading older messages */}
          <div ref={topSentinelRef} className="h-1 w-full shrink-0" />

          {initialLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          )}

          {isLoadingOlder && !initialLoading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 sm:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ring-1 ${msg.role === "user" ? "bg-white/10 ring-white/20" : "bg-linear-to-br from-blue-500/20 to-purple-500/20 ring-white/10"}`}>
                {msg.role === "user" ? <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />}
              </div>

              <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-[13px] sm:text-[14px] leading-relaxed ${msg.role === "user"
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                : "bg-white/3 text-white/90 ring-1 ring-white/10 backdrop-blur-md"
                }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 break-words">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1.5">{children}</ol>,
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-semibold text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-2 mt-3 text-[15px] font-semibold text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-sm font-semibold text-white">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-200 break-all">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] sm:text-[13px] font-mono break-words">{children}</code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-white/20 pl-3 italic text-white/70">{children}</blockquote>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                {msg.role === "ai" &&
                  msg.citations &&
                  msg.citations.length > 0 && (
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
                        Sources
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((citation) => (
                          <div
                            key={citation.id}
                            className="flex items-center gap-2 rounded-full bg-white/5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs ring-1 ring-white/10 max-w-full"
                          >
                            <span>
                              {citation.type === "file" ? "📄" : "🌐"}
                            </span>

                            {citation.url ? (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 hover:text-blue-200 truncate max-w-[140px] sm:max-w-none"
                              >
                                {citation.title}
                              </a>
                            ) : (
                              <span className="text-white/70 truncate max-w-[140px] sm:max-w-none">
                                {citation.title}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 sm:gap-4 flex-row">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex max-w-[88%] sm:max-w-[80%] items-center rounded-2xl bg-white/[0.03] px-4 sm:px-5 py-3 sm:py-4 ring-1 ring-white/10 backdrop-blur-md">
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* --- Chat Input Footer --- */}
      <div className="mt-3 sm:mt-4 relative mx-auto w-full max-w-3xl px-1 sm:px-0">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center rounded-full bg-white/5 p-1.5 sm:p-2 ring-1 ring-white/10 backdrop-blur-2xl transition-all focus-within:bg-white/10 focus-within:ring-white/30 shadow-lg"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => (workspaceRendered ? closeWorkspace() : openWorkspace())}
              disabled={workspaces.length === 0}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center gap-2 rounded-2xl px-2 sm:px-3 text-sm text-white transition-all shrink-0"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${workspaceOpen ? "rotate-180" : ""}`}
              />
            </button>

            {workspaceRendered && (
              <div
                ref={workspaceRef}
                className="fixed sm:absolute bottom-20 sm:bottom-12 left-2 right-2 sm:left-0 sm:right-auto z-50 w-auto sm:w-72 origin-bottom-left overflow-hidden rounded-3xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl"
                style={{
                  opacity: workspaceOpen ? 1 : 0,
                  transform: workspaceOpen
                    ? "translateY(0px) scale(1)"
                    : "translateY(12px) scale(0.94)",
                  transitionProperty: "opacity, transform",
                  transitionDuration: "400ms",
                  transitionTimingFunction: SPRING,
                }}
              >
                <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wider text-white/40">
                  Select Workspace
                </div>

                <div className="max-h-72 overflow-y-auto p-2">
                  {workspaces.map((ws, i) => (
                    (ws.isActive) && (<button
                      key={ws._id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspaceId(ws._id);
                        closeWorkspace();
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-all ${activeWorkspaceId === ws._id
                        ? "bg-white/10 text-white ring-1 ring-white/20"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      style={{
                        opacity: workspaceOpen ? 1 : 0,
                        transform: workspaceOpen ? "translateY(0px)" : "translateY(8px)",
                        transitionProperty: "opacity, transform",
                        transitionDuration: "220ms",
                        transitionTimingFunction: SPRING,
                        transitionDelay: workspaceOpen ? `${40 + i * 30}ms` : "0ms",
                      }}
                    >
                      <span className="truncate">{ws.name}</span>
                      {activeWorkspaceId === ws._id && <Check className="h-4 w-4 text-white" />}
                    </button>)
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={workspaces.length > 0 ? "Ask a question..." : "Loading workspaces..."}
            className="w-full min-w-0 bg-transparent px-2 sm:px-4 text-[13px] sm:text-[14px] text-white placeholder-white/30 outline-none"
            disabled={isTyping || workspaces.length === 0}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isTyping || workspaces.length === 0}
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

        </form>

        <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-white/30 px-2 text-center">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <p>Omnix AI can make mistakes. Verify critical ERP outputs.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLaunchERP}
        className="group flex h-9 w-9 sm:h-10 sm:w-auto absolute top-2 right-2 sm:top-4 sm:right-5 shrink-0 items-center justify-center gap-2 rounded-full bg-white/5 sm:bg-transparent ring-1 ring-white/10 sm:ring-0 px-0 sm:px-4 text-sm font-medium text-white transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>

    </div>
  );
}