
import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios"
import { error } from "console";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL:API_URL,
  headers:{
    'Content-Type':'application/json'
  }
})

api.interceptors.request.use(
  (config)=>{
  const token = useAuthStore.getState().accessToken;
  console.log('checking token')
  console.log(token)
  if(token && config.headers){
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; 
  },
  (error)=>Promise.reject(error)
)


let isRefreshing = false;
let failedQueue: Array<{
  resolve:(token:string)=>void;
  reject:(error:unknown)=>void;
}> = [];

const processQueue = (error:unknown , token:string | null = null)=>{
  failedQueue.forEach(prom=>{
    if(error){
      prom.reject(error);
    }else{
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (Response)=>Response,
  async (error)=>{
    const originalRequest = error.config;

    const isAuthEndpoint =
  originalRequest.url?.includes("/auth/login") ||
  originalRequest.url?.includes("/auth/register") ||
  originalRequest.url?.includes("/auth/refresh");

    if(error.response?.status == 401 && !originalRequest._retry && !isAuthEndpoint){

      if(isRefreshing){
        return new Promise((resolve , reject)=>{
          failedQueue.push({resolve , reject});
        })
        .then((token)=>{
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err)=>Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try{


        const {data} = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials:true,
          }
        );

        const currentUser = useAuthStore.getState().user;
        if(currentUser){
          useAuthStore.getState().setAuth(currentUser, data.accessToken);
        }else{
          useAuthStore.getState().setToken(data.accessToken);
        }

        processQueue(null , data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest);
      }catch(refreshError){
        processQueue(refreshError , null)
        useAuthStore.getState().logout();
        window.location.replace("/login");
        return Promise.reject(refreshError);
      }finally{
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
)