"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

const SHARE_TEXT_ENGLISH = `I've joined the AestheticPK Affiliate / Beautician Partner Program.

If you already recommend beauty products to clients, you can earn commission without buying stock.

Here's how it works:
• You get a personal referral code
• Your client uses it on AestheticPK
• They get a discount
• You earn commission on every confirmed order

No investment. No deliveries. No follow-ups.
AestheticPK handles orders, payments, and delivery.

It's perfect for salons, home beauticians, makeup artists, and beauty students.

If you want, I can share my code with you.`;

const SHARE_TEXT_URDU = `میں نے AestheticPK Affiliate / Beautician Partner Program جوائن کیا ہے۔

اگر آپ پہلے ہی کلائنٹس کو بیوٹی مصنوعات تجویز کرتے ہیں، تو آپ بغیر اسٹاک خریدے کمیشن کما سکتے ہیں۔

طریقہ بہت آسان ہے:
• آپ کو ایک ذاتی ریفرل کوڈ ملتا ہے
• کلائنٹ AestheticPK پر وہ کوڈ استعمال کرتا ہے
• کلائنٹ کو ڈسکاؤنٹ ملتا ہے
• ہر کنفرم آرڈر پر آپ کو کمیشن ملتا ہے

نہ سرمایہ کاری، نہ ڈیلیوری، نہ کسٹمر ہینڈلنگ۔
آرڈر، ادائیگی اور ڈیلیوری AestheticPK خود سنبھالتا ہے۔

یہ پروگرام سیلونز، ہوم بیوٹیشنز، میک اپ آرٹسٹس اور بیوٹی اسٹوڈنٹس کے لیے بہترین ہے۔

اگر آپ چاہیں تو میں آپ کو اپنا کوڈ بھیج سکتی / سکتا ہوں۔`;

const INSTA_BIO_PROFESSIONAL = `Beauty recommendations that pay 💼
Partnered with AestheticPK
Clients save • I earn commission
DM for my code ✨`;

const INSTA_BIO_URDU = `بیوٹی پروڈکٹس جو میں خود استعمال کرتی ہوں 💄
Affiliate @ AestheticPK
کلائنٹس کو ڈسکاؤنٹ، مجھے کمیشن
کوڈ کے لیے DM کریں ✨`;

const INSTA_BIO_BILINGUAL = `Beauty I trust 💄 | AestheticPK Partner
کلائنٹس کو ڈسکاؤنٹ • مجھے کمیشن
DM for my code ✨`;

export function AffiliateLandingMobile() {
  const [showFullManifesto, setShowFullManifesto] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedBio, setCopiedBio] = useState<string | null>(null);

  const copyToClipboard = (type: 'english' | 'urdu' | 'both') => {
    let text = '';
    if (type === 'english') text = SHARE_TEXT_ENGLISH;
    else if (type === 'urdu') text = SHARE_TEXT_URDU;
    else text = SHARE_TEXT_ENGLISH + '\n\n---\n\n' + SHARE_TEXT_URDU;
    
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyBioToClipboard = (type: 'professional' | 'urdu' | 'bilingual') => {
    let text = '';
    if (type === 'professional') text = INSTA_BIO_PROFESSIONAL;
    else if (type === 'urdu') text = INSTA_BIO_URDU;
    else text = INSTA_BIO_BILINGUAL;
    
    navigator.clipboard.writeText(text);
    setCopiedBio(type);
    setTimeout(() => setCopiedBio(null), 2000);
  };

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
      {/* Top bar with Sign in */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">
          <span className="text-xs text-gray-600">AestheticPK Affiliate</span>
          <Link
            href="/affiliate/dashboard"
            className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-600 text-xs font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-5 text-white shadow-md space-y-3">
          {/* Trust line */}
          <p className="text-xs font-medium text-emerald-50/90">
            Your clients already trust you. Now let that trust pay you back.
          </p>

          {/* Main heading */}
          <h1 className="text-xl font-semibold">Affiliate / Beautician Partner Program</h1>

          {/* Sub-heading English */}
          <p className="text-xs text-emerald-50">
            Earn from the products you already recommend — without buying stock, handling payments, or managing delivery. AestheticPK takes care of everything.
          </p>

          {/* Power Line Urdu */}
          <p className="text-base font-medium text-right leading-relaxed text-yellow-100" dir="rtl">
            جو پروڈکٹس آپ روز اپنے کلائنٹس کو تجویز کرتے ہیں، اب انہی سے ہر مہینے کمائیں — بغیر اسٹاک، بغیر سرمایہ کاری۔
          </p>

          {/* Value Pills - bilingual */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Zero investment</div>
              <div className="text-white" dir="rtl">نہ اسٹاک، نہ بلک خریداری</div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Client discount</div>
              <div className="text-white" dir="rtl">کلائنٹس کو خصوصی آفر</div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Monthly payout</div>
              <div className="text-white" dir="rtl">ہر مہینے کمیشن کی ادائیگی</div>
            </div>
            <div className="bg-white/10 rounded-lg px-2 py-1.5">
              <div className="font-semibold">Dashboard</div>
              <div className="text-white" dir="rtl">ہر آرڈر اور کمائی نظر آئے</div>
            </div>
          </div>
        </div>

        {/* Primary CTA under hero */}
        <div className="space-y-3">
          <Link
            href="/affiliate/signup"
            className="block w-full text-center rounded-lg bg-black text-white text-sm font-medium py-3 shadow-md"
          >
            Create account (Sign up)
          </Link>
          <Link
            href="/affiliate/dashboard"
            className="block w-full text-center rounded-lg bg-emerald-600 text-white text-sm font-medium py-3 shadow-md"
          >
            Already have an account? Sign in
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
              <div className="space-y-2 text-right" dir="rtl">
                <p>
                  AestheticPK اس یقین پر قائم ہے کہ آپ کی مہارت، آپ کی رہنمائی، اور آپ کا اثر حقیقی قدر رکھتے ہیں۔ آپ روزانہ اپنے کلائنٹس کو درست مصنوعات کے انتخاب میں مدد دیتے ہیں، ان کی خوبصورتی سے متعلق فیصلوں کی رہنمائی کرتے ہیں، اور ان کے اعتماد کو مضبوط بناتے ہیں — اور یہی اعتماد کامیاب اور دیرپا تعلقات کی بنیاد بنتا ہے۔
                </p>
                <p>
                  AestheticPK ایک ایسا پلیٹ فارم ہے جہاں خوبصورتی محض ایک خدمت نہیں بلکہ ایک باوقار اور فائدہ مند پیشہ بن جاتی ہے۔ یہاں آپ کی پیشہ ورانہ رائے اور آپ کی دی گئی رہنمائی صرف مشورہ نہیں رہتی بلکہ ایک منصفانہ اور حقیقی آمدن میں تبدیل ہو جاتی ہے۔
                </p>
                <p>
                  AestheticPK آپ سے یہ مطالبہ نہیں کرتا کہ آپ اپنا طریقۂ کار بدلیں یا اپنی پہچان کو نئے سرے سے تشکیل دیں۔ آپ وہی کام کرتے رہتے ہیں جو آپ پہلے سے کر رہے ہیں — فرق صرف یہ ہے کہ اب آپ کی محنت اور تجربے کو اس کی اصل قدر کے مطابق صلہ ملتا ہے۔
                </p>
                <p>
                  AestheticPK اس بات کو تسلیم کرتا ہے کہ آپ کی مہارت قیمتی ہے، آپ کا تجربہ معتبر ہے، اور آپ کی روزمرہ فراہم کردہ رہنمائی معاشی اہمیت رکھتی ہے۔ اسی سوچ کے تحت یہ پلیٹ فارم بنایا گیا ہے تاکہ آپ کی پیشہ ورانہ شناخت کو مضبوط کیا جا سکے۔
                </p>
                <p>
                  AestheticPK کا نظام سادہ، شفاف، اور اعتماد پر مبنی ہے۔ آپ معیاری مصنوعات تجویز کرتے ہیں، اپنے کلائنٹس کی بہتر رہنمائی کرتے ہیں، اور اپنی پیشہ ورانہ ساکھ کے ذریعے مستقل کمائی حاصل کرتے ہیں — بغیر کسی اضافی دباؤ کے۔
                </p>
                <p>
                  AestheticPK وہ جگہ ہے جہاں خوبصورتی کمائی میں بدلتی ہے، اور جہاں اعتماد محض ایک احساس نہیں بلکہ ایک مستحکم آمدن بن جاتا ہے۔
                </p>
              </div>
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

        {/* No inventory - English */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">No inventory. No upfront investment.</h2>
          <p>Just recommend products you already trust — we handle orders, payments, delivery, and customer support.</p>
        </div>

        {/* No inventory - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">نہ اسٹاک، نہ سرمایہ کاری</h2>
          <p className="text-sm leading-relaxed">
            AestheticPK کے ساتھ کام کرنے کے لیے آپ کو نہ کوئی اسٹاک رکھنے کی ضرورت ہے اور نہ ہی کسی قسم کی پیشگی سرمایہ کاری کرنی ہوتی ہے۔ آپ صرف وہی مصنوعات تجویز کرتے ہیں جن پر آپ خود اعتماد کرتے ہیں۔
          </p>
        </div>

        {/* How it works - English */}
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

        {/* How it works - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-3 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">یہ پروگرام کیسے کام کرتا ہے؟</h2>
          <ol className="space-y-2 list-decimal pr-4 text-sm leading-relaxed">
            <li><span className="font-semibold">چند منٹ میں رجسٹریشن</span> — AestheticPK پر مفت اکاؤنٹ بنائیں</li>
            <li><span className="font-semibold">اپنا ذاتی ریفرل کوڈ حاصل کریں</span> — کلائنٹس کے ساتھ شیئر کریں</li>
            <li><span className="font-semibold">کلائنٹس ویب سائٹ سے آرڈر کرتے ہیں</span> — آپ کا کوڈ استعمال کرتے ہیں</li>
            <li><span className="font-semibold">کلائنٹ کو خصوصی رعایت ملتی ہے</span> — ڈسکاؤنٹ آفر ملتی ہے</li>
            <li><span className="font-semibold">آپ کمیشن کماتے ہیں</span> — ڈیش بورڈ میں شامل ہو جاتا ہے</li>
          </ol>
        </div>

        {/* Why join - English */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">Why join our program?</h2>
          <ul className="space-y-1">
            <li>• No upfront investment — no stock to buy, no bulk orders, no financial risk.</li>
            <li>• Exclusive client benefits — your referral code unlocks special pricing.</li>
            <li>• Commission on every confirmed order — not just the first purchase.</li>
            <li>• Your own personal referral code — easy to share, easy to remember.</li>
            <li>• Clear earnings dashboard — track every order and payout in real time.</li>
            <li>• Built for beauty professionals — salons, home beauticians, and students.</li>
          </ul>
        </div>

        {/* Why join - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">لوگ اس پروگرام کو کیوں جوائن کرتے ہیں؟</h2>
          <ul className="space-y-1 text-sm leading-relaxed">
            <li>• بغیر سرمایہ کاری — نہ اسٹاک خریدنے کی ضرورت، نہ بلک آرڈر، نہ مالی رسک۔</li>
            <li>• کلائنٹس کے لیے خصوصی فائدہ — آپ کے ریفرل کوڈ سے خاص رعایت ملتی ہے۔</li>
            <li>• ہر کنفرم آرڈر پر کمیشن — صرف پہلی خریداری تک محدود نہیں۔</li>
            <li>• آپ کا ذاتی ریفرل کوڈ — آسانی سے شیئر کریں، آسانی سے پہچانا جائے۔</li>
            <li>• واضح ڈیش بورڈ — ہر آرڈر، کمیشن اور ادائیگی تفصیل سے دیکھیں۔</li>
            <li>• بیوٹی پروفیشنلز کے لیے بنایا گیا — سیلونز، ہوم بیوٹیشنز اور طلبہ کے لیے۔</li>
          </ul>
        </div>

        {/* Who this is for - English */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">Who is this program for?</h2>
          <p className="text-gray-700">This program is designed for people who already guide clients on beauty choices:</p>
          <ul className="space-y-1">
            <li>• Beauty salons & parlours</li>
            <li>• Home-based beauticians</li>
            <li>• Makeup artists & hair specialists</li>
            <li>• Beauty students & trainees</li>
            <li>• Anyone who already recommends beauty products to clients</li>
          </ul>
          <p className="text-gray-600 mt-1">You focus on your clients. AestheticPK handles orders, payments, delivery, and support.</p>
        </div>

        {/* Who this is for - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">یہ پروگرام کن لوگوں کے لیے ہے؟</h2>
          <p className="text-sm leading-relaxed">یہ پروگرام اُن افراد کے لیے بنایا گیا ہے جو پہلے ہی کلائنٹس کو بیوٹی کے حوالے سے رہنمائی دیتے ہیں:</p>
          <ul className="space-y-1 text-sm leading-relaxed">
            <li>• بیوٹی سیلونز اور پارلرز</li>
            <li>• گھر سے کام کرنے والی بیوٹیشنز</li>
            <li>• میک اپ آرٹسٹس اور ہیئر اسپیشلسٹس</li>
            <li>• بیوٹی کے طلبہ اور ٹرینی</li>
            <li>• وہ تمام افراد جو کلائنٹس کو بیوٹی مصنوعات تجویز کرتے ہیں</li>
          </ul>
          <p className="text-sm text-gray-600 mt-1">آپ کلائنٹس پر توجہ دیں — آرڈر، ادائیگی، ڈیلیوری اور سپورٹ AestheticPK سنبھالتا ہے۔</p>
        </div>

        {/* Earnings examples - English */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">How your earnings can grow</h2>
          <div className="space-y-3">
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
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Actual earnings depend on client activity and order frequency.</p>
        </div>

        {/* Earnings examples - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">آپ کی کمائی کیسے بڑھ سکتی ہے</h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">≈ 5,000 روپے / ماہ</span>
                <span>5 مستقل کلائنٹس</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-50">
                <div className="h-2 w-1/4 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">≈ 20,000 روپے / ماہ</span>
                <span>20 مستقل کلائنٹس</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-50">
                <div className="h-2 w-2/4 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">≈ 50,000+ روپے / ماہ</span>
                <span>50+ مستقل کلائنٹس</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-50">
                <div className="h-2 w-full rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">اصل کمائی کلائنٹس کے آرڈر کرنے کی تعداد اور فریکوئنسی پر منحصر ہوتی ہے۔</p>
        </div>

        {/* FAQ - English */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-xs text-gray-800">
          <h2 className="text-sm font-semibold">Common questions</h2>
          <div className="space-y-2">
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">Do I need to buy any stock?</summary>
              <p className="mt-1 text-[11px] text-gray-700">No. You recommend the products, we handle stock, orders and delivery.</p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">Is this free to join?</summary>
              <p className="mt-1 text-[11px] text-gray-700">Yes. Creating your affiliate account is free.</p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer text-xs">When do I get paid?</summary>
              <p className="mt-1 text-[11px] text-gray-700">Commissions are calculated on confirmed orders and paid out monthly.</p>
            </details>
          </div>
        </div>

        {/* FAQ - Urdu */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-right" dir="rtl">
          <h2 className="text-sm font-semibold">عام سوالات</h2>
          <div className="space-y-2 text-sm">
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer">کیا مجھے کوئی پروڈکٹ خریدنا ہوگا؟</summary>
              <p className="mt-1 text-gray-700">نہیں۔ آپ صرف تجویز کریں، اسٹاک، آرڈرز اور ڈیلیوری ہم سنبھالتے ہیں۔</p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer">کیا رجسٹریشن فیس ہے؟</summary>
              <p className="mt-1 text-gray-700">نہیں۔ ایفیلیئیٹ اکاؤنٹ بنانا مفت ہے۔</p>
            </details>
            <details className="rounded border border-gray-100 p-2">
              <summary className="font-semibold cursor-pointer">مجھے پیسے کب ملتے ہیں؟</summary>
              <p className="mt-1 text-gray-700">کمیشن کنفرم شدہ آرڈرز پر حساب ہوتا ہے اور ماہانہ ادا کیا جاتا ہے۔</p>
            </details>
          </div>
        </div>

        {/* Share with friends section */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-3">
          <div className="text-center">
            <h2 className="text-sm font-semibold">Share with friends / دوستوں کے ساتھ شیئر کریں</h2>
            <p className="text-sm text-emerald-700 font-medium mt-2">Copy a ready-made message to share on WhatsApp</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => copyToClipboard('english')}
              className="rounded-lg px-2 py-2 border border-gray-300 text-xs font-medium text-gray-800 hover:bg-gray-50"
            >
              {copied === 'english' ? '✓ Copied!' : 'English'}
            </button>
            <button
              onClick={() => copyToClipboard('urdu')}
              className="rounded-lg px-2 py-2 border border-gray-300 text-xs font-medium text-gray-800 hover:bg-gray-50"
            >
              {copied === 'urdu' ? '✓ کاپی!' : 'اردو'}
            </button>
            <button
              onClick={() => copyToClipboard('both')}
              className="rounded-lg px-2 py-2 bg-emerald-100 border border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
            >
              {copied === 'both' ? '✓ Done!' : 'Both'}
            </button>
          </div>
        </div>

        {/* Instagram Bio section */}
        <div className="border rounded-lg bg-white shadow-sm p-4 space-y-3">
          <div className="text-center">
            <h2 className="text-sm font-semibold">Instagram Bio / انسٹاگرام بائیو</h2>
            <p className="text-sm text-emerald-700 font-medium mt-2">Copy a ready-made bio for your profile</p>
          </div>
          <div className="space-y-3">
            {/* Professional English */}
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Professional (English)</p>
              <p className="text-xs whitespace-pre-line text-gray-800">{INSTA_BIO_PROFESSIONAL}</p>
              <button
                onClick={() => copyBioToClipboard('professional')}
                className="w-full rounded-lg px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-800 hover:bg-white"
              >
                {copiedBio === 'professional' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            {/* Urdu */}
            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <p className="text-[10px] font-semibold text-gray-500 uppercase">Urdu / اردو</p>
              <p className="text-xs whitespace-pre-line text-gray-800 text-right" dir="rtl">{INSTA_BIO_URDU}</p>
              <button
                onClick={() => copyBioToClipboard('urdu')}
                className="w-full rounded-lg px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-800 hover:bg-white"
              >
                {copiedBio === 'urdu' ? '✓ کاپی ہو گیا!' : 'Copy'}
              </button>
            </div>
            {/* Bilingual */}
            <div className="border rounded-lg p-3 space-y-2 bg-emerald-50">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase">Bilingual (Recommended)</p>
              <p className="text-xs whitespace-pre-line text-gray-800">{INSTA_BIO_BILINGUAL}</p>
              <button
                onClick={() => copyBioToClipboard('bilingual')}
                className="w-full rounded-lg px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
              >
                {copiedBio === 'bilingual' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 text-center">Add-ons: Nationwide delivery 🇵🇰 • No stock | No investment</p>
        </div>

        {/* Bottom CTA */}
        <div className="pt-6 space-y-4">
          <p className="text-center text-xs text-gray-700">
            Start earning from the trust you&apos;ve already built with your clients.
          </p>
          <p className="text-center text-xs text-gray-700" dir="rtl">
            اپنے بنائے گئے اعتماد سے آج ہی کمائی شروع کریں۔
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <Link
                href="/affiliate/signup"
                className="block text-center rounded-xl bg-black text-white text-base font-semibold px-8 py-3.5 shadow-lg"
              >
                Create account (Sign up)
              </Link>
              <p className="text-[10px] text-gray-500 text-center mt-2">Free to join. No payment details required.</p>
              <p className="text-[10px] text-gray-500 text-center" dir="rtl">رجسٹریشن مفت ہے۔ کسی قسم کی ادائیگی کی معلومات درکار نہیں۔</p>
            </div>
            <Link
              href="/affiliate/dashboard"
              className="px-5 py-2 rounded-lg border-2 border-emerald-600 text-emerald-600 text-sm font-medium"
            >
              Already have an account? Sign in
            </Link>
          </div>
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
