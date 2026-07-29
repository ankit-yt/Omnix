"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, ArrowRight, ExternalLink, Bot, User as UserIcon, AlertTriangle,
  Check,
  ChevronDown,
  Plus
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { chatService } from "@/services/chat.service";
import ReactMarkdown from "react-markdown";

import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import { useChatStore } from "@/store/useChatStore";
import { SPRING } from "@/components/ui/formInput";

type Message = {
  id: string | number;
  role: "user" | "ai";
  content: string;
};

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const { activeSessionId, setActiveSessionId, activeWorkspaceId, setActiveWorkspaceId } = useChatStore();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  // const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Crucial for threading
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [workspaceRendered, setWorkspaceRendered] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);


  const openWorkspace = () => {
    setWorkspaceRendered(true);
    // next frame so the initial (closed) styles paint before we animate to open
    requestAnimationFrame(() => setWorkspaceOpen(true));
  };

  const closeWorkspace = () => {
    setWorkspaceOpen(false);
    setTimeout(() => setWorkspaceRendered(false), 400); // match transitionDuration below
  };

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await workspaceService.getWorkspaces();
        setWorkspaces(data);
        if (data.length > 0) {
          setActiveWorkspaceId(data[0]._id);
        }
      } catch (error) {
        toast.error("Failed to load workspaces.");
      }
    };
    fetchWorkspaces();
  }, []);



  useEffect(() => {
    const loadSession = async () => {
      if (!activeSessionId) {
        const ws = workspaces.find(w => w._id === activeWorkspaceId);
        setMessages([{
          id: "init",
          role: "ai",
          content: `Hello ${user?.name || ''}! I am the Copilot for ${ws?.name || 'this workspace'}. How can I help you today?`
        }]);
        setSessionId(null);
        return;
      }

      try {
        setIsTyping(true);
        setSessionId(activeSessionId);

        const history = await chatService.getSessionMessages(activeSessionId);

        const formattedMessages = history.data.map((msg: any) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content
        }));

        setMessages(formattedMessages);
      } catch (error) {
        toast.error("Failed to load conversation history.");
        setActiveSessionId(null); // Fallback to new chat on failure
      } finally {
        setIsTyping(false);
      }
    };

    loadSession();
  }, [activeSessionId, activeWorkspaceId, workspaces, user, setActiveSessionId]);


  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [workspaceRendered]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeWorkspaceId) return;

    const userMessageContent = prompt;

    // 1. Add user message to UI immediately
    const newUserMsg: Message = { id: Date.now(), role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, newUserMsg]);
    setPrompt("");
    setIsTyping(true);

    try {
      // 2. Hit your backend POST /api/chat/message endpoint
      const response = await chatService.sendMessage({
        workspaceId: activeWorkspaceId,
        content: userMessageContent,
        sessionId: sessionId // Send null on first message, actual ID on subsequent ones
      });
      console.log(response)
      // 3. Save the sessionId returned by the backend so the conversation continues
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
      }

      // 4. Add AI response to UI
      setMessages((prev) => [
        ...prev,
        {
          id: response.messageId,
          role: "ai",
          content: response.answer
        }
      ]);

      // Optional: Log sources used for debugging
      if (response.sourcesUsed === 0) {
        toast("No exact documents matched, AI used generic reasoning.", { icon: "ℹ️" });
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to get response from AI.");
      // Remove the optimistic user message or show an error state
    } finally {
      setIsTyping(false);
    }
  };

  const handleLaunchERP = () => {
    const workspace = workspaces.find(w => w._id === activeWorkspaceId);
    if (!workspace) return;

    // Fallback URL if your schema doesn't have an erpUrl yet
    const rawUrl = workspace.erpUrl || "https://example-erp.com";

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
    <div className="flex h-full flex-col overflow-hidden p-6 lg:p-4">



      {/* --- Chat Feed Area --- */}
      <div className="flex-1 overflow-y-auto rounded-3xl  p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${msg.role === "user" ? "bg-white/10 ring-white/20" : "bg-linear-to-br from-blue-500/20 to-purple-500/20 ring-white/10"}`}>
                {msg.role === "user" ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </div>

              <div className={`max-w-[80%] rounded-2xl p-4 text-[14px] leading-relaxed ${msg.role === "user"
                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                : "bg-white/3 text-white/90 ring-1 ring-white/10 backdrop-blur-md"
                }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1.5">{children}</ol>,
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-semibold text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-2 mt-3 text-[15px] font-semibold text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-sm font-semibold text-white">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-200">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-white/10 px-1.5 py-0.5 text-[13px] font-mono">{children}</code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-white/20 pl-3 italic text-white/70">{children}</blockquote>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 flex-row">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex max-w-[80%] items-center rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/10 backdrop-blur-md">
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
      <div className="mt-4 relative mx-auto  w-full max-w-3xl">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center rounded-full bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-2xl transition-all focus-within:bg-white/10 focus-within:ring-white/30 shadow-lg"
        >
          <div
           className="relative">
            <button
              type="button"
              onClick={() => (workspaceRendered ? closeWorkspace() : openWorkspace())}
              disabled={workspaces.length === 0}
              className="flex h-10 w-10 items-center gap-2 rounded-2xl px-3 text-sm text-white transition-all"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${workspaceOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {workspaceRendered && (
              <div
                ref={workspaceRef}
                className="absolute bottom-12 left-0 z-50 w-72 origin-bottom-left overflow-hidden rounded-3xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl"
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
                    <button
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
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={workspaces.length > 0 ? "Ask a question about your documents..." : "Loading workspaces..."}
            className="w-full bg-transparent px-4 p text-[14px] text-white placeholder-white/30 outline-none"
            disabled={isTyping || workspaces.length === 0}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isTyping || workspaces.length === 0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

        </form>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
          <AlertTriangle className="h-3 w-3" />
          <p>Omnix AI can make mistakes. Verify critical ERP outputs.</p>
        </div>
      </div>


      <button
        type="button"
        onClick={handleLaunchERP}
        className="group flex h-10 absolute right-5 shrink-0 items-center gap-2 rounded-full  px-4 text-sm font-medium text-white  transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
      >
        <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>

    </div>
  );
}