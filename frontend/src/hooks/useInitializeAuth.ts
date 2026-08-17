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
  // NEW: State to track if user tries to access a restricted route
  const [unauthorizedRole, setUnauthorizedRole] = useState(false);

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

    const handleUnauthorized = () => {
      logout();
      Cookies.remove("refreshToken", { path: "/" });
      if (
        !cancelled &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.replace("/login");
      } else {
        setInitialized();
      }
    };

    const initialize = async () => {
      if (isInitialized || user) return;

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

        const fetchedUser = meRes.data.data;
        const currentPath = window.location.pathname;

        // --- NEW: ROLE RESTRICTION LOGIC ---
        // If route has "admin" but user is not super_admin
        if (currentPath.includes("/admin") && fetchedUser.role !== "super_admin") {
          console.error("Access Denied: Super Admin role required.");
          setUnauthorizedRole(true);

          // Authenticate them so they aren't completely logged out
          setAuth(fetchedUser, token);
          setInitialized();

          // Redirect them away from the admin area to a safe route
          window.location.replace("/dashboard");
          return;
        }
        // -----------------------------------

        setAuth(fetchedUser, token);
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

  // NEW: return unauthorizedRole so your top-level layout can read it if needed
  return { backendUnreachable, unauthorizedRole };
}