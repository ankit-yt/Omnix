'use client';

import { useState, useEffect } from 'react';
import { adminService, Plan, PlanLimits } from '@/services/admin.service';
import { X, Pencil, CheckCircle2, AlertTriangle, Plus, Power, PowerOff } from 'lucide-react';
import { toast } from "sonner";

const emptyLimits: PlanLimits = {
  messagesPerMonth: 0,
  knowledgeBaseSizeMB: 0,
  teamMembers: 0,
  maxWorkspaces: 0,
  crawlingEnabled: false,
  maxPagesPerCrawl: 0,
};

export default function AdminBillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    razorpayPlanId: '',
    features: '',
    limits: emptyLimits,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    code: '',
    displayName: '',
    description: '',
    priceInPaise: 0,
    features: '',
    limits: emptyLimits,
  });
  const [isCreating, setIsCreating] = useState(false);

  const [statusUpdatingCode, setStatusUpdatingCode] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch (error) {
      toast.error('Failed to load plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      displayName: plan.displayName || '',
      description: plan.description || '',
      razorpayPlanId: plan.razorpayPlanId || '',
      features: (plan.features || []).join(', '),
      limits: { ...emptyLimits, ...plan.limits },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSaving(true);
    try {
      const payload = {
        displayName: formData.displayName,
        description: formData.description,
        ...(formData.razorpayPlanId.trim() && {
          razorpayPlanId: formData.razorpayPlanId.trim(),
        }),
        features: formData.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        limits: formData.limits,
      };

      await adminService.updatePlan(editingPlan.code, payload);
      toast.success(`${formData.displayName} updated successfully.`);
      setEditingPlan(null);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    setStatusUpdatingCode(plan.code);
    try {
      console.log(plan)
      await adminService.setPlanActiveStatus(plan.code, !plan.isActive);
      toast.success(`${plan.displayName} is now ${!plan.isActive ? 'active' : 'inactive'}.`);
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update plan status.');
    } finally {
      setStatusUpdatingCode(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await adminService.createPlan({
        code: createData.code.trim().toLowerCase(),
        displayName: createData.displayName,
        description: createData.description,
        priceInPaise: Number(createData.priceInPaise),
        features: createData.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        limits: createData.limits,
      });
      toast.success(`${createData.displayName} plan created.`);
      setIsCreateOpen(false);
      setCreateData({
        code: '',
        displayName: '',
        description: '',
        priceInPaise: 0,
        features: '',
        limits: emptyLimits,
      });
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create plan.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-4 sm:p-8 lg:p-12">
      <header className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Billing Plans</h1>
          <p className="mt-1.5 sm:mt-2 max-w-2xl text-xs sm:text-sm text-white/40">
            Manage your subscription tiers, limits, features, and external payment gateway linkages. Core pricing and plan code are immutable to protect active subscriptions.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Plan
        </button>
      </header>

      {/* Data Table */}
      <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl bg-white/[0.02] ring-1 ring-white/[0.05] backdrop-blur-xl">
        {/* --- Desktop / tablet table view --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-white/5 bg-[#070912]/80 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium text-white/40">Plan Details</th>
                <th className="px-6 py-4 font-medium text-white/40">Base Price</th>
                <th className="px-6 py-4 font-medium text-white/40">Limits</th>
                <th className="px-6 py-4 font-medium text-white/40">Gateway Link</th>
                <th className="px-6 py-4 font-medium text-white/40">Status</th>
                <th className="px-6 py-4 text-right font-medium text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((plan) => (
                <tr key={plan._id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{plan.displayName}</div>
                    <div className="mt-1 font-mono text-xs text-white/40">code: {plan.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/70">₹{(plan.priceInPaise / 100).toLocaleString()}</div>
                    <div className="text-xs text-white/40">{plan.currency} / billing cycle</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-white/50">{plan.limits?.messagesPerMonth?.toLocaleString()} msgs/mo</div>
                    <div className="text-xs text-white/50">{plan.limits?.knowledgeBaseSizeMB} MB KB</div>
                    <div className="text-xs text-white/50">
                      {plan.limits?.crawlingEnabled ? `Crawl: ${plan.limits?.maxPagesPerCrawl} pages` : 'Crawl: off'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {plan.code === 'free' ? (
                      <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/40 ring-1 ring-white/10">
                        N/A (System Managed)
                      </span>
                    ) : plan.razorpayPlanId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Active: {plan.razorpayPlanId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                        <AlertTriangle className="h-3 w-3" /> Missing Razorpay ID
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                        plan.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                          : 'bg-white/5 text-white/40 ring-white/10'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(plan)}
                        disabled={statusUpdatingCode === plan.code || plan.code === 'free'}
                        title={plan.code === 'free' ? 'Free plan cannot be deactivated' : undefined}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {plan.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        {statusUpdatingCode === plan.code ? '...' : plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEditModal(plan)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Mobile card view --- */}
        <div className="md:hidden divide-y divide-white/5">
          {plans.map((plan) => (
            <div key={plan._id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{plan.displayName}</div>
                  <div className="mt-0.5 font-mono text-xs text-white/40">code: {plan.code}</div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                    plan.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                      : 'bg-white/5 text-white/40 ring-white/10'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-sm text-white/70">₹{(plan.priceInPaise / 100).toLocaleString()}</span>
                <span className="text-xs text-white/40">{plan.currency} / billing cycle</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
                <span>{plan.limits?.messagesPerMonth?.toLocaleString()} msgs/mo</span>
                <span>·</span>
                <span>{plan.limits?.knowledgeBaseSizeMB} MB KB</span>
                <span>·</span>
                <span>{plan.limits?.crawlingEnabled ? `Crawl: ${plan.limits?.maxPagesPerCrawl} pages` : 'Crawl: off'}</span>
              </div>

              <div className="mt-3">
                {plan.code === 'free' ? (
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/40 ring-1 ring-white/10">
                    N/A (System Managed)
                  </span>
                ) : plan.razorpayPlanId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20 max-w-full">
                    <CheckCircle2 className="h-3 w-3 shrink-0" /> <span className="truncate">Active: {plan.razorpayPlanId}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
                    <AlertTriangle className="h-3 w-3" /> Missing Razorpay ID
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(plan)}
                  disabled={statusUpdatingCode === plan.code || plan.code === 'free'}
                  title={plan.code === 'free' ? 'Free plan cannot be deactivated' : undefined}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {plan.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  {statusUpdatingCode === plan.code ? '...' : plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEditModal(plan)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-3 sm:px-4 py-4 sm:py-8 backdrop-blur-md transition-all">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[24px] sm:rounded-[32px] bg-white/[0.03] p-6 sm:p-8 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">
            <button
              onClick={() => setEditingPlan(null)}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 text-lg sm:text-2xl font-medium tracking-tight text-white pr-8">
              Configure {editingPlan.code.toUpperCase()} Tier
            </h2>
            <p className="mb-6 sm:mb-8 text-sm text-white/40">Update marketing details, limits, features, and payment gateway links.</p>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/40">Plan Code (Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={editingPlan.code}
                    className="h-11 w-full cursor-not-allowed rounded-2xl bg-white/[0.02] px-4 text-sm text-white/30 outline-none ring-1 ring-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/40">Price (Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${editingPlan.priceInPaise / 100}`}
                    className="h-11 w-full cursor-not-allowed rounded-2xl bg-white/[0.02] px-4 text-sm text-white/30 outline-none ring-1 ring-white/5"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Features</label>
                <textarea
                  rows={2}
                  placeholder="Comma-separated, e.g. Priority support, Custom domain, SSO"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/20 focus:bg-white/10 focus:ring-white/30 resize-none"
                />
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="space-y-3">
                <label className="text-[13px] font-medium text-white/60">Limits</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LimitInput
                    label="Messages / mo"
                    value={formData.limits.messagesPerMonth}
                    onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, messagesPerMonth: v } })}
                  />
                  <LimitInput
                    label="Knowledge Base (MB)"
                    value={formData.limits.knowledgeBaseSizeMB}
                    onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, knowledgeBaseSizeMB: v } })}
                  />
                  <LimitInput
                    label="Team Members"
                    value={formData.limits.teamMembers}
                    onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, teamMembers: v } })}
                  />
                  <LimitInput
                    label="Max Workspaces"
                    value={formData.limits.maxWorkspaces}
                    onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, maxWorkspaces: v } })}
                  />
                  <LimitInput
                    label="Max Pages / Crawl"
                    value={formData.limits.maxPagesPerCrawl}
                    onChange={(v) => setFormData({ ...formData, limits: { ...formData.limits, maxPagesPerCrawl: v } })}
                  />
                  <label className="flex h-12 items-center justify-between rounded-2xl bg-white/5 px-4 ring-1 ring-white/10">
                    <span className="text-sm text-white/70">Crawling Enabled</span>
                    <input
                      type="checkbox"
                      checked={formData.limits.crawlingEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, limits: { ...formData.limits, crawlingEnabled: e.target.checked } })
                      }
                      className="h-4 w-4 accent-white"
                    />
                  </label>
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              {editingPlan.code !== 'free' && (
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Razorpay Plan ID</label>
                  <input
                    type="text"
                    placeholder="plan_XXXXXXXXXXXXXX"
                    value={formData.razorpayPlanId}
                    onChange={(e) => setFormData({ ...formData, razorpayPlanId: e.target.value })}
                    className="h-12 w-full rounded-2xl bg-white/5 px-4 font-mono text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/20 focus:bg-white/10 focus:ring-white/30"
                  />
                  <p className="text-xs text-white/40">Ensure this exactly matches the ID in your Razorpay Dashboard.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-12 flex-1 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-3 sm:px-4 py-4 sm:py-8 backdrop-blur-md transition-all">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[24px] sm:rounded-[32px] bg-white/[0.03] p-6 sm:p-8 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 rounded-full p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 text-lg sm:text-2xl font-medium tracking-tight text-white pr-8">Create New Plan</h2>
            <p className="mb-6 sm:mb-8 text-sm text-white/40">Define pricing, limits, and features for a new subscription tier.</p>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Plan Code</label>
                  <input
                    type="text"
                    required
                    placeholder="pro"
                    value={createData.code}
                    onChange={(e) => setCreateData({ ...createData, code: e.target.value })}
                    className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/20 focus:bg-white/10 focus:ring-white/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Price (in ₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={createData.priceInPaise / 100}
                    onChange={(e) => setCreateData({ ...createData, priceInPaise: Number(e.target.value) * 100 })}
                    className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Display Name</label>
                <input
                  type="text"
                  required
                  value={createData.displayName}
                  onChange={(e) => setCreateData({ ...createData, displayName: e.target.value })}
                  className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Description</label>
                <textarea
                  rows={2}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-white/60">Features</label>
                <textarea
                  rows={2}
                  placeholder="Comma-separated"
                  value={createData.features}
                  onChange={(e) => setCreateData({ ...createData, features: e.target.value })}
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/20 focus:bg-white/10 focus:ring-white/30 resize-none"
                />
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="space-y-3">
                <label className="text-[13px] font-medium text-white/60">Limits</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <LimitInput
                    label="Messages / mo"
                    value={createData.limits.messagesPerMonth}
                    onChange={(v) => setCreateData({ ...createData, limits: { ...createData.limits, messagesPerMonth: v } })}
                  />
                  <LimitInput
                    label="Knowledge Base (MB)"
                    value={createData.limits.knowledgeBaseSizeMB}
                    onChange={(v) => setCreateData({ ...createData, limits: { ...createData.limits, knowledgeBaseSizeMB: v } })}
                  />
                  <LimitInput
                    label="Team Members"
                    value={createData.limits.teamMembers}
                    onChange={(v) => setCreateData({ ...createData, limits: { ...createData.limits, teamMembers: v } })}
                  />
                  <LimitInput
                    label="Max Workspaces"
                    value={createData.limits.maxWorkspaces}
                    onChange={(v) => setCreateData({ ...createData, limits: { ...createData.limits, maxWorkspaces: v } })}
                  />
                  <LimitInput
                    label="Max Pages / Crawl"
                    value={createData.limits.maxPagesPerCrawl}
                    onChange={(v) => setCreateData({ ...createData, limits: { ...createData.limits, maxPagesPerCrawl: v } })}
                  />
                  <label className="flex h-12 items-center justify-between rounded-2xl bg-white/5 px-4 ring-1 ring-white/10">
                    <span className="text-sm text-white/70">Crawling Enabled</span>
                    <input
                      type="checkbox"
                      checked={createData.limits.crawlingEnabled}
                      onChange={(e) =>
                        setCreateData({ ...createData, limits: { ...createData.limits, crawlingEnabled: e.target.checked } })
                      }
                      className="h-4 w-4 accent-white"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-12 flex-1 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LimitInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
      />
    </div>
  );
}