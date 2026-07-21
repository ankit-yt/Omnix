'use client';

import { workspaceService } from '@/services/workspace.service';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';

import { toast } from "sonner";
export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const defaultFormState = {
    name: '',
    description: '',
    settings: {
      botName: 'ERP Assistant',
      primaryColor: '#6366f1',
      welcomeMessage: 'Hi! How can I help you today?',
    },
    allowedDomains:[]
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
      allowedDomains:[]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWorkspace(null);
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
    <div className="flex h-full flex-col overflow-y-auto p-8 lg:p-12">
      {/* Header Section */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white">Workspaces</h1>
          <p className="mt-2 text-sm text-white/40">
            Manage your organization's workspaces, customize bot appearances, and monitor usage limits.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-medium text-black transition-all hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Workspace
        </button>
      </header>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
            <LayoutGrid className="h-5 w-5 text-white/40" />
          </div>
          <h3 className="text-sm font-medium text-white">No workspaces</h3>
          <p className="mt-1 text-sm text-white/40">Get started by creating a new workspace.</p>
          <button onClick={openCreateModal} className="mt-6 text-sm font-medium text-white hover:text-white/70 transition-colors">
            Create your first workspace &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <div key={workspace._id} className="flex flex-col overflow-hidden rounded-3xl bg-white/[0.02] ring-1 ring-white/[0.05] backdrop-blur-xl transition-all hover:bg-white/[0.04] hover:ring-white/10">
              <div className="flex-grow p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Avatar Initials generated by your backend pre-save hook */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white ring-1 ring-white/10"
                      style={{ backgroundColor: workspace.settings?.primaryColor || '#6366f1' }}
                    >
                      {workspace.avatarInitials}
                    </div>
                    <div>
                      <h3 className="truncate text-base font-medium text-white">{workspace.name}</h3>
                      <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${workspace.isActive ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'bg-white/5 text-white/40 ring-white/10'}`}>
                        {workspace.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-white/40">
                  {workspace.description || 'No description provided.'}
                </p>
                <div className="rounded-2xl bg-white/[0.02] p-3 text-sm ring-1 ring-white/5">
                  <div className="mb-1 flex justify-between text-white/40">
                    <span>Bot Name:</span>
                    <span className="font-medium text-white">{workspace.settings?.botName}</span>
                  </div>
                  <div className="flex justify-between text-white/40">
                    <span>Messages (Month):</span>
                    <span className="font-medium text-white">{workspace.usage?.messagesThisMonth || 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-white/5 px-6 py-3">
                <button
                  onClick={() => openEditModal(workspace)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(workspace._id, workspace.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/60 px-4 py-8 backdrop-blur-md transition-all overflow-y-auto">
          <div className="relative w-full max-w-lg animate-[rise_0.3s_ease-out_both] rounded-[32px] bg-white/[0.03] ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl my-auto">
            <div className="p-8">
              <h3 className="mb-6 text-2xl font-medium tracking-tight text-white">
                {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
              </h3>

              <form id="workspace-form" onSubmit={handleSave} className="space-y-5">
                {/* General Settings */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Workspace Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-white/30"
                    placeholder="e.g., Engineering Team"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                  />
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h4 className="mb-4 text-sm font-medium text-white">Bot Appearance & Settings</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-white/60">Bot Name</label>
                      <input
                        type="text"
                        value={formData.settings.botName}
                        onChange={(e) => setFormData({
                          ...formData,
                          settings: { ...formData.settings, botName: e.target.value }
                        })}
                        className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-white/60">Brand Color</label>
                      <div className="flex h-12 items-center gap-3 rounded-2xl bg-white/5 px-3 ring-1 ring-white/10">
                        <input
                          type="color"
                          value={formData.settings.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            settings: { ...formData.settings, primaryColor: e.target.value }
                          })}
                          className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                        />
                        <span className="font-mono text-sm uppercase text-white/50">{formData.settings.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-white/60">Welcome Message</label>
                  <input
                    type="text"
                    value={formData.settings.welcomeMessage}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, welcomeMessage: e.target.value }
                    })}
                    className="h-12 w-full rounded-2xl bg-white/5 px-4 text-sm text-white outline-none ring-1 ring-white/10 transition-all focus:bg-white/10 focus:ring-white/30"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 border-t border-white/5 p-8 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="workspace-form"
                disabled={isSaving}
                className="h-12 flex-1 rounded-2xl bg-white text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
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