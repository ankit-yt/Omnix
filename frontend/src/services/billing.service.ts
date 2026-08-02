import { api } from "@/lib/api";

export const billingService = {

  getPlans: async()=>{
    const response = await api.get('/plans');
    return response.data.data.plans;
  },

  createCheckout: async(planId:string)=>{
    const response = await api.post('/subscription/checkout',{planId});
    return response.data.data;
  },

  syncRazorpaySubscription: async(razorpaySubscriptionId:string)=>{
    const response = await api.post('/subscription/sync' , {razorpaySubscriptionId});
    return response.data.message;
  },
  cancelSubscription: async () => {
    const response = await api.post('/subscription/cancel');
    return response.data;
  }
}