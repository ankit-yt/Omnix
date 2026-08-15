'use client';

import { workspaceService } from '@/services/workspace.service';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  Lock, 
  Bot, 
  MessageSquare,
  ArrowRight,
  X // <-- Make sure X is imported
} from 'lucide-react';
import { toast } from "sonner";
import Link from 'next/link';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for the domain input field
  const [domainInput, setDomainInput] = useState('');

  // Form State
  const defaultFormState = {
    name: '',
    description: '',
    settings: {
      botName: 'ERP Assistant',
      primaryColor: '#6366f1',
      welcomeMessage: 'Hi! How can I help you today?',
    },
    allowedDomains: [] as string[]
  };
  const [formData, setFormData] = useState(defaultFormState);

  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceService.getWorkspaces();
      setWorkspaces(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load workspaces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const openCreateModal = () => {
    setEditingWorkspace(null);
    setFormData(defaultFormState);
    setDomainInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (workspace: any) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      settings: {
        botName: workspace.settings?.botName || 'ERP Assistant',
        primaryColor: workspace.settings?.primaryColor || '#6366f1',
        welcomeMessage: workspace.settings?.welcomeMessage || 'Hi! How can I help you today?',
      },
      allowedDomains: workspace.allowedDomains || [] // <-- Properly load existing domains
    });
    setDomainInput('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorkspace(null);
  };

  // Handlers for Allowed Domains
  const handleAddDomain = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = domainInput.trim().toLowerCase();
    
    if (trimmed && !formData.allowedDomains.includes(trimmed)) {
      setFormData({
        ...formData,
        allowedDomains: [...formData.allowedDomains, trimmed]
      });
    }
    setDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter(d => d !== domainToRemove)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingWorkspace) {
        await workspaceService.updateWorkspace(editingWorkspace._id, formData);
        toast.success('Workspace updated successfully.');
      } else {
        await workspaceService.createWorkspace(formData);
        toast.success('Workspace created successfully.');
      }
      closeModal();
      fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (workspaceId: string, workspaceName: string) => {
    if (!window.confirm(`Are you sure you want to delete the workspace "${workspaceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await workspaceService.deleteWorkspace(workspaceId);
      toast.success('Workspace deleted.');
      fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete workspace.');
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
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-8 lg:p-12">
      {/* Header Section */}
      <header className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">Workspaces</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-white/40">
            Manage your organization's workspaces, customize bot appearances, and monitor usage limits.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="group flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 sm:py-2 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </button>
      </header>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] py-16 px-4 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <LayoutGrid className="h-5 w-5 text-white/40" />
          </div>
          <h3 className="text-base font-medium text-white">No workspaces</h3>
          <p className="mt-1 text-sm text-white/40 max-w-sm mx-auto">
            Get started by creating a new workspace to organize your bots.
          </p>
          <button 
            onClick={openCreateModal} 
            className="mt-6 text-sm font-medium text-white hover:text-white/70 transition-colors inline-flex items-center gap-1.5"
          >
            Create your first workspace <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaces.map((workspace) => {
            const isActive = workspace.isActive;

            return (
              <div 
                key={workspace._id} 
                className={`group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/[0.02] ring-1 ring-white/10 hover:bg-white/[0.04] hover:ring-white/20 hover:shadow-lg' 
                    : 'bg-white/[0.01] ring-1 ring-white/5 grayscale opacity-60'
                }`}
              >
                {/* Compact Card Body */}
                <div className={`p-4 ${!isActive ? 'pointer-events-none' : ''}`}>
                  
                  {/* Header: Avatar, Title & Status */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ring-1 ring-white/20"
                      style={{ backgroundColor: workspace.settings?.primaryColor || '#6366f1' }}
                    >
                      {workspace.avatarInitials}
                    </div>
                    
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-[15px] font-semibold tracking-tight text-white">
                          {workspace.name}
                        </h3>
                        {isActive ? (
                          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" title="Active"></div>
                        ) : (
                          <div className="h-2 w-2 shrink-0 rounded-full bg-white/20" title="Locked"></div>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/40">
                        {workspace.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Compact Stats Row */}
                  <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3 text-xs text-white/50">
                    <div className="flex items-center gap-1.5" title="Bot Name">
                      <Bot className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[90px]">{workspace.settings?.botName || 'ERP Assistant'}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Messages this month">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span>{workspace.usage?.messagesThisMonth || 0} msgs</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {isActive ? (
                  <div className="flex items-center justify-end gap-1 bg-white/[0.01] px-3 py-2 border-t border-white/5">
                    <button
                      onClick={() => openEditModal(workspace)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workspace._id, workspace.name)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2.5 transition-colors hover:bg-amber-500/20 cursor-pointer"
                       onClick={() => toast.info('Please upgrade your plan to unlock this workspace.')}>
                    <div className="flex items-center gap-1.5 text-amber-500/90">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Plan Limit</span>
                    </div>
                    <Link 
                      href="/billing" 
                      className="flex items-center gap-1 text-xs font-semibold text-white transition-colors hover:text-amber-400"
                    >
                      Upgrade
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/80 px-3 sm:px-4 py-4 sm:py-8 backdrop-blur-sm transition-all overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-full animate-[rise_0.3s_ease-out_both] rounded-[20px] sm:rounded-[24px] bg-[#0c0e17] ring-1 ring-white/10 shadow-2xl my-auto overflow-hidden flex flex-col">
            
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>

            <div className="relative p-5 sm:p-8 overflow-y-auto">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                  {editingWorkspace ? 'Edit Workspace' : 'Create Workspace'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="sm:hidden rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form id="workspace-form" onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-white/60">Workspace Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 w-full rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-white/30"
                    placeholder="e.g., Engineering Team"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-white/60">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full resize-none rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                    placeholder="Briefly describe this workspace's purpose..."
                  />
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h4 className="mb-4 text-sm font-medium text-white">Bot Settings</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-white/60">Bot Name</label>
                      <input
                        type="text"
                        value={formData.settings.botName}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, botName: e.target.value }
                        })}
                        className="h-11 w-full rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-white/60">Brand Color</label>
                      <div className="flex h-11 items-center gap-3 rounded-xl bg-white/5 px-3 ring-1 ring-white/10">
                        <input
                          type="color"
                          value={formData.settings.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            settings: { ...formData.settings, primaryColor: e.target.value }
                          })}
                          className="h-7 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-xs uppercase text-white/50 truncate">{formData.settings.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-white/60">Welcome Message</label>
                  <input
                    type="text"
                    value={formData.settings.welcomeMessage}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, welcomeMessage: e.target.value }
                    })}
                    className="h-11 w-full rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                  />
                </div>

                {/* --- NEW: Allowed Domains UI --- */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[13px] font-medium text-white/60">Allowed Domains (Whitelisting)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddDomain(e);
                        }
                      }}
                      placeholder="e.g., greenwood.edu"
                      className="h-11 flex-1 rounded-xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddDomain}
                      className="flex h-11 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/20"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Render the chips if domains exist */}
                  {formData.allowedDomains.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.allowedDomains.map((domain) => (
                        <span 
                          key={domain} 
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white ring-1 ring-white/10 max-w-full"
                        >
                          <span className="truncate max-w-[180px]">{domain}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDomain(domain)} 
                            className="shrink-0 text-white/40 transition-colors hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-white/40">These domains are authorized to embed the Omnix chat widget.</p>
                </div>

              </form>
            </div>

            <div className="relative flex gap-3 border-t border-white/5 bg-white/[0.02] p-4 sm:p-6 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="h-11 flex-1 rounded-xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="workspace-form"
                disabled={isSaving}
                className="h-11 flex-1 rounded-xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}