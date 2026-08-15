"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Circle, ArrowRight, Activity, HardDrive, LayoutGrid, 
  Terminal, Copy, FileText, MessageSquare, CreditCard 
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { workspaceService } from "@/services/workspace.service"; 
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardLandingPage() {
  const user = useAuthStore((state) => state.user);
  
  // State to hold workspaces and the currently selected one for the snippet
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const data = await workspaceService.getWorkspaces();
        if (data && data.length > 0) {
          setWorkspaces(data);
          // Default to the first active workspace
          const activeWorkspace = data.find((w: any) => w.isActive) || data[0];
          setSelectedWorkspaceId(activeWorkspace._id);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces for widget snippet", error);
      }
    };

    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  const { organization } = user;
  const { onboardingStatus, cachedLimits, cachedUsage, cachedPlan } = organization;

  // Determine if onboarding is fully complete
  const isOnboardingComplete = 
    onboardingStatus.knowledgeBaseUploaded && 
    onboardingStatus.firstSuccessfulMessage;

  const handleCopySnippet = () => {
    const snippetId = selectedWorkspaceId || "YOUR_WORKSPACE_ID";
    const snippet = `<script\n  src="https://omnix-r4za.onrender.com/widget.js"\n  data-workspace-id="${snippetId}"\n  defer>\n</script>`;
    navigator.clipboard.writeText(snippet);
    toast.success("Embed snippet copied to clipboard!");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-8 lg:p-12">
      
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Dashboard Overview</h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/40">
              Welcome back, {user.name}. {isOnboardingComplete ? "Your workspace is ready." : "Track your usage and complete your setup."}
            </p>
          </div>
          <div className="self-start sm:self-auto rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 shadow-lg">
            {cachedPlan} Plan
          </div>
        </div>
      </header>

      {/* --- DYNAMIC SECTION: Onboarding OR Deployment --- */}
      {!isOnboardingComplete ? (
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Onboarding Status</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <OnboardingStep 
              title="Upload Knowledge" 
              description="Add context to your RAG engine." 
              isCompleted={onboardingStatus.knowledgeBaseUploaded} 
              isActive={!onboardingStatus.knowledgeBaseUploaded}
              actionUrl="/documents"
            />
            <OnboardingStep 
              title="Test Copilot" 
              description="Send your first AI inference." 
              isCompleted={onboardingStatus.firstSuccessfulMessage} 
              isActive={onboardingStatus.knowledgeBaseUploaded && !onboardingStatus.firstSuccessfulMessage}
              actionUrl="/chat"
            />
          </div>
        </section>
      ) : (
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Integration & Quick Actions</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Widget Deployment Card */}
            <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white/[0.02] p-4 sm:p-6 ring-1 ring-white/[0.05] backdrop-blur-xl">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                    <Terminal className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-white">Deploy Widget</h3>
                    <p className="text-xs text-white/40 truncate">Paste this into your website's &lt;head&gt; tag</p>
                  </div>
                </div>

                {/* Workspace Selector Dropdown */}
                {workspaces.length > 0 && (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[13px] font-medium text-white/60">Select Workspace</label>
                    <div className="relative">
                      <select
                        value={selectedWorkspaceId}
                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                        className="h-10 w-full appearance-none rounded-xl bg-white/5 px-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30 [&>option]:bg-[#0a0d16]"
                      >
                        {workspaces.map((ws) => (
                          <option key={ws._id} value={ws._id}>
                            {ws.name} {!ws.isActive && "(Inactive)"}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="relative rounded-2xl bg-[#0a0d16] p-3 sm:p-4 ring-1 ring-white/10">
                  <pre className="overflow-x-auto text-[12px] sm:text-[13px] text-white/70 pr-10">
                    <code>
                      <span className="text-pink-400">&lt;script</span>{'\n'}
                      <span className="text-blue-300">  src=</span><span className="text-green-300">"https://omnix-r4za.onrender.com/widget.js"</span>{'\n'}
                      <span className="text-blue-300">  data-workspace-id=</span><span className="text-green-300">"{selectedWorkspaceId || 'YOUR_WORKSPACE_ID'}"</span>{'\n'}
                      <span className="text-blue-300">  defer</span><span className="text-pink-400">&gt;</span>{'\n'}
                      <span className="text-pink-400">&lt;/script&gt;</span>
                    </code>
                  </pre>
                  <button 
                    onClick={handleCopySnippet}
                    className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-lg bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <QuickActionCard 
                href="/documents" 
                icon={<FileText className="h-5 w-5 text-purple-400" />} 
                title="Train AI" 
                description="Upload more documents"
                bg="bg-purple-500/10"
                ring="ring-purple-500/20"
              />
              <QuickActionCard 
                href="/chat" 
                icon={<MessageSquare className="h-5 w-5 text-emerald-400" />} 
                title="Test Copilot" 
                description="Chat with your engine"
                bg="bg-emerald-500/10"
                ring="ring-emerald-500/20"
              />
              <QuickActionCard 
                href="/billing" 
                icon={<CreditCard className="h-5 w-5 text-amber-400" />} 
                title="Manage Plan" 
                description="View limits and billing"
                bg="bg-amber-500/10"
                ring="ring-amber-500/20"
                className="sm:col-span-2"
              />
            </div>

          </div>
        </section>
      )}

      {/* Dynamic Analytics & Limits Section */}
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Usage & Limits</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          <MetricCard 
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Active Workspaces" 
            used={cachedUsage.totalWorkspaces} 
            total={cachedLimits.maxWorkspaces} 
            label="Workspaces Allowed"
          />
          <MetricCard 
            icon={<HardDrive className="h-5 w-5" />}
            title="Knowledge Base" 
            used={cachedUsage.usedKnowledgeBaseSizeMB || 0} 
            total={cachedLimits.knowledgeBaseSizeMB} 
            label="Megabytes Uploaded"
            suffix=" MB"
          />
          <MetricCard 
            icon={<Activity className="h-5 w-5" />}
            title="AI Inferences" 
            used={cachedUsage.messagesThisMonth} 
            total={cachedLimits.messagesPerMonth} 
            label="Messages Sent"
            className="sm:col-span-2 md:col-span-1"
          />
        </div>
      </section>

    </div>
  );
}

function QuickActionCard({ href, icon, title, description, bg, ring, className = "" }: any) {
  return (
    <Link href={href} className={`group flex flex-col justify-center rounded-2xl sm:rounded-3xl bg-white/[0.02] p-4 sm:p-5 ring-1 ring-white/[0.05] backdrop-blur-xl transition-all hover:bg-white/5 hover:ring-white/10 ${className}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg} ring-1 ${ring} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mt-1 text-xs text-white/40">{description}</p>
    </Link>
  );
}

function OnboardingStep({ title, description, isCompleted, isActive, actionUrl }: { title: string, description: string, isCompleted: boolean, isActive: boolean, actionUrl: string }) {
  return (
    <div className={`flex flex-1 items-start gap-4 rounded-2xl sm:rounded-3xl p-5 sm:p-6 ring-1 backdrop-blur-xl transition-all ${isActive ? 'bg-white/10 ring-white/20 shadow-lg sm:scale-[1.02]' : 'bg-white/2 ring-white/[0.05]'}`}>
      <div className="mt-0.5 shrink-0 transition-colors">
        {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Circle className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/20'}`} />}
      </div>
      <div>
        <h3 className={`text-sm font-medium transition-colors ${isCompleted || isActive ? 'text-white' : 'text-white/40'}`}>{title}</h3>
        <p className="mt-1 text-xs text-white/40">{description}</p>
        {isActive && (
          <Link href={actionUrl} className="mt-4 flex items-center gap-2 text-xs font-medium text-white hover:text-white/70 transition-colors">
            Continue <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, used, total, label, icon, suffix = "", className = "" }: { title: string, used: number, total: number, label: string, icon: React.ReactNode, suffix?: string, className?: string }) {
  const percentage = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  
  return (
    <div className={`flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white/2 p-5 sm:p-6 ring-1 ring-white/5 backdrop-blur-xl ${className}`}>
      <div className="mb-5 sm:mb-6 flex items-center justify-between text-white/40">
        <span className="text-sm font-medium text-white">{title}</span>
        {icon}
      </div>
      
      <div>
        <div className="mb-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-medium tracking-tight text-white">{used.toLocaleString()}{suffix}</span>
          <span className="text-sm text-white/40">/ {total === -1 ? '∞' : `${total.toLocaleString()}${suffix}`}</span>
        </div>
        <p className="mb-4 text-xs text-white/40">{label}</p>
        
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-white/40 to-white transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}