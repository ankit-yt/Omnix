import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";

export function useInitializeAuth(){
  const user = useAuthStore(state=>state.user);
  const setAuth = useAuthStore(state=>state.setAuth);
  const logout = useAuthStore(state=>state.logout);

  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const initialize = async()=>{
      if(user){
        setLoading(false);
        return;
      }
      try{
        const response = await authService.getMe();

          setAuth(
            response.data,
            response.accessToken
          );

          console.log(response)
      }catch(error){
        console.log("Initialize Auth Error : ",error);
        logout();
      }finally{
        setLoading(false);
      }
    };
    initialize();
  },[]);

  return {
    loading
  }
}