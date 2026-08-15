import { MarketingPage } from "@/components/marketing/MarketingPage";
import Script from "next/script";

export default function Page() {
  
  return (<>
  <MarketingPage />
   <Script
        src="https://omnix-r4za.onrender.com/widget.js"
        data-workspace-id="6a74a84ecdc5133dad8c5f5d"
      />
  </>
    
  )
}
