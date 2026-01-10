"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const city = String(fd.get("city") || "").trim();
    const parlour_name = String(fd.get("parlour_name") || "").trim() || undefined;
    const how_hear = String(fd.get("how_hear") || "").trim() || undefined;
    const type = String(fd.get("type") || "individual").trim() || "individual";
    const password = String(fd.get("password") || "");
    const password2 = String(fd.get("password_confirm") || "");

    if (!name || !phone || !city || !email) {
      setError("Name, phone, city, and email are required");
      return;
    }

    const pwd = password.trim();
    const pwd2 = password2.trim();
    if (pwd !== pwd2) {
      setError("Passwords do not match");
      return;
    }
    // Simple validation: minimum 6 characters
    if (pwd.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const payload = {
      name,
      phone,
      email,
      city,
      parlour_name,
      how_hear,
      type,
      password: pwd,
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/affiliate/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit");
      }

      const code = String(data.code || "");
      setSuccess({ code });

      // Don't auto-redirect - show success message with pending approval info
      // User can log in after admin approves their account
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      const viewportH = window.innerHeight || 0;
      const docH = document.documentElement?.scrollHeight || 0;

      const pastTop = y > 280;
      const nearBottom = y + viewportH >= docH - 80;
      setShowStickyCta(pastTop && !nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress reassurance */}
      <p className="text-center text-xs text-gray-500">⏱ Takes less than 2 minutes</p>

      <div className="space-y-2 rounded-lg bg-emerald-50/70 border border-emerald-100 px-4 py-3">
        <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
          <span aria-hidden="true">💸</span>
          <span>Earn from the trust you already have with your clients.</span>
        </p>
        <h1 className="text-2xl font-semibold">Affiliate / Beautician Partner Signup</h1>
        <p className="text-sm text-gray-800">
          Sign up to receive your personal referral code, track your earnings, and earn commission
          every time your clients order using your code.
        </p>
        <p className="text-xs text-gray-600">
          ✔ Free to join · No stock required · No upfront investment
        </p>
      </div>

      {/* Program basics box */}
      <div className="border rounded-lg bg-amber-50/50 border-amber-200 p-4 text-sm space-y-2">
        <h2 className="font-medium text-amber-800">📋 Program basics (quick read)</h2>
        <ul className="space-y-1 text-gray-700 text-sm">
          <li>• Clients get <strong>10% off</strong> when they use your code</li>
          <li>• You earn <strong>10% commission</strong> (15% after 10 successful deliveries/month)</li>
          <li>• Earnings become payable <strong>10 days after delivery</strong></li>
          <li>• Payouts are made monthly (<strong>10th of each month</strong>)</li>
          <li>• Repeated failed deliveries may deactivate the code</li>
        </ul>
      </div>

      {/* What happens after you sign up */}
      <div className="border rounded-lg bg-white shadow-sm p-4 text-sm text-gray-800 space-y-2">
        <h2 className="font-medium text-base">What happens after you sign up?</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your affiliate account is created instantly.</li>
          <li>You receive a personal referral code to share with clients.</li>
          <li>You can log in to your dashboard to see tracked orders and earnings.</li>
          <li>Start sharing your code – you earn commission when clients order using it.</li>
        </ul>
      </div>

      <p className="text-xs text-gray-600">
        Trusted by beauticians, salons, and beauty students across Pakistan.
      </p>

      {success ? (
        <div className="border rounded p-4 bg-green-50 text-green-900 space-y-3">
          <h2 className="text-lg font-semibold">🎉 Application submitted successfully!</h2>
          <p>Your referral code is:</p>
          <div className="text-2xl font-mono font-bold tracking-widest">{success.code}</div>
          
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-sm space-y-2">
            <p className="font-medium">⏳ Pending Approval</p>
            <p>Your account is being reviewed by our team. You will receive a WhatsApp message once approved (usually within 24 hours).</p>
          </div>
          
          <p className="text-sm text-green-800">
            Once approved, you can log in to your dashboard and start sharing your code with customers.
            They will receive a discount and you will earn commission on their purchases.
          </p>
          
          <a 
            href="/affiliate/dashboard" 
            className="inline-block mt-2 text-sm text-emerald-600 hover:text-emerald-700 underline"
          >
            Go to login page →
          </a>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
          {error && (
            <div className="border rounded p-3 text-sm bg-red-50 text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm mb-1">I am</label>
            <select name="type" className="border rounded px-3 py-2 w-full" defaultValue="individual">
              <option value="individual">Beautician / Salon professional</option>
              <option value="student">Student / Trainee</option>
              <option value="retail">Retail or salon staff (recommend products to customers)</option>
              <option value="recommender">Independent recommender (friends, community, WhatsApp groups)</option>
              <option value="parlour">Parlour / Salon owner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Full name</label>
            <input
              name="name"
              required
              className="border rounded px-3 py-2 w-full"
              autoFocus
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Parlour / Salon name (optional)</label>
            <input
              name="parlour_name"
              className="border rounded px-3 py-2 w-full"
              placeholder="If you run or work at a parlour"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">WhatsApp number</label>
            <input
              name="phone"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="03XXXXXXXXX"
            />
            <p className="mt-1 text-xs text-gray-500">
              This number will be used to verify your account and send payout updates.
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1">City</label>
            <input
              name="city"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="border rounded px-3 py-2 w-full pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-xs text-gray-600"
              >
                👁
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters.</p>
          </div>

          <div>
            <label className="block text-sm mb-1">Confirm password</label>
            <div className="relative">
              <input
                name="password_confirm"
                type={showPassword2 ? "text" : "password"}
                required
                minLength={6}
                className="border rounded px-3 py-2 w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword2((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-xs text-gray-600"
              >
                👁
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">How did you hear about us? (optional)</label>
            <textarea
              name="how_hear"
              rows={3}
              className="border rounded px-3 py-2 w-full"
              placeholder="Example: From a friend, from Instagram, from training session, etc."
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              name="terms"
              id="terms"
              required
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree that commission is paid only on valid delivered orders after a 10-day hold, and may be voided for returns/refunds or customer-caused failed deliveries.{" "}
              <a
                href="/affiliate/terms"
                target="_blank"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                View full terms
              </a>
            </label>
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-sm text-gray-800">
              Start earning from the trust you&apos;ve already built with your clients.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto rounded-lg px-6 py-3 text-white font-medium ${submitting ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
            >
              {submitting ? "Submitting…" : "Get my referral code"}
            </button>

            <p className="text-xs text-gray-500">
              By creating an account, you agree to our affiliate terms and privacy policy. Your
              information is kept private and secure.
            </p>
          </div>
        </form>
      )}

      <div className="pt-2 space-y-1 text-xs text-gray-600">
        <p>
          Already a partner? <a href="/affiliate/dashboard" className="underline">Log in</a>
        </p>
        <p>
          Questions? Contact us on WhatsApp and we&apos;ll be happy to help.
        </p>
      </div>

      {/* Sticky bottom CTA - mobile only */}
      {showStickyCta && !success && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 border-t border-gray-200 shadow-[0_-4px_12px_rgba(15,23,42,0.16)] md:hidden">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={submitting}
              className={`w-full rounded-lg px-5 py-2.5 text-white font-medium ${submitting ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
            >
              {submitting ? "Submitting…" : "Get my referral code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
