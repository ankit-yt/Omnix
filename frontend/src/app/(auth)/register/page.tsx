"use client";

import { FormInput, SPRING } from "@/components/ui/formInput";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { AxiosError } from "axios";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface IRegistrationData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  website: string;
  contactEmail: string;
}

export default function RegisterPage() {

  const router = useRouter();

  const [formData, setFormData] = useState<IRegistrationData>({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    website: "",
    contactEmail: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const setAuth = useAuthStore((state)=>state.setAuth);
 const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await authService.register(formData);
      setAuth(data.user , data.accessToken);
      router.push('/dashboard');
    } catch (error : any) {
      console.log("Registration failed", (error as AxiosError).response?.data);
      setErrorMessage(
      error.response?.data?.message || "Something went wrong.")
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-end md:mr-40 overflow-hidden px-4 py-12">
      <div
        className="w-full max-w-120 rounded-[32px] p-8 md:p-10 ring-1 ring-white/10 backdrop-blur-2xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0px) scale(1)" : "translateY(32px) scale(0.92)",
          transitionProperty: "opacity, transform",
          transitionDuration: "650ms",
          transitionTimingFunction: SPRING,
        }}
      >
        {/* Header Section */}
        <div className="mb-8 space-y-2 text-center">
          <div
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1) rotate(0deg)" : "scale(0.3) rotate(-25deg)",
              transitionProperty: "opacity, transform",
              transitionDuration: "600ms",
              transitionTimingFunction: SPRING,
              transitionDelay: "80ms",
            }}
          >
           <Link href={"/"}
           
           > <svg
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
            </svg></Link>
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
            Create your account
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
            Sign up to get started with Omnix
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleRegister}>

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
            <FormInput
              label="Full Name"
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              required
              mounted={mounted}
              delay={220}
            />

            <FormInput
              label="Account Email"
              id="email"
              name="email"
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              mounted={mounted}
              delay={260}
            />

            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
              mounted={mounted}
              delay={300}
            />

            <FormInput
              label="Organization Name"
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="Acme Corp"
              value={formData.organizationName}
              onChange={handleChange}
              required
              mounted={mounted}
              delay={340}
            />

            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.95)",
                transitionProperty: "opacity, transform",
                transitionDuration: "550ms",
                transitionTimingFunction: SPRING,
                transitionDelay: "380ms",
              }}
            >
              <FormInput
                label="Website URL"
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
                required
              />

              <FormInput
                label="Contact Email"
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="hello@example.com"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            {/* Terms and Submission */}
            <div
              className="pt-2"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.95)",
                transitionProperty: "opacity, transform",
                transitionDuration: "550ms",
                transitionTimingFunction: SPRING,
                transitionDelay: "420ms",
              }}
            >
              <label className="flex items-center gap-3 text-[13px] text-white/60 transition-colors hover:text-white/90 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  required
                  className="h-4 w-4 rounded-sm border-white/20 bg-white/5 accent-white cursor-pointer"
                />
                <span>
                  I agree to the <a href="#" className="underline hover:text-white">Terms of Service</a> and{" "}
                  <a href="#" className="underline hover:text-white">Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </fieldset>
        </form>

        <p
          className="mt-8 text-center text-[13px] text-white/50"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0px)" : "translateY(14px)",
            transitionProperty: "opacity, transform",
            transitionDuration: "550ms",
            transitionTimingFunction: SPRING,
            transitionDelay: "460ms",
          }}
        >
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-white hover:underline transition-all">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}