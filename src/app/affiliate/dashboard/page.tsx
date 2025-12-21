"use client";

import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type AffiliateSummary = {
  affiliate: {
    id: string;
    name: string;
    parlour_name?: string | null;
    city?: string | null;
    code: string;
  };
  stats: {
    total_orders: number;
    total_sales: number;
    total_commission: number;
  };
  orders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    grand_total: number;
    affiliate_commission_amount: number;
  }>;
};

export default function AffiliateDashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AffiliateSummary | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);

  const loadForCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/affiliate/me", { method: "GET" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load dashboard");
      }
      setData(json as AffiliateSummary);
    } catch (err: any) {
      const raw = String(err?.message || "Something went wrong");
      const msg = raw.toLowerCase();

      // On initial load we do NOT want to show an error if the affiliate profile is missing.
      // That message should only appear reactively after a failed login attempt.
      if (!msg.includes("affiliate profile not found")) {
        setError(raw);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabaseBrowser.auth.getUser();
        if (userRes?.user) {
          await loadForCurrentUser();
        }
      } catch {
        // ignore
      } finally {
        setCheckedSession(true);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const { error: signInErr } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        const raw = String(signInErr.message || "Login failed");
        const msg = raw.toLowerCase();
        if (msg.includes("invalid login") || msg.includes("invalid login credentials")) {
          throw new Error("Incorrect email or password. Please try again.");
        }
        throw signInErr;
      }
      await loadForCurrentUser();
    } catch (err: any) {
      const raw = String(err?.message || "Login failed");
      const msg = raw.toLowerCase();
      if (msg.includes("affiliate profile not found")) {
        setError(
          "We couldnt find an affiliate account linked to this email. Please make sure you signed up as an affiliate, or create a new account below."
        );
      } else {
        setError(raw);
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Affiliate Partner Login</h1>
        <p className="text-sm text-gray-700">
          Log in to view your referral code, tracked orders, and earnings.
        </p>
        <p className="text-xs text-gray-500">
          Access your affiliate dashboard in one place – no spreadsheets, no manual tracking.
        </p>
      </div>

      {!data && checkedSession && (
        <form
          onSubmit={handleLogin}
          className="space-y-4 border rounded-lg bg-gray-50/80 shadow-sm p-5"
        >
          {error && (
            <div className="border rounded p-3 text-sm bg-gray-50 text-gray-800 border-gray-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              placeholder="name@example.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Forgot your password? Contact us on WhatsApp and we'll help you reset it.
            </p>
          </div>
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className={`rounded px-5 py-2.5 text-white ${loading ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-xs text-gray-500">
              Your information is secure and only used for affiliate account access.
            </p>
          </div>

          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <p>
              Only registered affiliate partners can access this dashboard. If you signed up recently,
              please log in using the same email you used for signup.
            </p>
            <p className="flex items-center gap-1">
              <span>Don't have an affiliate account yet?</span>
              <a
                href="/affiliate/signup"
                className="inline-flex items-center gap-1 text-emerald-700 font-medium hover:underline"
              >
                <span>Create one here</span>
                <span aria-hidden="true">→</span>
              </a>
            </p>
            <p>Questions or issues? Contact us on WhatsApp and we'll be happy to help.</p>
          </div>
        </form>
      )}

      {data && (
        <div className="space-y-6">
          <div className="border rounded p-4 bg-gray-50 space-y-2">
            <div className="text-sm text-gray-600">Affiliate</div>
            <div className="text-lg font-semibold">{data.affiliate.name}</div>
            {data.affiliate.parlour_name ? (
              <div className="text-sm text-gray-700">{data.affiliate.parlour_name}</div>
            ) : null}
            <div className="text-sm text-gray-700">
              Code: <span className="font-mono font-semibold tracking-widest">{data.affiliate.code}</span>
            </div>
            {data.affiliate.city ? (
              <div className="text-sm text-gray-500">City: {data.affiliate.city}</div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded p-4 bg-white">
              <div className="text-xs uppercase text-gray-500">Total orders</div>
              <div className="text-2xl font-semibold mt-1">{data.stats.total_orders}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-xs uppercase text-gray-500">Total sales</div>
              <div className="text-2xl font-semibold mt-1">
                {Number(data.stats.total_sales || 0).toLocaleString()} PKR
              </div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-xs uppercase text-gray-500">Total commission</div>
              <div className="text-2xl font-semibold mt-1 text-emerald-700">
                {Number(data.stats.total_commission || 0).toLocaleString()} PKR
              </div>
            </div>
          </div>

          <div className="border rounded p-4 bg-white">
            <h2 className="font-medium mb-3">Recent orders</h2>
            {data.orders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders have been recorded for this code yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Order ID</th>
                      <th className="py-2 pr-4 text-right">Customer subtotal</th>
                      <th className="py-2 pr-4 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {new Date(o.created_at as any).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">#{o.id}</td>
                        <td className="py-2 pr-4 text-right">
                          {Number(o.total_amount || 0).toLocaleString()} PKR
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {Number(o.affiliate_commission_amount || 0).toLocaleString()} PKR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
