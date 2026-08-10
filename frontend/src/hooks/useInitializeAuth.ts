import { api } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef, useState } from "react";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1500; // 1.5s, 3s, 6s, 12s, 24s...

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
      // Axios sets error.response only when the server actually responded.
      // No response => network error, timeout, CORS, DNS failure, server down, etc.
      return !error?.response;
    };

    const scheduleRetry = () => {
      if (cancelled) return;

      retryCountRef.current += 1;

      if (retryCountRef.current > MAX_RETRIES) {
        // Give up trying silently — stop the infinite loader,
        // but flag it so UI can show a "can't reach server" state
        // instead of silently treating the user as logged out.
        setBackendUnreachable(true);
        setInitialized();
        return;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current - 1);
      timeoutRef.current = setTimeout(() => {
        initialize();
      }, delay);
    };

    const initialize = async () => {
      if (isInitialized || user) return;

      const isLoggedIn = document.cookie
        .split("; ")
        .some((cookie) => cookie === "is_logged_in=true");

      if (!isLoggedIn) {
        setInitialized();
        return;
      }

      try {
        const refreshRes = await authService.refresh();

        if (!refreshRes) {
          logout();
          setInitialized();

          if (!cancelled && window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
          return;
        }

        const token = refreshRes.accessToken;

        if (!token) {
          throw new Error("Refresh response did not contain accessToken");
        }

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
          // Backend is down / unreachable — DO NOT setInitialized here.
          // Keep the loader up and retry with backoff instead.
          scheduleRetry();
          return;
        }

        // Real auth failure (4xx/5xx from a server that IS responding)
        setInitialized();

        const status =
          (error as any)?.response?.status ??
          (error as any)?.status;

        if (status === 401 || status === 403) {
          logout();

          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        } else {
          // Unexpected server error (5xx etc.) — don't log the user out,
          // just stop blocking the UI.
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