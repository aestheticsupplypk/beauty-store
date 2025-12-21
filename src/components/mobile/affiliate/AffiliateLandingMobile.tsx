"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

export function AffiliateLandingMobile() {
  const [showFullManifesto, setShowFullManifesto] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
   const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      const viewportH = window.innerHeight || 0;
      const docH = document.documentElement?.scrollHeight || 0;

      // Show sticky CTA once the user has scrolled past the hero and primary CTA area,
      // but hide it again when they are very close to the bottom so we don't double-show CTAs.
      const pastHero = y > 400;
      const nearBottom = y + viewportH >= docH - 80;

      setShowStickyCta(pastHero && !nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50 pb-20">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-5 text-white shadow-md space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-emerald-50/90">
              Your clients already trust you. Now let that trust pay you back.
            </p>
            <p className="text-xs text-emerald-50/90">
              آپ کے کلائنٹس پہلے ہی آپ پر اعتماد کرتے ہیں — اب اسی اعتماد کو کمائی میں بدلیں۔
            </p>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Affiliate / Beautician Partner Program</h1>
            <p className="mt-1 text-xs text-emerald-50">
              Earn from every client you recommend — without buying stock. Share your code, they save,
              you earn.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Zero investment</div>
              <div className="text-emerald-50/90">No stock, just referrals.</div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Client discount</div>
              <div className="text-emerald-50/90">Special offer for clients.</div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Dashboard</div>
              <div className="text-emerald-50/90">Track orders & income.</div>
            </div>
          </div>
        </div>

        {/* Primary CTA under hero */}
        <div className="space-y-2">
          <Link
            href="/affiliate/signup"
            className="block w-full text-center rounded-lg bg-black text-white text-sm font-medium py-2.5"
          >
            Create account (Sign up)
          </Link>
          <Link
            href="/affiliate/dashboard"
            className="block w-full text-center rounded-lg border border-gray-300 text-sm font-medium py-2.5 text-gray-800 bg-white"
          >
            Already a partner? Log in
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-white shadow-sm px-3 py-3 text-[11px] text-gray-800">
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-emerald-600">100+</span>
            <span className="text-[10px] text-gray-500">Active partners</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-emerald-600">1,000+</span>
            <span className="text-[10px] text-gray-500">Orders tracked</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-emerald-600">Up to 15%</span>
            <span className="text-[10px] text-gray-500">Per-order commission</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-emerald-600">Monthly</span>
            <span className="text-[10px] text-gray-500">Payout cycles</span>
          </div>
        </div>

        {/* Short manifesto with expandable full text */}
        <div className="border rounded-xl bg-white shadow-sm p-4 space-y-3 text-xs text-gray-800">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-900">Brand Manifesto</h2>
            <p>
              Your influence has value. Every recommendation you make can turn into real income —
              without changing how you work.
            </p>
            <p>
              آپ کی دی گئی رائے قیمتی ہے۔ اب اسی اعتماد کو کمائی میں بدلیں — بغیر اسٹاک کے، بغیر
              جھنجھٹ کے۔
            </p>
          </div>

          {showFullManifesto && (
            <div className="space-y-2 border-t border-emerald-100 pt-2 text-[11px] leading-relaxed">
              <p>
                At AestheticPK, we believe your influence has value. Every day, you recommend products,
                guide clients, and build trust — and that trust deserves to be rewarded. This is beauty
                that gives back, a platform where recommendations become rewards and trusted advice turns
                into real income.
              </p>
              <p>
                AestheticPK میں ہمارا یقین ہے کہ آپ کی رائے کی اپنی قدر ہے۔ روزانہ آپ اپنے کلائنٹس کی
                رہنمائی کرتے ہیں، انہیں بہترین پروڈکٹس کی تجویز دیتے ہیں اور ان کا اعتماد جیتتے ہیں — اور
                یہی اعتماد انعام کا حق دار ہے۔
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowFullManifesto((v) => !v)}
            className="text-[11px] font-medium text-emerald-700"
          >
            {showFullManifesto ? "Show less" : "Read full message"}
          </button>
        </div>

        {/* How it works */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-3 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">How it works</h2>
          <ol className="space-y-2 list-decimal pl-4">
            <li>Sign up in minutes as a salon, beautician or student.</li>
            <li>Get your personal referral code to share with clients.</li>
            <li>Clients order from our website and enter your code at checkout.</li>
            <li>Your clients get a discount on selected products.</li>
            <li>You earn commission on every confirmed order in your dashboard.</li>
          </ol>
        </div>

        {/* Who this is for */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">Who is this program for?</h2>
          <ul className="space-y-1">
            <li>Beauty salons & parlours.</li>
            <li>Home-based beauticians.</li>
            <li>Makeup artists & hair specialists.</li>
            <li>Beauty students & trainees.</li>
            <li>Anyone who already recommends products to clients.</li>
          </ul>
        </div>

        {/* Earnings examples - hidden behind toggle */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <button
            type="button"
            onClick={() => setShowEarnings((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-sm font-semibold">See earning examples</span>
            <span className="text-[11px] text-gray-500">{showEarnings ? "Hide" : "Show"}</span>
          </button>

          {showEarnings && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>5 regular clients</span>
                  <span className="font-semibold">≈ Rs 5,000 / month</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-50">
                  <div className="h-2 w-1/4 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>20 regular clients</span>
                  <span className="font-semibold">≈ Rs 20,000 / month</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-50">
                  <div className="h-2 w-2/4 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>50+ regular clients</span>
                  <span className="font-semibold">≈ Rs 50,000+ / month</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-50">
                  <div className="h-2 w-full rounded-full bg-emerald-500" />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Examples only – actual earnings depend on what your clients order and the commission set
                for each product.
              </p>
            </div>
          )}
        </div>

        {/* FAQ - compressed */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">Common questions</h2>
          <div className="space-y-2">
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">
                Do I need to buy any stock?
              </summary>
              <p className="mt-1 text-[11px] text-gray-700">
                No. You recommend the products, we handle stock, orders and delivery.
              </p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">Is this free to join?</summary>
              <p className="mt-1 text-[11px] text-gray-700">
                Yes. Creating your affiliate account is free. You earn on confirmed client orders.
              </p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">When do I get paid?</summary>
              <p className="mt-1 text-[11px] text-gray-700">
                Commissions are calculated on confirmed orders and paid out on a monthly cycle.
              </p>
            </details>

            {showAllFaqs && (
              <>
                <details className="rounded border border-gray-100 p-2">
                  <summary className="font-semibold cursor-pointer text-xs">
                    Can I see all my sales and earnings?
                  </summary>
                  <p className="mt-1 text-[11px] text-gray-700">
                    Yes. Your affiliate dashboard shows tracked orders, total sales and commission.
                  </p>
                </details>
                <details className="rounded border border-gray-100 p-2">
                  <summary className="font-semibold cursor-pointer text-xs">
                    Is this only for salons?
                  </summary>
                  <p className="mt-1 text-[11px] text-gray-700">
                    It&apos;s for salons, home-based beauticians, makeup artists and beauty students.
                  </p>
                </details>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAllFaqs((v) => !v)}
            className="text-[11px] font-medium text-emerald-700 mt-1"
          >
            {showAllFaqs ? "Hide extra questions" : "View all FAQs"}
          </button>
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 space-y-2">
          <p className="text-center text-xs text-gray-700">
            Start earning from the trust you&apos;ve already built with your clients.
          </p>
          <Link
            href="/affiliate/signup"
            className="block w-full text-center rounded-lg bg-black text-white text-sm font-medium py-2.5"
          >
            Create account now
          </Link>
        </div>
      </div>

      {/* Sticky bottom CTA - mobile only */}
      {showStickyCta && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 border-t border-gray-200 shadow-[0_-4px_12px_rgba(15,23,42,0.16)] md:hidden">
          <div className="max-w-md mx-auto px-4 py-2">
            <Link
              href="/affiliate/signup"
              className="block w-full text-center rounded-lg bg-black text-white text-sm font-medium py-2.5"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
