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
      setError(err?.message || "Something went wrong");
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
        throw signInErr;
      }
      await loadForCurrentUser();
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Affiliate Dashboard</h1>
        <p className="text-sm text-gray-600">
          Sign in with the email and password you used when creating your affiliate account to see
          your orders, sales, and commission.
        </p>
      </div>

      {!data && checkedSession && (
        <form onSubmit={handleLogin} className="space-y-3 border rounded p-4 bg-white">
          {error && (
            <div className="border rounded p-3 text-sm bg-red-50 text-red-700">{error}</div>
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
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`rounded px-5 py-2.5 text-white ${loading ? "bg-gray-400" : "bg-black hover:bg-gray-900"}`}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
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
