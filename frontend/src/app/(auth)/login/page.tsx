"use client";

import { FormInput, SPRING } from "@/components/ui/formInput";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await authService.login({ email, password });

      setAuth(data.data.user, data.accessToken);

      const callbackUrl = searchParams.get("callbackUrl");
      console.log("redirecting");

      window.location.replace(callbackUrl ?? "/dashboard");

    } catch (error: any) {
      console.error("Login failed", error.response);
      setErrorMessage(
        error.response?.data?.message || "Invalid email or password."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-end md:mr-40 overflow-hidden px-4 py-12">
      <div
        className="w-full max-w-100 rounded-[32px] p-8 md:p-10 ring-1 ring-white/10 backdrop-blur-2xl shadow-2xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? "translateY(0px) scale(1)"
            : "translateY(32px) scale(0.92)",
          transitionProperty: "opacity, transform",
          transitionDuration: "650ms",
          transitionTimingFunction: SPRING,
        }}
      >
        {/* Header Section */}
        <div className="mb-5 space-y-2 text-center">
          <div
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-inner"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? "scale(1) rotate(0deg)"
                : "scale(0.3) rotate(-25deg)",
              transitionProperty: "opacity, transform",
              transitionDuration: "600ms",
              transitionTimingFunction: SPRING,
              transitionDelay: "80ms",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-white"
              fill="none"
            >
              <path
                d="M12 2 L22 8 L22 16 L12 22 L2 16 L2 8 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight text-white"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0px)" : "translateY(14px)",
              transitionProperty: "opacity, transform",
              transitionDuration: "550ms",
              transitionTimingFunction: SPRING,
              transitionDelay: "140ms",
            }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm text-white/60"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0px)" : "translateY(14px)",
              transitionProperty: "opacity, transform",
              transitionDuration: "550ms",
              transitionTimingFunction: SPRING,
              transitionDelay: "180ms",
            }}
          >
            Sign in to continue to Omnix
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin}>
          {errorMessage && (
            <div
              className="flex items-center gap-2 text-[13px] mb-3 justify-center text-red-300"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <fieldset disabled={isLoading} className="space-y-4 group">
            {/* Email Input */}
            <FormInput
              label="Email address"
              id="Email"
              type="email"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              required
              mounted={mounted}
              delay={260}
            />
            {/* Password Input */}

            <FormInput
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              required
              mounted={mounted}
              delay={280}
            />

            {/* Form Utilities */}
            <div
              className="flex items-center justify-between py-2 text-[13px]"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0px)" : "translateY(16px)",
                transitionProperty: "opacity, transform",
                transitionDuration: "550ms",
                transitionTimingFunction: SPRING,
                transitionDelay: "300ms",
              }}
            >
              <label
                htmlFor="remember"
                className="flex items-center gap-2 text-white/60 transition-colors hover:text-white/90 cursor-pointer"
              >
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded-sm border-white/20 bg-white/5 accent-white cursor-pointer disabled:cursor-not-allowed"
                />
                Remember me
              </label>
              <a
                href="#"
                className="font-medium text-white/60 transition-colors hover:text-white hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-white/10"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted
                  ? "translateY(0px) scale(1)"
                  : "translateY(20px) scale(0.9)",
                transitionProperty: "opacity, transform",
                transitionDuration: "550ms",
                transitionTimingFunction: SPRING,
                transitionDelay: "340ms",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </fieldset>
        </form>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[13px] text-white/50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0px)" : "translateY(14px)",
            transitionProperty: "opacity, transform",
            transitionDuration: "550ms",
            transitionTimingFunction: SPRING,
            transitionDelay: "380ms",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-white hover:underline transition-all"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

// Default export wrapped in Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}