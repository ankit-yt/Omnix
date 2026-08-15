'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service'; // Adjust path if needed
import { Key, Save, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const setting = await adminService.getSystemSetting('GEMINI_API_KEY');
      if (setting && setting.value) {
        setApiKey(setting.value);
      }
    } catch (error: any) {
      // 404 is expected on first load before a key is saved to the DB
      if (error.response?.status !== 404) {
        toast.error('Failed to load system settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('API Key cannot be empty.');
      return;
    }
    
    setIsSaving(true);
    try {
      await adminService.updateSystemSetting('GEMINI_API_KEY', apiKey.trim());
      toast.success('Gemini API Key updated successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update API key.');
    } finally {
      setIsSaving(false);
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
    <div className="flex h-full flex-col overflow-hidden p-8 lg:p-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white">System Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Manage global system configurations, external integrations, and API keys. Changes here take effect immediately across all AI services.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Settings Card */}
        <div className="max-w-2xl rounded-3xl bg-white/[0.02] p-8 ring-1 ring-white/[0.05] backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Key className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Gemini AI Configuration</h2>
              <p className="text-sm text-white/40">Primary LLM Provider Settings</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-white/60">Active API Key</label>
              <input
                type="password"
                required
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-12 w-full rounded-2xl bg-white/5 px-4 font-mono text-sm text-white outline-none ring-1 ring-white/10 transition-all placeholder:text-white/20 focus:bg-white/10 focus:ring-white/30"
              />
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-400/80">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>Keep this key secure. The AI service will automatically hot-reload and use the new key the next time a prompt is generated.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}