"use client";

import React, { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";

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
  tier: {
    tier_name: string;
    delivered_count_30d: number;
    next_tier_name: string | null;
    next_tier_threshold: number | null;
  };
  orders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    grand_total: number;
    affiliate_commission_amount: number;
    customer_name?: string | null;
    delivery_status?: string | null;
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
  const [statusExpanded, setStatusExpanded] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);

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
      {!data ? (
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Affiliate Partner Login</h1>
          <p className="text-sm text-gray-700">
            Log in to view your referral code, tracked orders, and earnings.
          </p>
          <p className="text-xs text-gray-500">
            Access your affiliate dashboard in one place – no spreadsheets, no manual tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Affiliate Dashboard</h1>
          <p className="text-sm text-gray-700">
            Track your orders, commission, and payout status.
          </p>
        </div>
      )}

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
        <div className="space-y-5">
          {/* 1️⃣ Identity + Referral Actions */}
          <div className="border rounded p-4 bg-gray-50 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{data.affiliate.name}</div>
                {data.affiliate.city && (
                  <div className="text-sm text-gray-500">City: {data.affiliate.city}</div>
                )}
              </div>
              <Link
                href="/affiliate/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Settings
              </Link>
            </div>

            <div className="rounded-md border border-dashed border-emerald-300 bg-white px-3 py-3 space-y-2">
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
                    } catch {}
                  }}
                  className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
                >
                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>
            </div>

            {/* Smart Next Step CTA - collapse after first order */}
            {data.stats.total_orders === 0 ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-4 space-y-3">
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
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getWhatsAppMessage(data.affiliate.code));
                      setCopiedWhatsApp(true);
                      setTimeout(() => setCopiedWhatsApp(false), 2000);
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>💬</span>
                  {copiedWhatsApp ? "Copied!" : "WhatsApp"}
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
                  className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>📷</span>
                  {copiedInsta ? "Copied!" : "Instagram"}
                </button>
              </div>
            )}
          </div>

          {/* 2️⃣ Earnings Stats Row */}
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
              <div className="text-[9px] text-emerald-600 mt-0.5">Included in next payout</div>
            </div>
          </div>

          {/* 3️⃣ Next Payout Line (simple, not a card) */}
          <div className="text-xs text-gray-500 -mt-2">
            Next payout: ~10th of next month • Estimated: {Number(data.stats.payable_commission || 0).toLocaleString()} PKR
          </div>

          {/* 4️⃣ Status Banner (Collapsed by default) with Tier Badge */}
          {data.affiliate.status === 'active' && !statusExpanded && (
            <button
              onClick={() => setStatusExpanded(true)}
              className="w-full border rounded-md bg-emerald-50 border-emerald-200 px-4 py-2 flex items-center justify-between hover:bg-emerald-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✅</span>
                <span className="text-sm font-medium text-emerald-800">Active</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs font-medium text-gray-600">
                  {data.tier?.tier_name || 'Bronze'}
                  {data.tier?.next_tier_name && (
                    <span className="text-gray-400 font-normal ml-1">
                      ({data.tier.delivered_count_30d}/{data.tier.next_tier_threshold} to {data.tier.next_tier_name})
                    </span>
                  )}
                </span>
              </div>
              <span className="text-xs text-emerald-600">View details →</span>
            </button>
          )}
          {data.affiliate.status === 'warning' && (
            <div className="border rounded-md bg-amber-50 border-amber-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <span className="text-sm font-medium text-amber-800">Warning</span>
                  <span className="text-xs text-amber-700">— {data.affiliate.strike_count}/5 strikes</span>
                </div>
                <button
                  onClick={() => setStatusExpanded(!statusExpanded)}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  {statusExpanded ? 'Hide' : 'Details'}
                </button>
              </div>
              {statusExpanded && (
                <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700 space-y-1">
                  <p>You have {data.affiliate.strike_count} failed deliveries in the last 30 days.</p>
                  <p>At 5 strikes, your referral code will be automatically suspended.</p>
                  <p className="text-amber-600">Strikes expire automatically after 30 days.</p>
                </div>
              )}
            </div>
          )}
          {data.affiliate.status === 'suspended' && (
            <div className="border rounded-md bg-red-50 border-red-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600">⛔</span>
                <span className="text-sm font-medium text-red-800">Suspended</span>
                <span className="text-xs text-red-700">— Referral code disabled</span>
              </div>
              <p className="mt-2 text-xs text-red-600">
                Your affiliate code has been suspended due to too many failed deliveries. Contact support for assistance.
              </p>
            </div>
          )}

          {/* Expanded status details for active */}
          {data.affiliate.status === 'active' && statusExpanded && (
            <div className="border rounded-md bg-emerald-50 border-emerald-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✅</span>
                  <span className="text-sm font-medium text-emerald-800">Active</span>
                  <span className="text-xs text-emerald-700">— Your referral code is working</span>
                </div>
                <button
                  onClick={() => setStatusExpanded(false)}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Hide
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-700 space-y-2">
                <p><strong>Tier:</strong> {data.tier?.tier_name || 'Bronze'}</p>
                <p><strong>Delivered orders (last 30 days):</strong> {data.tier?.delivered_count_30d || 0}</p>
                {data.tier?.next_tier_name && (
                  <p><strong>Next tier:</strong> {data.tier.next_tier_name} at {data.tier.next_tier_threshold} delivered orders</p>
                )}
                <p><strong>Strike count:</strong> {data.affiliate.strike_count}/5</p>
                <p className="text-emerald-600 pt-1">Your commission increases as you deliver more orders.</p>
              </div>
            </div>
          )}

          {/* 5️⃣ Recent Orders (Last 3 only) */}
          <div className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Recent orders</h2>
              {data.orders.length > 0 && (
                <Link
                  href="/affiliate/orders"
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  View all orders →
                </Link>
              )}
            </div>
            {data.orders.length === 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-800 font-medium">You don't have any orders yet.</p>
                  <p className="text-sm text-gray-600">
                    Share your referral code with clients on WhatsApp or Instagram to start earning.
                  </p>
                </div>
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
              <div className="space-y-2">
                {data.orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">#{String(o.id).slice(-6)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        o.delivery_status === 'delivered' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : o.delivery_status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {o.delivery_status || 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {Number(o.affiliate_commission_amount || 0).toLocaleString()} PKR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6️⃣ Footer Links */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
            <Link href="/affiliate/orders" className="hover:text-emerald-600">
              View All Orders
            </Link>
            <span>•</span>
            <Link href="/affiliate/settings" className="hover:text-emerald-600">
              Account Settings
            </Link>
            <span>•</span>
            <Link href="/affiliate/terms" className="hover:text-emerald-600">
              Terms & Conditions
            </Link>
            <span>•</span>
            <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
