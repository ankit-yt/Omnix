import { api } from "@/lib/api";
import { authService } from "@/services/auth.service"; // adjust if needed
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1500;

export function useInitializeAuth() {
  const {
    setAuth,
    logout,
    isInitialized,
    user,
    setToken,
    setInitialized,
  } = useAuthStore();

  const [backendUnreachable, setBackendUnreachable] = useState(false);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const isNetworkError = (error: any) => {
      return !error?.response;
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      retryCountRef.current += 1;

      if (retryCountRef.current > MAX_RETRIES) {
        setBackendUnreachable(true);
        setInitialized();
        return;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current - 1);
      timeoutRef.current = setTimeout(() => {
        initialize();
      }, delay);
    };

    // Helper to handle forced logouts without flashing the UI
    const handleUnauthorized = () => {
      logout();
      if (!cancelled && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        // Force redirect AND STOP. 
        // Do NOT call setInitialized() here, so the loading screen stays up.
        window.location.replace("/login");
      } else {
        // Only initialize if we are already on a public page
        setInitialized();
      }
    };

    const initialize = async () => {
      if (isInitialized || user) return;

      // UPDATED: Check for the refreshToken cookie managed by js-cookie
      const hasRefreshToken = !!Cookies.get("refreshToken");

      if (!hasRefreshToken) {
        handleUnauthorized();
        return;
      }

      try {
        const refreshRes = await authService.refresh();

        if (!refreshRes || !refreshRes.accessToken) {
          handleUnauthorized();
          return;
        }

        const token = refreshRes.accessToken;
        setToken(token);

        const meRes = await api.get("/auth/me");

        if (cancelled) return;

        setAuth(meRes.data.data, token);
        setBackendUnreachable(false);
        retryCountRef.current = 0;
        setInitialized();

      } catch (error) {
        if (cancelled) return;

        if (isNetworkError(error)) {
          scheduleRetry();
          return;
        }

        const status =
          (error as any)?.response?.status ??
          (error as any)?.status;

        if (status === 401 || status === 403) {
          handleUnauthorized();
        } else {
          // Unexpected 5xx error — stop blocking the UI, let them see the error state
          setInitialized();
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    isInitialized,
    user,
    setToken,
    setAuth,
    logout,
    setInitialized,
  ]);

  return { backendUnreachable };
}