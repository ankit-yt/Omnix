import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export function useLogout() {
  const router = useRouter();
  const clearStore = useAuthStore((state) => state.logout);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      clearStore();

      router.replace("/");
    }
  };

  return logout;
}