"use client";

import { CheckCircle2, Circle, ArrowRight, Activity, HardDrive, LayoutGrid } from "lucide-react";

export default function DashboardLandingPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-8 lg:p-12">
      
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-white">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-white/40">Welcome to Omnix. Track your usage and complete your setup.</p>
      </header>

      {/* Onboarding Status Section */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Onboarding Status</h2>
        <div className="flex flex-col gap-4 md:flex-row">
          
          <OnboardingStep 
            title="Create Workspace" 
            description="Link your first ERP URL." 
            isCompleted={true} 
          />
          <OnboardingStep 
            title="Upload Knowledge" 
            description="Add context to your RAG engine." 
            isCompleted={false} 
            isActive={true}
          />
          <OnboardingStep 
            title="Install Extension" 
            description="Get the Omnix browser extension." 
            isCompleted={false} 
          />
          
        </div>
      </section>

      {/* Analytics & Limits Section */}
      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wide text-white/60 uppercase">Usage & Limits</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          <MetricCard 
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Active Workspaces" 
            used={1} 
            total={3} 
            label="Workspaces"
          />
          <MetricCard 
            icon={<HardDrive className="h-5 w-5" />}
            title="Knowledge Base" 
            used={12} 
            total={50} 
            label="Documents Uploaded"
          />
          <MetricCard 
            icon={<Activity className="h-5 w-5" />}
            title="AI Inferences" 
            used={1420} 
            total={5000} 
            label="Messages Sent"
          />

        </div>
      </section>

    </div>
  );
}

// Minimal Onboarding Step Component
function OnboardingStep({ title, description, isCompleted, isActive }: { title: string, description: string, isCompleted: boolean, isActive?: boolean }) {
  return (
    <div className={`flex flex-1 items-start gap-4 rounded-3xl p-6 ring-1 backdrop-blur-xl transition-all ${isActive ? 'bg-white/10 ring-white/20 shadow-lg' : 'bg-white/[0.02] ring-white/[0.05]'}`}>
      <div className="mt-0.5">
        {isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Circle className={`h-5 w-5 ${isActive ? 'text-white' : 'text-white/20'}`} />}
      </div>
      <div>
        <h3 className={`text-sm font-medium ${isCompleted || isActive ? 'text-white' : 'text-white/40'}`}>{title}</h3>
        <p className="mt-1 text-xs text-white/40">{description}</p>
        {isActive && (
          <button className="mt-4 flex items-center gap-2 text-xs font-medium text-white hover:text-white/70">
            Continue <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// Minimal Metric Card Component
function MetricCard({ title, used, total, label, icon }: { title: string, used: number, total: number, label: string, icon: React.ReactNode }) {
  const percentage = Math.round((used / total) * 100);
  
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-white/[0.02] p-6 ring-1 ring-white/[0.05] backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between text-white/40">
        <span className="text-sm font-medium text-white">{title}</span>
        {icon}
      </div>
      
      <div>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-3xl font-medium tracking-tight text-white">{used.toLocaleString()}</span>
          <span className="text-sm text-white/40">/ {total.toLocaleString()}</span>
        </div>
        <p className="mb-4 text-xs text-white/40">{label}</p>
        
        {/* Minimal Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-white/40 to-white" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}