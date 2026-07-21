"use client";

import { CheckCircle2, Circle, ArrowRight, Activity, HardDrive, LayoutGrid } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

export default function DashboardLandingPage() {
  const user = useAuthStore((state) => state.user);
  console.log(user)
  if ( !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  // Destructure from your exact backend schema
  const { organization } = user;
  const { onboardingStatus, cachedLimits, cachedUsage, cachedPlan } = organization;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-8 lg:p-12">
      
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white">Dashboard Overview</h1>
            <p className="mt-2 text-sm text-white/40">Welcome back, {user.name}. Track your usage and complete your setup.</p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/20 shadow-lg">
            {cachedPlan} Plan
          </div>
        </div>
      </header>

      {/* Dynamic Onboarding Status Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Onboarding Status</h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <OnboardingStep 
            title="Reserve Username" 
            description="Create your unique identity" 
            isCompleted={onboardingStatus.slugConfigured} 
            isActive={!onboardingStatus.slugConfigured}
            actionUrl="/chat"
          />

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

      {/* Dynamic Analytics & Limits Section */}
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Usage & Limits</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
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
            used={cachedUsage.usedKnowledgeBaseSizeMB} 
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
          />

        </div>
      </section>

    </div>
  );
}

function OnboardingStep({ title, description, isCompleted, isActive, actionUrl }: { title: string, description: string, isCompleted: boolean, isActive: boolean, actionUrl: string }) {
  return (
    <div className={`flex flex-1 items-start gap-4 rounded-3xl p-6 ring-1 backdrop-blur-xl transition-all ${isActive ? 'bg-white/10 ring-white/20 shadow-lg scale-[1.02]' : 'bg-white/2 ring-white/[0.05]'}`}>
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

function MetricCard({ title, used, total, label, icon, suffix = "" }: { title: string, used: number, total: number, label: string, icon: React.ReactNode, suffix?: string }) {
  const percentage = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-white/2 p-6 ring-1 ring-white/5 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between text-white/40">
        <span className="text-sm font-medium text-white">{title}</span>
        {icon}
      </div>
      
      <div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-3xl font-medium tracking-tight text-white">{used.toLocaleString()}{suffix}</span>
          <span className="text-sm text-white/40">/ {total === -1 ? '∞' : `${total.toLocaleString()}${suffix}`}</span>
        </div>
        <p className="mb-4 text-xs text-white/40">{label}</p>
        
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-linear-to-r from-white/40 to-white transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}