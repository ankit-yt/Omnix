import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

export function useLogout(){
  const router = useRouter();
  const logout = async()=>{
    await authService.logout();
    router.replace("/login")
  };

  return logout;

}