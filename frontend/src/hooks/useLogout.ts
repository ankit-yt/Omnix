import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

export function useLogout() {
  const clearStore = useAuthStore((state) => state.logout);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      clearStore();

      window.location.replace("/")
    }
  };

  return logout;
}