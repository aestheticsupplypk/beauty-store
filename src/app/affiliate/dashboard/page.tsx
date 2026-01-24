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
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail || !emailRegex.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, source: 'affiliate' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setForgotSuccess(true);
    } catch (err: any) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotError(null);
    setForgotSuccess(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabaseBrowser.auth.signOut();
    setData(null);
    setSigningOut(false);
  };

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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded px-3 py-2 w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-emerald-600 hover:underline"
              >
                Forgot your password?
              </button>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-center">
                  <div className="text-emerald-600 text-3xl mb-2">✓</div>
                  <p className="text-sm text-gray-700">
                    If an account exists for this email, we've sent a reset link.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please check your email inbox (and spam folder).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full bg-black text-white rounded py-2 hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {forgotError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="name@example.com"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 border border-gray-300 rounded py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-black text-white rounded py-2 hover:bg-gray-800 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
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
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  {signingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
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

            {/* WhatsApp Affiliate Group Invite */}
            <div className="rounded-md border border-green-200 bg-green-50/50 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💬</div>
                <div className="flex-1">
                  <div className="font-medium text-green-800 text-sm">Join our Affiliate WhatsApp Group</div>
                  <p className="text-xs text-gray-600 mt-1">
                    Get updates, tips, and connect with other affiliates. Scan the QR code or click the link below.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <a
                      href="https://chat.whatsapp.com/HiXVOBn7RmY1ptVrQN4R7r"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Join WhatsApp Group
                    </a>
                    <span className="text-xs text-gray-500">or scan QR code →</span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://chat.whatsapp.com/HiXVOBn7RmY1ptVrQN4R7r" 
                    alt="WhatsApp Group QR Code"
                    className="w-20 h-20 rounded border border-gray-200"
                  />
                </div>
              </div>
            </div>
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
