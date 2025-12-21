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
    // Simpler, friendlier rule: at least 8 characters, letters and numbers only,
    // and must contain at least one letter and one number.
    const simpleRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
    if (!simpleRegex.test(pwd)) {
      setError("Password must be 8-20 characters, using letters and numbers with at least one of each");
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

      // Log them in immediately with Supabase auth, then send to dashboard
      try {
        await supabaseBrowser.auth.signInWithPassword({ email, password: pwd });
      } catch {
        // even if login fails, still send them to dashboard; they can log in manually
      }

      router.push("/affiliate/dashboard");
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
          <h2 className="text-lg font-semibold">Profile created successfully</h2>
          <p>Your referral code is:</p>
          <div className="text-2xl font-mono font-bold tracking-widest">{success.code}</div>
          <p className="text-sm text-green-800">
            Share this code with your customers. When they order from our website and enter this
            code at checkout, they will receive a discount and you will earn commission on their
            purchases.
          </p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
          {error && (
            <div className="border rounded p-3 text-sm bg-red-50 text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm mb-1">I am</label>
            <select name="type" className="border rounded px-3 py-2 w-full" defaultValue="individual">
              <option value="individual">Individual beautician / student</option>
              <option value="parlour">Parlour / salon</option>
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
              We use WhatsApp only for important updates and support. No spam, only important updates.
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
                minLength={8}
                maxLength={20}
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
            <p className="mt-1 text-xs text-gray-500">Use 8-20 characters with letters and numbers.</p>
          </div>

          <div>
            <label className="block text-sm mb-1">Confirm password</label>
            <div className="relative">
              <input
                name="password_confirm"
                type={showPassword2 ? "text" : "password"}
                required
                minLength={8}
                maxLength={20}
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

          <div className="space-y-3 pt-1">
            <p className="text-sm text-gray-800">
              Start earning from the trust you&apos;ve already built with your clients.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto rounded px-5 py-2.5 text-white ${submitting ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
            >
              {submitting ? "Submitting…" : "Create account"}
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
              className={`w-full rounded px-5 py-2.5 text-white ${submitting ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
            >
              {submitting ? "Submitting…" : "Create account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
