import { api } from "@/lib/api";

export interface workspaceSettings {
  botName: string;
  primaryColor: string;
  welcomeMessage: string;
}

export interface workspaceDto {
  name: string;
  description: string;
  allowedDomains: string[];
  settings?: workspaceSettings
}

export const workspaceService = {
  getWorkspaces: async () => {
    const response = await api.get('/workspaces');
    return response.data.data.workspaces;
  },

  createWorkspace: async (data: workspaceDto) => {
    const response = await api.post('/workspaces', data);
    return response.data.data.workspace;
  },

  updateWorkspace: async (workspaceId: string, data: Partial<workspaceDto>) => {
    const response = await api.patch(`/workspaces/${workspaceId}`, data);
    return response.data.data.workspace;
  },

  deleteWorkspace: async (workspaceId: string) => {
    await api.delete(`/workspaces/${workspaceId}`);
  }


}