"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  List,
  Menu,
  X
} from "lucide-react";
import { NavItem } from "@/components/ui/navItem";
import { useLogout } from "@/hooks/useLogout";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";
import { chatSessionService, ChatSessionSummary } from "@/services/chatSession.service";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { backendUnreachable } = useInitializeAuth();
  const { isInitialized } = useAuthStore();
  const { isHistoryView, setHistoryView, activeSessionId, setActiveSessionId, activeWorkspaceId, setActiveWorkspaceId } = useChatStore();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const isChatPage = pathname === "/chat";
  
  // State to control mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      try {
        if (isChatPage && activeWorkspaceId) {
          setHistoryView(true)
          const res = await chatSessionService.getWorkspaceSessions(activeWorkspaceId)
          setSessions(res.data)
        }
      } catch {
        toast.error('Something went wrong')
      }
    }
    fetchSessions();
  }, [activeWorkspaceId, activeSessionId, isChatPage, setHistoryView])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, activeSessionId]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  if (backendUnreachable) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-white/60">
        <p>Can't reach the server right now.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="relative flex inset-0 bg-center h-screen w-full bg-cover overflow-hidden p-4 md:p-6">
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
          isChatPage ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundImage:
            "url(https://i.pinimg.com/736x/4c/f3/92/4cf392d02ca0f37d52a25bb6d9859f54.jpg)",
        }}
      />

      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out ${
          isChatPage ? "opacity-0" : "opacity-100"
        }`}
        style={{
          backgroundImage:
            "url(https://i.pinimg.com/1200x/f1/42/81/f14281875b7b16d18596fab170cd9b29.jpg)",
        }}
      />

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-4 left-4 z-50 flex w-64 flex-col justify-between rounded-[32px] bg-[#121212]/95 ring-1 ring-white/5 backdrop-blur-3xl transition-transform duration-300 ease-in-out md:relative md:inset-auto md:translate-x-0 md:bg-white/2 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        <div className="p-6 h-1 flex-1 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                  <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-medium tracking-wide text-white">Omnix</span>
            </div>

            <div className="flex items-center gap-2">
              {isChatPage && (
                <button
                  onClick={() => setHistoryView(true)}
                  title="Open session list"
                  className="text-white/40 transition-all hover:bg-white/5 hover:text-white md:mr-2"
                >
                  <List className="h-5 w-5" />
                </button>
              )}
              {/* Close Button Mobile */}
              <button 
                className="md:hidden text-white/50 hover:text-white transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {(isChatPage && isHistoryView) ? (
            <div>
              <button
                onClick={() => setHistoryView(false)}
                className="mb-4 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Menu
              </button>

              <button
                onClick={() => {
                  setActiveSessionId(null)
                  setIsMobileMenuOpen(false)
                }}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10"
              >
                <Plus className="h-4 w-4" /> New Chat
              </button>

              <div className="flex-1 space-y-1">
                <p className="mb-2 px-2 text-xs font-medium uppercase text-white/30">Recent Sessions</p>
                <div className="h-95">
                  {sessions.map((session) => (
                    <button
                      key={session._id}
                      onClick={() => {
                        setActiveSessionId(session._id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        activeSessionId === session._id
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {session.title || "New Conversation"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Main Navigation */}
              <nav className="space-y-1.5">
                <NavItem
                  href="/"
                  icon={<LayoutDashboard className="h-4.5 w-4.5" />}
                  label="Command Center"
                  active={pathname === "/"}
                />
                <NavItem
                  href="/documents"
                  icon={<Database className="h-4.5 w-4.5" />}
                  label="Knowledge Base"
                  active={pathname?.includes("/documents")}
                />
                <NavItem
                  href="/chat"
                  icon={<MessageSquare className="h-4.5 w-4.5" />}
                  label="Copilot Engine"
                  active={pathname?.includes("/chat")}
                />

                <NavItem
                  href="/workspaces"
                  icon={<MessageSquare className="h-4.5 w-4.5" />}
                  label="Workspaces"
                  active={pathname?.includes("/workspace")}
                />
              </nav>

              {/* Secondary Navigation */}
              <div className="mt-10">
                <h3 className="mb-3 px-4 text-[11px] font-medium tracking-wider text-white/30 uppercase">Preferences</h3>
                <nav className="space-y-1.5">
                  <NavItem
                    href="/billing"
                    icon={<CreditCard className="h-4.5 w-4.5" />}
                    label="Billing & Limits"
                    active={pathname?.includes("/billing")}
                  />
                </nav>
              </div>
            </div>
          )}

        </div>

        {/* User Profile Hook */}
        <div className="px-6 py-4 mt-auto">
          <div className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/10">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[13px] font-medium text-white transition-colors">Ankit</p>
              <p className="truncate text-[11px] text-white/40">Pro Specialist</p>
            </div>
            <LogOut onClick={logout} className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-white" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden pl-0 md:pl-6">
        
        {/* Mobile Top Navigation Bar */}
        <div className="flex items-center justify-between pb-4 md:hidden z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-wide text-white">Omnix</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-xl bg-white/10 p-2 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md ring-1 ring-white/20"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Actual Pages Display */}
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white/1.5 ring-1 ring-white/4 backdrop-blur-xl">
          {children}
        </div>
      </main>

    </div>
  );
}