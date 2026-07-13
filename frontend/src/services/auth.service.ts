import { api } from "@/lib/api"
import { RegisterInput } from "@/types/auth.types";

export const authService = {
  login: async(credentials:{email:string, password:string})=>{
    const response = await api.post('/auth/login',credentials);
    return response.data;
  },

  register: async(data:RegisterInput)=>{
    const response = await api.post('/auth/register',data);
    return response.data;
  },

  getMe: async()=>{
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async()=>{
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
  const response = await api.post("/auth/refresh");
  return response.data;
}
}