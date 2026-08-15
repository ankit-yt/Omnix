"use client";

import { usePathname } from "next/navigation";
import {
  CreditCard,
  Settings,
  LogOut,
  List,
  Menu,
  X,
} from "lucide-react";
import { NavItem } from "@/components/ui/navItem";
import { useLogout } from "@/hooks/useLogout";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useEffect, useState } from "react";
import adminBg from "@/../public/images/admin.png"
import { chatSessionService, ChatSessionSummary } from "@/services/chatSession.service";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { backendUnreachable } = useInitializeAuth();
  const { isInitialized, user } = useAuthStore();
  const {setHistoryView, activeSessionId, activeWorkspaceId,} = useChatStore();
  const [ setSessions] = useState<ChatSessionSummary[]>([]);
  
  // State to control mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


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
          "opacity-100"
        }`}
        style={{
          backgroundImage:
            `url(/images/admin.png)`,
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

         
          </div>

      
            <div>
              {/* Main Navigation */}
              <nav className="space-y-1.5">
                <NavItem
                  href="/admin/billing"
                  icon={<CreditCard className="h-4.5 w-4.5" />}
                  label="Command Center"
                  active={pathname === "/admin/billing"}
                />
                <NavItem
                  href="/admin/settings"
                  icon={<Settings className="h-4.5 w-4.5" />}
                  label="Knowledge Base"
                  active={pathname?.includes("/admin/settings")}
                />
              </nav>

            </div>
        

        </div>

        {/* User Profile Hook */}
        <div className="px-6 py-4 mt-auto">
          <div className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/10">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[13px] font-medium text-white transition-colors">{user?.name}</p>
              <p className="truncate text-[11px] text-white/40">{user?.organization.cachedPlan}</p>
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