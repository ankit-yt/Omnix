import { api } from "@/lib/api";

export interface PlanLimits {
  messagesPerMonth: number;
  knowledgeBaseSizeMB: number;
  teamMembers: number;
  maxWorkspaces: number;
  crawlingEnabled: boolean;
  maxPagesPerCrawl: number;
}

export interface Plan {
  _id: string;
  code: string;
  displayName: string;
  description: string;
  priceInPaise: number;
  currency: string;
  sortOrder: number;
  limits: PlanLimits;
  features: string[];
  isActive: boolean;
  razorpayPlanId?: string | null;
}

export interface UpdatePlanPayload {
  displayName?: string;
  description?: string;
  razorpayPlanId?: string;
  priceInPaise?: number;
  sortOrder?: number;
  limits?: Partial<PlanLimits>;
  features?: string[];
}

export interface CreatePlanPayload {
  code: string;
  displayName: string;
  description?: string;
  priceInPaise: number;
  currency?: string;
  sortOrder?: number;
  limits: PlanLimits;
  features?: string[];
}

export const adminService = {
  getPlans: async (): Promise<Plan[]> => {
    const response = await api.get('/admin/plans');
    return response.data.data.plans;
  },

  createPlan: async (payload: CreatePlanPayload): Promise<Plan> => {
    const response = await api.post('/admin/plans', payload);
    return response.data.data.plan;
  },

  updatePlan: async (code: string, payload: UpdatePlanPayload): Promise<Plan> => {
    const response = await api.patch(`/admin/plans/${code}`, payload);
    return response.data.data.plan;
  },

  setPlanActiveStatus: async (code: string, isActive: boolean): Promise<Plan> => {
    const response = await api.patch(`/admin/plans/${code}/status`, { isActive });
    return response.data.data.plan;
  },

  getSystemSetting: async (key: string): Promise<any> => {
    const response = await api.get(`/admin/settings/${key}`);
    return response.data.data.setting;
  },

  updateSystemSetting: async (key: string, value: any): Promise<any> => {
    const response = await api.put(`/admin/settings/${key}`, { value });
    return response.data.data.setting;
  }
};