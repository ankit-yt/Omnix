import { api } from "@/lib/api"
import { RegisterInput } from "@/types/auth.types";
import Cookies from "js-cookie";

export const authService = {
  login: async (credentials: {email: string, password: string}) => {
    const response = await api.post('/auth/login', credentials);
    
    // Save the refresh token to a frontend cookie
    if (response.data.refreshToken) {
      Cookies.set("refreshToken", response.data.refreshToken, { 
        expires: 7, 
        path: "/" 
      });
    }
    
    return response.data;
  },

  register: async (data: RegisterInput) => {
    const response = await api.post('/auth/register', data);
    
    // Save the refresh token to a frontend cookie
    if (response.data.refreshToken) {
      Cookies.set("refreshToken", response.data.refreshToken, { 
        expires: 7, 
        path: "/" 
      });
    }
    
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    // Get token from frontend cookie
    const refreshToken = Cookies.get("refreshToken");
    
    const response = await api.post('/auth/logout', { refreshToken });
    
    // Clear the cookie on logout
    Cookies.remove("refreshToken");
    
    return response.data;
  },

  refresh: async () => {
    // Get token from frontend cookie
    const refreshToken = Cookies.get("refreshToken");
    
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  }
}