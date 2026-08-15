"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import {
  X, ArrowUp,
  Maximize2, Minimize2, ChevronLeft, ChevronRight, MessageSquare, Plus, Loader2, MessageCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GradientOrb } from './Gradientorb';
import { useInfiniteScroll } from './useInfiniteScroll';

type Message = {
  id: string | number;
  role: 'user' | 'ai' | 'assistant';
  content: string;
  createdAt?: string;
};

type ChatSession = {
  id: string;
  title: string;
  lastMessageAt: string;
};

const SESSIONS_PAGE_SIZE = 15;
const MESSAGES_PAGE_SIZE = 30;

export default function Widget({ workspaceId, currentDomain }: { workspaceId: string, currentDomain: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelRendered, setPanelRendered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [view, setView] = useState<'history' | 'chat'>('history');
  const [visitorId, setVisitorId] = useState<string>('');
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // --- session-history pagination ---
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [sessionsLoadingMore, setSessionsLoadingMore] = useState(false);

  // --- in-session message pagination ---
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);

  const [fabRendered, setFabRendered] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = 'https://omnix-r4za.onrender.com/api/public/widget';
  const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const BACK_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const FAB_ANIM_MS = 240;

  // --- 1. Initialize Visitor ID ---
  useEffect(() => {
    let storedVisitorId = localStorage.getItem(`omnix_visitor_${workspaceId}`);
    if (!storedVisitorId) {
      storedVisitorId = `vis_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      localStorage.setItem(`omnix_visitor_${workspaceId}`, storedVisitorId);
    }
    setVisitorId(storedVisitorId);
  }, [workspaceId]);

  // --- 2. Verify domain, load settings, and fetch first page of history ---
  useEffect(() => {
    if (!visitorId) return;

    const initWidget = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/init/${workspaceId}?domain=${currentDomain}&visitorId=${visitorId}`);
        if (res.ok) {
          const json = await res.json();

          setConfig(json.data.settings);
          setIsAuthorized(true);

          if (json.data.history && json.data.history.length > 0) {
            setPastSessions(json.data.history);
            // init endpoint returns a fixed recent slice; treat it as page 1
            setSessionsPage(2);
            setSessionsHasMore(json.data.history.length >= SESSIONS_PAGE_SIZE);
            setView('history');
          } else {
            setView('chat');
            startNewChat(json.data.settings.welcomeMessage);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    initWidget();
  }, [workspaceId, currentDomain, visitorId]);

  // --- load older sessions when history list bottom sentinel is reached ---
  const loadMoreSessions = useCallback(async () => {
    if (!visitorId || sessionsLoadingMore || !sessionsHasMore) return;
    setSessionsLoadingMore(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/sessions?workspaceId=${workspaceId}&visitorId=${visitorId}&page=${sessionsPage}&limit=${SESSIONS_PAGE_SIZE}`
      );
      const json = await res.json();
      if (res.ok) {
        setPastSessions((prev) => [...prev, ...json.data.data]);
        setSessionsHasMore(json.data.meta.hasMore);
        setSessionsPage((p) => p + 1);
      }
    } catch {
      // silent fail — history pagination isn't critical path
    } finally {
      setSessionsLoadingMore(false);
    }
  }, [workspaceId, visitorId, sessionsPage, sessionsLoadingMore, sessionsHasMore]);

  const sessionsSentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreSessions,
    hasMore: sessionsHasMore,
    isLoading: sessionsLoadingMore,
    root: historyScrollRef.current,
    rootMargin: "60px",
  });

  const startNewChat = (welcomeMsg?: string) => {
    setSessionId(null);
    setActiveSession(null);
    setHasMoreOlder(false);
    setOldestCursor(null);
    setMessages([{
      id: 'init',
      role: 'ai',
      content: welcomeMsg || config?.welcomeMessage || 'Hi! How can I help you today?'
    }]);
    setView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resumeChat = async (sessionToResume: ChatSession) => {
    setSessionId(sessionToResume.id);
    setActiveSession(sessionToResume);
    setView('chat');
    setIsLoadingMessages(true);
    setHasMoreOlder(false);
    setOldestCursor(null);
    setMessages([{ id: 'loading', role: 'ai', content: 'Loading previous messages...' }]);

    try {
      const res = await fetch(
        `${API_BASE_URL}/messages/${sessionToResume.id}?workspaceId=${workspaceId}&visitorId=${visitorId}&limit=${MESSAGES_PAGE_SIZE}`
      );
      const json = await res.json();

      if (res.ok && json.data) {
        const restored: Message[] = json.data.data.map((m: any) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'ai' : m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(restored.length ? restored : [{ id: 'empty', role: 'ai', content: 'No messages found in this conversation.' }]);
        setHasMoreOlder(json.meta?.hasMore ?? false);
        setOldestCursor(json.meta?.nextCursor ?? null);
      } else {
        setMessages([{ id: 'error', role: 'ai', content: 'Could not load this conversation. Please try again.' }]);
      }
    } catch {
      setMessages([{ id: 'error', role: 'ai', content: 'Could not load this conversation. Please try again.' }]);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // --- load older messages when scrolled to the top of the active conversation ---
  const loadOlderMessages = useCallback(async () => {
    if (!activeSession || !oldestCursor || isLoadingOlder) return;

    const container = messagesScrollRef.current;
    if (container) {
      preserveScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }

    setIsLoadingOlder(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/messages/${activeSession.id}?workspaceId=${workspaceId}&visitorId=${visitorId}&limit=${MESSAGES_PAGE_SIZE}&before=${encodeURIComponent(oldestCursor)}`
      );
      const json = await res.json();
      console.log(json)

      if (res.ok && json.data) {
        const older: Message[] = json.data.map((m: any) => ({
          id: m.id,
          role: m.role === 'assistant' ? 'ai' : m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));
        setMessages((prev) => [...older, ...prev]);
        setHasMoreOlder(json.meta?.hasMore ?? false);
        setOldestCursor(json.meta?.nextCursor ?? null);
      }
    } catch {
      // silent fail — keep whatever's already loaded
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeSession, oldestCursor, isLoadingOlder, workspaceId, visitorId]);

  const olderMessagesSentinelRef = useInfiniteScroll({
    onLoadMore: loadOlderMessages,
    hasMore: hasMoreOlder,
    isLoading: isLoadingOlder,
    root: messagesScrollRef.current,
    rootMargin: "60px",
  });

  // restore scroll offset after prepending older messages so the view doesn't jump
  useLayoutEffect(() => {
    const container = messagesScrollRef.current;
    const preserved = preserveScrollRef.current;
    if (!container || !preserved) return;

    container.scrollTop = container.scrollHeight - preserved.height + preserved.top;
    preserveScrollRef.current = null;
  }, [messages]);

  useEffect(() => {
    if (view === 'chat' && !isLoadingOlder && !preserveScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, view]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setFabOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!panelRendered) {
      setFabRendered(true);
      setFabOpen(false);
      const raf = requestAnimationFrame(() => setFabOpen(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setFabRendered(false);
      setFabOpen(false);
    }
  }, [panelRendered]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!panelRendered) return;
      const panel = panelRef.current;
      if (!panel) return;
      const target = event.target as Node;
      if (panel.contains(target)) return;
      const path = event.composedPath();
      if (path.includes(panel)) return;
      if (path.some((node) => node instanceof HTMLElement && node.hasAttribute('data-omnix-fab'))) return;
      closePanel();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelRendered]);

  const openPanel = () => {
    setPanelRendered(true);
    requestAnimationFrame(() => setIsOpen(true));
    if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 250);
  };

  const closePanel = () => {
    setIsOpen(false);
    setTimeout(() => setPanelRendered(false), 250);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isTyping) return;

    const userText = prompt.trim();
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userText }]);
    setPrompt('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          domain: currentDomain,
          content: userText,
          sessionId,
          visitorId
        })
      });

      const json = await res.json();

      if (res.ok) {
        if (json.data.sessionId && !sessionId) {
          setSessionId(json.data.sessionId);
          setActiveSession({ id: json.data.sessionId, title: 'New Conversation', lastMessageAt: new Date().toISOString() });
        }
        setMessages(prev => [
          ...prev,
          { id: json.data.messageId, role: 'ai', content: json.data.answer }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), role: 'ai', content: json.message || 'Something went wrong. Please try again.' }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: 'ai', content: 'Sorry, I am having trouble connecting right now.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isAuthorized === false) return null;
  if (!config) return null;

  const primaryColor = config.primaryColor || '#2563eb';

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans text-base">

      {panelRendered && (
        <div
          ref={panelRef}
          className="flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.05] origin-bottom-right transition-all duration-300 ease-out"
          style={{
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0px) scale(1)' : 'translateY(16px) scale(0.94)',
            transitionTimingFunction: SPRING,
            height: isExpanded ? 'calc(100vh - 48px)' : '75vh',
            minHeight: isExpanded ? 'none' : '550px',
            maxHeight: isExpanded ? 'none' : '800px',
            width: isExpanded ? '460px' : '380px',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          <div className="absolute left-0 right-0 top-0 z-20">
            {/* frosted glass backdrop */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24"
              style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.7) 55%, rgba(255,255,255,0) 100%)',
                maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
              }}
            />

            <div className="relative flex items-start justify-between px-4 pt-4 pointer-events-none">
              <div className="pointer-events-auto flex gap-1.5">
                {view === 'chat' && pastSessions.length > 0 && (
                  <button
                    onClick={() => setView('history')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-gray-600 backdrop-blur-md transition-colors hover:bg-black/[0.08]"
                    aria-label="Back to History"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-gray-600 backdrop-blur-md transition-colors hover:bg-black/[0.08]"
                  aria-label="Toggle Expand"
                >
                  {isExpanded ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                </button>
              </div>

         <div className="pointer-events-auto flex h-10 items-center gap-2.5 rounded-full bg-white px-4 shadow-sm">

                <span className="text-[14px] font-semibold tracking-tight text-gray-800">
                  {config.botName}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>

              <div className="pointer-events-auto flex gap-1.5">
                <button
                  onClick={closePanel}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.04] text-gray-600 backdrop-blur-md transition-colors hover:bg-black/[0.08]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {view === 'history' && (
            <div ref={historyScrollRef} className="flex-1 overflow-y-auto bg-white flex flex-col pt-20">

              {/* Header Title Section */}
              <div className="flex items-center justify-between px-5 pb-4 pt-2">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
                  <p className="text-[13px] text-gray-500">Your recent chat history</p>
                </div>
                <button
                  onClick={() => startNewChat()}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable list content */}
              <div className="flex-1 pb-4">
                {isLoadingHistory ? (
                  <div className="flex flex-col">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 border-b border-gray-50 px-5 py-4">
                        <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-1/2 animate-pulse rounded bg-gray-200" />
                          <div className="h-2.5 w-1/4 animate-pulse rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : pastSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                    <MessageSquare className="mb-3 h-6 w-6 text-gray-300" />
                    <p className="text-sm font-medium text-gray-900">No conversations</p>
                    <p className="mt-1 text-xs text-gray-500">Start a new chat to begin exploring.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {pastSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => resumeChat(session)}
                        className="group flex w-full items-start gap-3 border-b border-gray-50 px-5 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                      >
                        <div className="mt-0.5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600">
                          <MessageCircle className="w-4 h-4 mt-2" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-800 group-hover:text-gray-900">
                            {session.title || 'Untitled conversation'}
                          </div>
                          <div className="mt-1 text-[11px] font-medium text-gray-400">
                            {new Date(session.lastMessageAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              ...(new Date(session.lastMessageAt).getFullYear() !== new Date().getFullYear()
                                ? { year: 'numeric' }
                                : {}),
                            })}{' '}
                            ·{' '}
                            {new Date(session.lastMessageAt).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <div className="mt-1 flex shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sessionsSentinelRef} className="h-1 w-full shrink-0" />

                {/* Loading more spinner */}
                {sessionsLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Sticky Bottom Action Button */}
              <div className="sticky bottom-0 mt-auto border-t border-gray-100 bg-white/90 p-4 backdrop-blur-md">
                <button
                  onClick={() => startNewChat()}
                  className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-4 h-4" />
                  New conversation
                </button>
              </div>
            </div>
          )}

          {view === 'chat' && (
            <>
              <div ref={messagesScrollRef} className="omnix-scrollbar flex-1 space-y-6 overflow-y-auto bg-white px-5 pb-6 pt-24">
                {/* top sentinel — triggers loading older messages in this session */}
                <div ref={olderMessagesSentinelRef} className="h-1 w-full shrink-0" />

                {isLoadingOlder && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animation: `omnix-msg-in 350ms ${SPRING} both` }}
                  >
                    {(msg.role === 'ai' || msg.role === 'assistant') && (
                      <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: '#4b5563' }}>
                        <div className="h-[40px] w-[40px]">
                          <GradientOrb config={{ hue: 120, rotationSpeed: 0.5 }} />
                        </div>
                      </div>
                    )}
                    <div
                      className={`relative text-[14.5px] leading-[1.6] ${msg.role === 'user'
                        ? 'max-w-[75%] rounded-[20px] rounded-br-[6px] px-4 py-3 text-white shadow-sm'
                        : 'max-w-[85%] pt-1 text-gray-800'
                        }`}
                      style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
                    >
                      {msg.role === 'ai' || msg.role === 'assistant' ? (
                        <div className="omnix-prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start" style={{ animation: `omnix-msg-in 250ms ${SPRING} both` }}>
                    <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: '#4b5563' }}>
                      <div className="h-[40px] w-[40px]">
                        <GradientOrb config={{ hue: 120, rotationSpeed: 0.5 }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

        <div className="shrink-0 bg-white px-4 pb-4 pt-2">
             <form onSubmit={handleSendMessage} className="flex items-center gap-2 rounded-full bg-[#f3f4f6] p-1.5 transition-all focus-within:ring-2 focus-within:ring-gray-300">
                  <input
                    ref={inputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Write a message..."
                    disabled={isTyping || isLoadingMessages}
                    className="flex-1 bg-transparent px-4 py-2 text-[14.5px] text-gray-900 placeholder-gray-500 outline-none disabled:opacity-60"
                  />
                  <div className="flex items-center gap-1 pr-1">
                    <button
                      type="submit"
                      disabled={isTyping || isLoadingMessages || !prompt.trim()}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${prompt.trim() ? 'text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      style={prompt.trim() ? { backgroundColor: primaryColor } : {}}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </form>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <span>Powered by</span>
                  <a href="https://omnix.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                    Omnix
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {fabRendered && (
        <div
          className="group relative ml-auto w-fit"
          data-omnix-fab
          style={{
            opacity: fabOpen ? 1 : 0,
            transform: fabOpen ? 'scale(1) rotate(0deg)' : 'scale(0.4) rotate(-90deg)',
            transition: `opacity ${FAB_ANIM_MS}ms ${BACK_OUT}, transform ${FAB_ANIM_MS}ms ${BACK_OUT}`,
          }}
        >
          <span
            className="pointer-events-none absolute inset-0 -z-10 rounded-[26px] opacity-60 blur-xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}66)`,
              animation: 'omnix-breathe 3s ease-in-out infinite',
            }}
          />

          <button
            data-omnix-fab
            onClick={openPanel}
            aria-label="Open chat"
            className="relative flex h-[72px] items-center justify-center overflow-hidden rounded-[22px] text-white shadow-xl transition-all duration-300 ease-out hover:rounded-[18px] active:scale-95"
            style={{ width: '4.5rem' }}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <span className="pointer-events-none absolute inset-0 rounded-[22px] transition-all duration-300 group-hover:rounded-[18px]" />

            <span
              className="absolute transition-all duration-300"
              style={{
                opacity: isOpen ? 0 : 1,
                transform: isOpen ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
              }}
            >
              <svg width="80" height="80" viewBox="0 0 40 40" fill="none">
                <defs>
                  <radialGradient id="omnix-orb-body-a" cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="30%" stopColor="#ffffff" stopOpacity="0.55" />
                    <stop offset="65%" stopColor={primaryColor} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity="1" />
                  </radialGradient>
                  <radialGradient id="omnix-orb-shadow-a" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="omnix-orb-rim-a" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <ellipse cx="20" cy="33" rx="9" ry="3" fill="url(#omnix-orb-shadow-a)" />
                <circle cx="20" cy="19" r="14" fill="url(#omnix-orb-body-a)" />
                <circle cx="20" cy="19" r="13.4" fill="none" stroke="url(#omnix-orb-rim-a)" strokeWidth="0.8" />
                <g style={{ animation: 'omnix-blink 4.5s ease-in-out infinite', transformBox: 'fill-box' as any, transformOrigin: 'center' }}>
                  <rect x="15.6" y="16.5" width="2.3" height="6" rx="1.15" fill="white" />
                  <rect x="22.1" y="16.5" width="2.3" height="6" rx="1.15" fill="white" />
                </g>
              </svg>
            </span>
          </button>

          <span
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-gray-900/90 px-3 py-1.5 text-[13px] font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
          >
            Chat with us
          </span>
        </div>
      )}

      <style>{`
        .omnix-scrollbar::-webkit-scrollbar { width: 6px; }
        .omnix-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .omnix-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 10px; }
        @keyframes omnix-msg-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes omnix-breathe {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.12); }
        }
        @keyframes omnix-blink {
          0%, 88%, 100% { transform: scaleY(1); }
          92% { transform: scaleY(0.1); }
          96% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}