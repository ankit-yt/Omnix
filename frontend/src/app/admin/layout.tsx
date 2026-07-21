"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut
} from "lucide-react";
import { NavItem } from "@/components/ui/navItem";
import { useLogout } from "@/hooks/useLogout";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const { loading } = useInitializeAuth();

  const user = useAuthStore((state)=>state.user);

  useEffect(()=>{
    if (!loading && user && user.role !== 'super_admin') {
      toast.error('Access Denied!');
      router.replace('/dashboard');

    }
  },[loading , user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="flex inset-0 bg-center h-screen w-full bg-cover overflow-hidden p-4 md:p-6"
      style={{
        backgroundImage: "url(https://i.pinimg.com/736x/2f/a1/04/2fa1042392e3d5316a45ce29031c3be9.jpg)",
        backgroundRepeat: "no-repeat",

      }}>

      <aside className="hidden w-64 flex-col justify-between rounded-[32px] bg-white/2 ring-1 ring-white/5 backdrop-blur-2xl transition-all md:flex">

        <div className="p-6">
          {/* Brand Logo */}
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none">
                <path d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-medium tracking-wide text-white">Omnix</span>
          </div>

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
              <NavItem
                href="/settings"
                icon={<Settings className="h-4.5 w-4.5" />}
                label="Settings"
                active={pathname?.includes("/settings")}
              />
            </nav>
          </div>
        </div>

        {/* User Profile Hook */}
        <div className="p-6">
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

