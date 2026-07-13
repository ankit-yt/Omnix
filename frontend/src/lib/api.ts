
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios"
import { error } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL:API_URL,
  withCredentials:true,
  headers:{
    'Content-Type':'application/json'
  }
})

api.interceptors.request.use(
  (config)=>{
  const token = useAuthStore.getState().accessToken;
  if(token && config.headers){
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; 
  },
  (error)=>Promise.reject(error)
)

api.interceptors.response.use(
  (Response)=>Response,
  async (error)=>{
    const originalRequest = error.config;

    const isAuthEndpoint =
  originalRequest.url?.includes("/auth/login") ||
  originalRequest.url?.includes("/auth/register") ||
  originalRequest.url?.includes("/auth/refresh");

    if(error.response?.status == 401 && !originalRequest._retry && !isAuthEndpoint){
      try{
        const {data} = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials:true,
          }
        );

        useAuthStore.getState().setAuth(data.user, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest);
      }catch(refreshError){
        useAuthStore.getState().logout();
        window.location.replace("/login");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
)