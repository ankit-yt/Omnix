declare global {
  interface Window {
    Razorpay : new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};