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
  List
} from "lucide-react";
import { NavItem } from "@/components/ui/navItem";
import { useLogout } from "@/hooks/useLogout";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";
import { chatService } from "@/services/chat.service";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  useInitializeAuth();
  const { isInitialized } = useAuthStore();
  const { isHistoryView, setHistoryView, activeSessionId, setActiveSessionId, activeWorkspaceId, setActiveWorkspaceId } = useChatStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const isChatPage = pathname === "/dashboard/chat";

  useEffect(() => {
    async function fetchSessions() {
      try {

        if (isChatPage && activeWorkspaceId) {
          const res = await chatService.getSessions(activeWorkspaceId)
          setSessions(res.data.data)
          console.log(res)
        }
      } catch {
        toast.error('Something went wrong')
      }
    }
    fetchSessions();
  }, [activeWorkspaceId])
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    )
  }
  return (
    <div className="flex inset-0 bg-center h-screen w-full bg-cover overflow-hidden p-4 md:p-6"
      style={{
        backgroundImage: "url(https://i.pinimg.com/vwebp/1200x/f1/42/81/f14281875b7b16d18596fab170cd9b29.webp)",
        backgroundRepeat: "no-repeat",

      }}>

      <aside className="hidden w-64 flex-col  justify-between rounded-[32px] bg-white/2 ring-1 ring-white/5 backdrop-blur-2xl transition-all md:flex">

        <div className="p-6 h-1">
          <div className="flex justify-between">
            <div className="mb-10 flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                  <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-medium tracking-wide text-white">Omnix</span>
            </div>

            {isChatPage && (<div className="mb-10 flex items-center justify-end gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl">

                <button
                  onClick={() => setHistoryView(true)}
                  title="Open session list"
                  className="text-white/40 transition-all hover:bg-white/5 hover:text-white"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
            )}
          </div>

          {(isChatPage && isHistoryView) ? (
            <div >
              <button
                onClick={() => setHistoryView(false)}
                className="mb-4 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Menu
              </button>

              <button
                onClick={() => setActiveSessionId(null)}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-white ring-1 ring-white/10 transition-all hover:bg-white/10"
              >
                <Plus className="h-4 w-4" /> New Chat
              </button>

              <div className="flex-1 overflow-y-auto space-y-1">
                <p className="mb-2 px-2 text-xs font-medium uppercase text-white/30">Recent Sessions</p>
                <div className="h-95">
                  {sessions.map((session) => (
                    <button
                      key={session._id}
                      onClick={() => setActiveSessionId(session._id)}
                      className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-all ${activeSessionId === session._id
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
                  href="/dashboard/documents"
                  icon={<Database className="h-4.5 w-4.5" />}
                  label="Knowledge Base"
                  active={pathname?.includes("/documents")}
                />
                <NavItem
                  href="/dashboard/chat"
                  icon={<MessageSquare className="h-4.5 w-4.5" />}
                  label="Copilot Engine"
                  active={pathname?.includes("/chat")}
                />

                <NavItem
                  href="/dashboard/workspaces"
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
                    href="/dashboard/billing"
                    icon={<CreditCard className="h-4.5 w-4.5" />}
                    label="Billing & Limits"
                    active={pathname?.includes("/billing")}
                  />
                  <NavItem
                    href="/settings"
                    icon={<Settings className="h-4.5 w-4.5" />}
                    label="Settings"
                    active={pathname?.includes("/settings")}
                  />
                </nav>
              </div>
            </div>
          )}




        </div>

        {/* User Profile Hook */}
        <div className="px-6 py-3">
          <div className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-white/20 to-white/5 ring-1 ring-white/10">
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

      {/* Main Content Area (Where your specific pages render) */}
      <main className="flex flex-1 flex-col overflow-hidden pl-0 md:pl-6">
        <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white/1.5 ring-1 ring-white/4 backdrop-blur-xl">
          {children}
        </div>
      </main>

    </div>
  );
}

