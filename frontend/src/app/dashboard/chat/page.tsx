"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, ArrowRight, ExternalLink, Bot, User as UserIcon, AlertTriangle 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

// Mock data: In production, fetch this from your /api/workspaces endpoint
const MOCK_WORKSPACES = [
  { id: "ws_1", name: "Avon Express ERP", erpUrl: "https://avonexpress.com/admin" },
  { id: "ws_2", name: "PCTE Internal Tools", erpUrl: "https://pcte.edu.in/portal" },
];

// Mock chat history
const INITIAL_CHAT = [
  { id: 1, role: "ai", content: "Hello! I am your Omnix Copilot. I have loaded 12 documents from the Avon Express Knowledge Base. How can I help you today?" },
];

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const [activeWorkspace, setActiveWorkspace] = useState(MOCK_WORKSPACES[0].id);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 1. Add user message to UI
    const newUserMsg = { id: Date.now(), role: "user", content: prompt };
    setMessages((prev) => [...prev, newUserMsg]);
    setPrompt("");
    setIsTyping(true);

    // 2. TODO: Hit your backend POST /api/chat endpoint here
    // Example: await api.post('/chat', { workspaceId: activeWorkspace, message: prompt });

    // 3. Mock AI Response Delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", content: "Based on the shipping logistics manual, standard ground delivery takes 3-5 business days. Would you like me to draft an email to the customer regarding this SLA?" }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleLaunchERP = () => {
    const workspace = MOCK_WORKSPACES.find(w => w.id === activeWorkspace);
    if (!workspace) return;

    // THE MAGIC HANDOFF: 
    // We append the auth flag and workspace ID to the target ERP url.
    // Your Chrome Extension background script listens for this exact pattern to inject the React widget.
    const targetUrl = new URL(workspace.erpUrl);
    targetUrl.searchParams.set("omnix_auth", "true");
    targetUrl.searchParams.set("workspace_id", workspace.id);
    
    // Optional: Pass a short-lived token if your extension needs to authenticate silently
    // targetUrl.searchParams.set("session_token", "temp_token_here");

    window.open(targetUrl.toString(), "_blank");
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
            
            {/* Minimal Workspace Dropdown */}
            <select 
              value={activeWorkspace}
              onChange={(e) => setActiveWorkspace(e.target.value)}
              className="mt-0.5 appearance-none bg-transparent text-xs text-white/50 outline-none hover:text-white transition-colors cursor-pointer [&>option]:bg-[#0a0d16]"
            >
              {MOCK_WORKSPACES.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* The Extension Injection Button */}
        <button 
          onClick={handleLaunchERP}
          className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/30 active:scale-95"
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
              
              {/* Avatar */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${msg.role === "user" ? "bg-white/10 ring-white/20" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-white/10"}`}>
                {msg.role === "user" ? <UserIcon className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </div>
              
              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-2xl p-4 text-[14px] leading-relaxed ${
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
          
          {/* Invisible div to snap scroll to bottom */}
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
            placeholder={`Message Copilot in ${MOCK_WORKSPACES.find(w => w.id === activeWorkspace)?.name}...`}
            className="w-full bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/30 outline-none"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!prompt.trim() || isTyping}
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