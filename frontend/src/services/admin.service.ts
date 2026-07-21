import { api } from "@/lib/api";

export const adminService = {
  getPlans:async ()=>{
    const response = await api.get('/plans');
    return response.data.data.plans;
  },

 updatePlan: async (code:string , payload:{displayName?:string , description?:string , razorpayPlanId?:string})=>{
  const response = await api.patch(`/admin/plans/${code}` , payload);
  return response.data.data.plan;
 }
}