"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

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
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
    if (!strongRegex.test(pwd)) {
      setError("Password must be 8-20 characters with upper, lower, number, and special character");
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

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Affiliate / Beautician Signup</h1>
      <p className="text-sm text-gray-600">
        This page is for invited parlours and beauticians only. After you submit your details, you
        will receive a unique referral code to share with your clients.
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
        <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4 bg-white">
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
                placeholder="At least 8 characters with Aa1@"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-xs text-gray-600"
              >
                👁
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be 8-20 characters and include uppercase, lowercase, number, and special character.
            </p>
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

          <button
            type="submit"
            disabled={submitting}
            className={`rounded px-5 py-2.5 text-white ${submitting ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
          >
            {submitting ? "Submitting…" : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
