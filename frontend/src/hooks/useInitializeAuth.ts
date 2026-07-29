import { api } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { error } from "next/dist/build/output/log";
import { useEffect } from "react";

export function useInitializeAuth() {
  const { setAuth, logout, isInitialized, user, setToken, setInitialized } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {

      if (isInitialized || user) return;

      const isLoggedIn = document.cookie.includes('is_logged_in=true');
      console.log(isLoggedIn);
      if (!isLoggedIn) {
        console.log("initilaizing")
        setInitialized();
        return;
      }

      try {
        console.log("going to fetch refresh token")
        const refreshRes = await authService.refresh();
        if(refreshRes === null){
            window.location.replace('/login');
        logout();
        }
        console.log("here is you token:",refreshRes);
        const token = refreshRes.accessToken;

        setToken(token);
        const meRes = await api.get('/auth/me');
        console.log(meRes)

        setAuth(meRes.data.data, token);

      } catch (error) {

        window.location.replace('/login');
        console.log("Initialize Auth Error : ", error);
        logout();
      }
    };

    initialize();

  }, [isInitialized, user, setToken, setAuth, logout, setInitialized]);

}