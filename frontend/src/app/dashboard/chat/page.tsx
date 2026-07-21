"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, ArrowRight, ExternalLink, Bot, User as UserIcon, AlertTriangle 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { workspaceService } from "@/services/workspace.service";
import { chatService } from "@/services/chat.service";

import { toast } from "sonner";

type Message = {
  id: string | number;
  role: "user" | "ai";
  content: string;
};

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  
  // State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // Crucial for threading
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Workspaces on mount
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

  // Initialize Chat greeting when workspace changes
  useEffect(() => {
    if (!activeWorkspaceId) return;
    const ws = workspaces.find(w => w._id === activeWorkspaceId);
    
    setMessages([
      { 
        id: "init", 
        role: "ai", 
        content: `Hello ${user?.name || ''}! I am the Copilot for ${ws?.name || 'this workspace'}. I have access to your uploaded knowledge base. How can I help you today?` 
      }
    ]);
    setSessionId(null); // Reset session on workspace change
  }, [activeWorkspaceId, workspaces, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
    <div className="flex h-full flex-col overflow-hidden p-6 lg:p-10">
      
      {/* --- Top Header & Workspace Switcher --- */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white/[0.02] p-4 ring-1 ring-white/[0.05] backdrop-blur-md">
        
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-medium text-white">Copilot Engine</h1>
            
            <select 
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              disabled={workspaces.length === 0}
              className="mt-0.5 appearance-none bg-transparent text-xs text-white/50 outline-none hover:text-white transition-colors cursor-pointer disabled:opacity-50 [&>option]:bg-[#0a0d16]"
            >
              {workspaces.length === 0 && <option value="">Loading workspaces...</option>}
              {workspaces.map(ws => (
                <option key={ws._id} value={ws._id}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleLaunchERP}
          className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/30 active:scale-95 disabled:opacity-50"
        >
          <span>Launch ERP Copilot</span>
          <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>

      </header>

      {/* --- Chat Feed Area --- */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-white/[0.01] p-4 ring-1 ring-white/[0.03] backdrop-blur-sm sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${msg.role === "user" ? "bg-white/10 ring-white/20" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-white/10"}`}>
                {msg.role === "user" ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl p-4 text-[14px] leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20" 
                  : "bg-white/[0.03] text-white/90 ring-1 ring-white/10 backdrop-blur-md"
              }`}>
                {msg.content}
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
      <div className="mt-4 relative mx-auto w-full max-w-3xl">
        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center rounded-3xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-2xl transition-all focus-within:bg-white/10 focus-within:ring-white/30 shadow-lg"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={workspaces.length > 0 ? "Ask a question about your documents..." : "Loading workspaces..."}
            className="w-full bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/30 outline-none"
            disabled={isTyping || workspaces.length === 0}
          />
          <button 
            type="submit"
            disabled={!prompt.trim() || isTyping || workspaces.length === 0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
          <AlertTriangle className="h-3 w-3" />
          <p>Omnix AI can make mistakes. Verify critical ERP outputs.</p>
        </div>
      </div>

    </div>
  );
}