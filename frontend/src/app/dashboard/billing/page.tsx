'use client';

import { useState, useEffect } from 'react';
import { useRazorpay } from '@/hooks/useRazorpay';
import { billingService } from '@/services/billing.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function BillingPage() {
  const isRazorpayLoaded = useRazorpay();
  const { user, setAuth, accessToken } = useAuthStore();

  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  // Modal State for Cancellation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Dynamic User Plan Status
  const currentPlanCode = user?.organization?.cachedPlan || 'free';
  const isCancelled = user?.organization?.subscription?.status === 'cancelled';

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await billingService.getPlans();
        setPlans(data);
      } catch (error) {
        toast.error('Failed to load pricing plans.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPlans();
  }, []);

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!isRazorpayLoaded) {
      toast.error('Payment gateway is still loading. Please wait a moment.');
      return;
    }

    setProcessingPlanId(planId);
    try {
      // 1. Get the Intent from our Backend
      const checkoutData = await billingService.createCheckout(planId);

      // 2. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: checkoutData.razorpaySubscriptionId,
        name: "Omnix AI",
        description: `Upgrade to ${planName}`,
        handler: async function (response: any) {
          const rzpSubId = response.razorpay_subscription_id;
          await billingService.syncRazorpaySubscription(rzpSubId);

          toast.success('Payment successful! Your limits have been upgraded.');

          // Refresh user session state so the UI updates to the new plan
          const meRes = await authService.getMe();
          if (accessToken) setAuth(meRes.data, accessToken);

        },
        theme: {
          color: "#7c3aed",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed.');
      });

      rzp.open();

    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate checkout.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    const toastId = toast.loading("Initiating cancellation...");

    try {
      await billingService.cancelSubscription(); // Call your backend /cancel endpoint
      toast.success("Subscription cancelled successfully. Your plan will downgrade shortly.", { id: toastId });

      // Refresh user state to reflect the downgrade immediately in the UI
      const meRes = await authService.getMe();
      if (accessToken) setAuth(meRes.data, accessToken);

      setIsCancelModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel subscription.", { id: toastId });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-8 lg:p-12 relative">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-medium tracking-tight text-white">Upgrade your workspace</h1>
        <p className="mt-2 text-sm text-white/40">Supercharge your ERP interactions with higher limits and advanced features.</p>

        {isCancelled && currentPlanCode !== 'free' && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
            <AlertTriangle className="h-3 w-3" />
            Your subscription has been cancelled and will drop to the free tier.
          </div>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.code === currentPlanCode;
          const { originalPriceInPaise, salePriceInPaise, isDiscounted, promotionDetails } = plan.pricing;

          const displayPrice = isDiscounted ? salePriceInPaise / 100 : originalPriceInPaise / 100;
          const originalPrice = originalPriceInPaise / 100;

          return (
            <div
              key={plan._id}
              className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-xl ring-1 transition-all ${isCurrentPlan
                  ? 'bg-white/10 ring-white/20 shadow-lg scale-[1.02]'
                  : 'bg-white/2 ring-white/[0.05] hover:bg-white/5 hover:ring-white/10'
                }`}
            >
              {isCurrentPlan && (
                <span className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-black shadow-lg">
                  Current Plan
                </span>
              )}

              <h3 className="text-xl font-medium tracking-tight text-white">{plan.displayName}</h3>
              <p className="mt-2 min-h-[40px] text-sm text-white/40">{plan.description}</p>

              <div className="mt-6 mb-2">
                {isDiscounted && (
                  <div className="mb-1 text-sm text-white/30 line-through">
                    ₹{originalPrice.toLocaleString()}
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-tight text-white">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-white/40">/mo</span>
                </div>
                {isDiscounted && (
                  <p className="mt-2 text-xs font-medium text-emerald-400">
                    {promotionDetails.name} active
                  </p>
                )}
              </div>

              <button
                disabled={isCurrentPlan || processingPlanId === plan._id}
                onClick={() => handleUpgrade(plan._id, plan.displayName)}
                className={`mt-6 h-12 w-full rounded-2xl text-sm font-medium transition-all active:scale-95 ${isCurrentPlan
                    ? 'cursor-not-allowed bg-white/5 text-white/30 ring-1 ring-white/10'
                    : 'bg-white text-black hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  }`}
              >
                {processingPlanId === plan._id ? 'Processing...' : isCurrentPlan ? 'Active' : 'Upgrade'}
              </button>

              {/* CANCEL SUBSCRIPTION LINK */}
              {isCurrentPlan && plan.code !== 'free' && !isCancelled && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="mt-4 w-full text-center text-xs font-medium text-white/40 transition-colors hover:text-red-400"
                >
                  Cancel Subscription
                </button>
              )}

              <div className="my-8 h-px w-full bg-white/5" />

              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white/40" />
                  {plan.limits.messagesPerMonth === -1 ? 'Unlimited' : plan.limits.messagesPerMonth.toLocaleString()} AI Messages / mo
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white/40" />
                  {plan.limits.maxWorkspaces === -1 ? 'Unlimited' : plan.limits.maxWorkspaces} Workspaces
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white/40" />
                  {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers} Team Members
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white/40" />
                  {plan.limits.crawlingEnabled ? "Website Crawling" : "No Website Crawling"}
                </li>
                {plan.limits.crawlingEnabled && (
                  <li className="flex items-center gap-3 text-sm text-white/60">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white/40" />
                    {plan.limits.maxPagesPerCrawl === -1
                      ? "Unlimited Pages / Crawl"
                      : `${plan.limits.maxPagesPerCrawl} Pages / Crawl`}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070912]/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md animate-[rise_0.3s_ease-out_both] overflow-hidden rounded-[32px] bg-white/[0.03] p-8 ring-1 ring-white/10 shadow-2xl">

            <button
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
              className="absolute right-6 top-6 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mb-2 text-xl font-medium tracking-tight text-white">Cancel Subscription?</h2>
            <p className="mb-8 text-sm leading-relaxed text-white/60">
              Are you sure you want to cancel your <strong className="text-white">{currentPlanCode}</strong> plan? Your workspace limits will be immediately downgraded to the free tier.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="h-12 flex-1 rounded-2xl bg-white/5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="h-12 flex-1 rounded-2xl bg-red-500 text-sm font-medium text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}