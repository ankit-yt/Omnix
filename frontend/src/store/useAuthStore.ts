import { User } from "@/types/auth.types";
import { create } from "zustand";

interface AuthState{
  user:User | null;
  accessToken:string | null;
  isAuthenticated:boolean;
  isInitialized: boolean;

  setToken: (token: string) => void;
  setAuth:(user:User,token:string)=>void;
  logout:()=>void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set)=>({
  user:null,
  accessToken:null,
  isAuthenticated:false,
  isInitialized: false,

  setToken: (token) => set({ 
    accessToken: token 
  }),
  
  setAuth:(user,token)=>set({
    user,
    accessToken:token,
    isInitialized: true,
    isAuthenticated:true,
  }),

  logout:()=>set({
    user:null,
    accessToken:null,
    isInitialized: true,
    isAuthenticated:false,
  }),

  setInitialized:()=>set({
    isInitialized:true
  })
}))