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
    status: 'active' | 'warning' | 'suspended' | 'revoked';
    strike_count: number;
    commission_rate: number;
  };
  stats: {
    total_orders: number;
    total_sales: number;
    total_commission: number;
    pending_commission: number;
    payable_commission: number;
  };
  orders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    grand_total: number;
    affiliate_commission_amount: number;
    customer_name?: string | null;
  }>;
};

export default function AffiliateDashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AffiliateSummary | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedInsta, setCopiedInsta] = useState(false);

  const getWhatsAppMessage = (code: string) => {
    return `Hi! I'm sharing my personal referral code for Aesthetic Supply PK — Pakistan's trusted beauty supplier for salons and professionals.\n\nUse code: ${code}\n\nYou'll get 10% OFF your first order.\n\nShop here: https://aestheticsupplypk.com\n\nLet me know if you need help choosing products!`;
  };

  const getInstagramBio = (code: string) => {
    return `Shop professional beauty products\nUse code ${code} for 10% off\naestheticsupplypk.com`;
  };

  const loadForCurrentUser = async (opts?: { fromLogin?: boolean }) => {
    const fromLogin = opts?.fromLogin === true;
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

      if (msg.includes("affiliate profile not found")) {
        if (fromLogin) {
          // After a deliberate login attempt, show a clear, calm message.
          setError(
            "We couldn't find an affiliate account linked to this email. Please make sure you signed up as an affiliate, or create a new account below."
          );
        }
        // Whether or not we show the message, there is no affiliate data to display.
        setData(null);
      } else if (msg.includes("not active")) {
        setError(
          "Your affiliate account is pending approval. You will receive a WhatsApp message once approved (usually within 24 hours). Please check back later."
        );
        setData(null);
      } else {
        setError(raw);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: userRes } = await supabaseBrowser.auth.getUser();
        if (userRes?.user) {
          await loadForCurrentUser({ fromLogin: false });
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
      await loadForCurrentUser({ fromLogin: true });
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
          {/* Status Banner */}
          {data.affiliate.status === 'active' && (
            <div className="border rounded-md bg-emerald-50 border-emerald-200 px-4 py-3 flex items-center gap-2">
              <span className="text-emerald-600">✅</span>
              <span className="text-sm font-medium text-emerald-800">Active</span>
              <span className="text-xs text-emerald-700">— Your referral code is working</span>
            </div>
          )}
          {data.affiliate.status === 'warning' && (
            <div className="border rounded-md bg-amber-50 border-amber-200 px-4 py-3 flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <span className="text-sm font-medium text-amber-800">Warning</span>
              <span className="text-xs text-amber-700">— {data.affiliate.strike_count} / 5 failed deliveries in last 30 days</span>
            </div>
          )}
          {data.affiliate.status === 'suspended' && (
            <div className="border rounded-md bg-red-50 border-red-200 px-4 py-3 flex items-center gap-2">
              <span className="text-red-600">⛔</span>
              <span className="text-sm font-medium text-red-800">Suspended</span>
              <span className="text-xs text-red-700">— Affiliate code disabled due to too many failed deliveries</span>
            </div>
          )}

          <div className="border rounded p-4 bg-gray-50 space-y-3">
            <div className="text-sm text-gray-600">Affiliate</div>
            <div className="text-lg font-semibold">{data.affiliate.name}</div>
            {data.affiliate.parlour_name ? (
              <div className="text-sm text-gray-700">{data.affiliate.parlour_name}</div>
            ) : null}
            {data.affiliate.city ? (
              <div className="text-sm text-gray-500">City: {data.affiliate.city}</div>
            ) : null}

            <div className="mt-2 rounded-md border border-dashed border-emerald-300 bg-white px-3 py-3 space-y-2">
              <div className="text-xs font-medium text-gray-600">Your referral code</div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="font-mono text-lg font-semibold tracking-[0.35em] text-gray-900">
                  {data.affiliate.code}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(data.affiliate.code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // ignore clipboard errors
                    }
                  }}
                  className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                >
                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>
              <p className="text-[11px] text-gray-600">
                Share this code with your clients on WhatsApp or Instagram. They get a discount when they
                order using your code, and you earn commission on every confirmed order.
              </p>
            </div>

            {/* Next Step CTA */}
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-4 space-y-3">
              <div>
                <div className="font-medium text-emerald-800 text-sm">📣 Next step: Share your code</div>
                <p className="text-xs text-gray-700 mt-1">
                  Send your referral code to clients on WhatsApp or Instagram. When they order using your code, your commission will appear here automatically.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getWhatsAppMessage(data.affiliate.code));
                      setCopiedWhatsApp(true);
                      setTimeout(() => setCopiedWhatsApp(false), 2000);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <span>💬</span>
                  {copiedWhatsApp ? "Copied!" : "Copy WhatsApp message"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getInstagramBio(data.affiliate.code));
                      setCopiedInsta(true);
                      setTimeout(() => setCopiedInsta(false), 2000);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-pink-300 bg-white px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-50"
                >
                  <span>📷</span>
                  {copiedInsta ? "Copied!" : "Copy Instagram bio"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="border rounded p-3 bg-white">
              <div className="text-[10px] uppercase text-gray-500">Total orders</div>
              <div className="text-xl font-semibold mt-1">{data.stats.total_orders}</div>
            </div>
            <div className="border rounded p-3 bg-white">
              <div className="text-[10px] uppercase text-gray-500">Total sales</div>
              <div className="text-xl font-semibold mt-1">
                {Number(data.stats.total_sales || 0).toLocaleString()} PKR
              </div>
            </div>
            <div className="border rounded p-3 bg-white">
              <div className="text-[10px] uppercase text-gray-500">Earned</div>
              <div className="text-xl font-semibold mt-1 text-emerald-700">
                {Number(data.stats.total_commission || 0).toLocaleString()} PKR
              </div>
            </div>
            <div className="border rounded p-3 bg-white">
              <div className="text-[10px] uppercase text-gray-500">Pending</div>
              <div className="text-xl font-semibold mt-1 text-amber-600">
                {Number(data.stats.pending_commission || 0).toLocaleString()} PKR
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5">10-day hold</div>
            </div>
            <div className="border rounded p-3 bg-white border-emerald-200 bg-emerald-50/30">
              <div className="text-[10px] uppercase text-emerald-700">Payable</div>
              <div className="text-xl font-semibold mt-1 text-emerald-700">
                {Number(data.stats.payable_commission || 0).toLocaleString()} PKR
              </div>
              <div className="text-[9px] text-emerald-600 mt-0.5">Next payout</div>
            </div>
          </div>

          <div className="border rounded-md bg-emerald-50/70 border-emerald-100 px-4 py-3 text-xs text-gray-800">
            <span className="font-semibold mr-1">How you earn</span>
            You earn commission every time a client places an order using your referral code — even on repeat
            purchases.
          </div>

          <div className="border rounded-md bg-gray-50 border-gray-200 px-4 py-3 text-xs text-gray-700">
            <span className="font-semibold mr-1">Payouts</span>
            Commissions are paid out once a month, usually around the 10th. Confirmed orders from the previous
            month are included in that payout.
          </div>

          <div className="border rounded p-4 bg-white">
            <h2 className="font-medium mb-3">Recent orders</h2>
            {data.orders.length === 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-800 font-medium">You don't have any orders yet.</p>
                  <p className="text-sm text-gray-600">
                    Share your referral code with clients on WhatsApp or Instagram to start earning.
                    Your first order will appear here once it's confirmed.
                  </p>
                </div>
                {/* Visual example row */}
                <div className="border border-dashed border-gray-200 rounded p-3 bg-gray-50/50">
                  <div className="text-xs text-gray-400 mb-2">Example of how orders will appear:</div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span>Order #12345</span>
                    <span>—</span>
                    <span>Delivered</span>
                    <span>—</span>
                    <span className="text-amber-500">Commission pending</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Order ID</th>
                      <th className="py-2 pr-4">Customer</th>
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
                        <td className="py-2 pr-4">
                          {o.customer_name || "Customer"}
                        </td>
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
