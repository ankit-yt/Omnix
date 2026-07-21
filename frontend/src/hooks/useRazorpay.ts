import { useEffect, useState } from "react";

export const useRazorpay = ()=>{
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(()=>{
      if (window.Razorpay) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
    return;
  }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = ()=>setIsLoaded(true);
    document.body.appendChild(script);

    return()=>{
      document.body.removeChild(script);
    };
  },[]);

  return isLoaded;
}