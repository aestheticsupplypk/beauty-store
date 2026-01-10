import React, { useState } from "react";

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

export function AffiliateLandingWeb() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedBio, setCopiedBio] = useState<string | null>(null);

  const copyBioToClipboard = (type: 'professional' | 'urdu' | 'bilingual') => {
    let text = '';
    if (type === 'professional') text = INSTA_BIO_PROFESSIONAL;
    else if (type === 'urdu') text = INSTA_BIO_URDU;
    else text = INSTA_BIO_BILINGUAL;
    
    navigator.clipboard.writeText(text);
    setCopiedBio(type);
    setTimeout(() => setCopiedBio(null), 2000);
  };

  const copyToClipboard = (type: 'english' | 'urdu' | 'both') => {
    let text = '';
    if (type === 'english') text = SHARE_TEXT_ENGLISH;
    else if (type === 'urdu') text = SHARE_TEXT_URDU;
    else text = SHARE_TEXT_ENGLISH + '\n\n---\n\n' + SHARE_TEXT_URDU;
    
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      {/* Top bar with Sign in */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">AestheticPK Affiliate Program</span>
          <a
            href="/affiliate/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600 text-emerald-600 text-sm font-medium hover:bg-emerald-50"
          >
            Sign in
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-6 text-white shadow-md space-y-4">
          {/* Trust line */}
          <p className="text-sm font-medium text-emerald-50/90">
            Your clients already trust you. Now let that trust pay you back.
          </p>

          {/* Main heading */}
          <h1 className="text-3xl font-semibold">Affiliate / Beautician Partner Program</h1>

          {/* Sub-heading English */}
          <p className="text-base text-emerald-50">
            Earn from the products you already recommend — without buying stock, handling payments, or managing delivery.
            AestheticPK takes care of everything. You focus on your clients.
          </p>

          {/* Power Line Urdu */}
          <p className="text-xl font-medium text-right leading-relaxed text-yellow-100" dir="rtl">
            جو پروڈکٹس آپ روز اپنے کلائنٹس کو تجویز کرتے ہیں، اب انہی سے ہر مہینے کمائیں — بغیر اسٹاک، بغیر سرمایہ کاری، اور بغیر کسی اضافی ذمہ داری کے۔
          </p>

          {/* Supporting Urdu paragraph */}
          <p className="text-base text-right text-white/90 leading-relaxed" dir="rtl">
            AestheticPK کے ساتھ آپ صرف وہی پروڈکٹس ریکمینڈ کرتے ہیں جن پر آپ خود اعتماد کرتے ہیں۔ آرڈرز، ادائیگی، ڈیلیوری اور کسٹمر سپورٹ — سب کچھ AestheticPK سنبھالتا ہے، جبکہ ہر کنفرم آرڈر پر آپ کو کمیشن ملتا ہے۔
          </p>

          {/* Value Pills - bilingual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Zero investment</div>
              <div className="text-white text-sm" dir="rtl">نہ اسٹاک، نہ بلک خریداری</div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Client discount</div>
              <div className="text-white text-sm" dir="rtl">آپ کے کوڈ سے کلائنٹس کو خصوصی آفر</div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Monthly payout</div>
              <div className="text-white text-sm" dir="rtl">ہر مہینے کمیشن کی ادائیگی</div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Dashboard tracking</div>
              <div className="text-white text-sm" dir="rtl">ہر آرڈر اور کمائی واضح طور پر نظر آئے</div>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl bg-white shadow-sm px-4 py-4 text-sm text-gray-800">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-emerald-600">100+</span>
            <span className="text-xs uppercase tracking-wide text-gray-500">Active partners</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-emerald-600">1,000+</span>
            <span className="text-xs uppercase tracking-wide text-gray-500">Orders tracked</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-emerald-600">Up to 15%</span>
            <span className="text-xs uppercase tracking-wide text-gray-500">Per-order commission</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-emerald-600">Monthly</span>
            <span className="text-xs uppercase tracking-wide text-gray-500">Payout cycles</span>
          </div>
        </div>

        {/* Social proof */}
        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
          Trusted by salons, home beauticians and beauty students across Pakistan.
        </p>

        {/* Brand Manifesto / برانڈ پیغام */}
        <div className="border rounded-xl bg-white/90 shadow-sm p-6 space-y-4 text-base text-gray-800">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Brand Manifesto</h2>
            <p>
              At AestheticPK, we believe your influence has value. Every day, you recommend products,
              guide clients, and build trust — and that trust deserves to be rewarded. This is beauty
              that gives back, a platform where recommendations become rewards and trusted advice turns
              into real income. You don’t need to change what you do — simply earn from what you already
              do. Because your skills deserve more, and your everyday advice is valuable. Here, it’s
              simple: recommend, earn, repeat. This is beauty, rewarded — where beauty earns, and where
              trust truly becomes income.
            </p>
          </div>

          <div className="border-t border-emerald-100 pt-4 space-y-3 text-right" dir="rtl">
            <h2 className="text-xl font-semibold text-gray-900">برانڈ پیغام</h2>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK اس یقین پر قائم ہے کہ آپ کی مہارت، آپ کی رہنمائی، اور آپ کا اثر حقیقی قدر رکھتے ہیں۔ آپ روزانہ اپنے کلائنٹس کو درست مصنوعات کے انتخاب میں مدد دیتے ہیں، ان کی خوبصورتی سے متعلق فیصلوں کی رہنمائی کرتے ہیں، اور ان کے اعتماد کو مضبوط بناتے ہیں — اور یہی اعتماد کامیاب اور دیرپا تعلقات کی بنیاد بنتا ہے۔
            </p>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK ایک ایسا پلیٹ فارم ہے جہاں خوبصورتی محض ایک خدمت نہیں بلکہ ایک باوقار اور فائدہ مند پیشہ بن جاتی ہے۔ یہاں آپ کی پیشہ ورانہ رائے اور آپ کی دی گئی رہنمائی صرف مشورہ نہیں رہتی بلکہ ایک منصفانہ اور حقیقی آمدن میں تبدیل ہو جاتی ہے۔
            </p>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK آپ سے یہ مطالبہ نہیں کرتا کہ آپ اپنا طریقۂ کار بدلیں یا اپنی پہچان کو نئے سرے سے تشکیل دیں۔ آپ وہی کام کرتے رہتے ہیں جو آپ پہلے سے کر رہے ہیں — فرق صرف یہ ہے کہ اب آپ کی محنت اور تجربے کو اس کی اصل قدر کے مطابق صلہ ملتا ہے۔
            </p>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK اس بات کو تسلیم کرتا ہے کہ آپ کی مہارت قیمتی ہے، آپ کا تجربہ معتبر ہے، اور آپ کی روزمرہ فراہم کردہ رہنمائی معاشی اہمیت رکھتی ہے۔ اسی سوچ کے تحت یہ پلیٹ فارم بنایا گیا ہے تاکہ آپ کی پیشہ ورانہ شناخت کو مضبوط کیا جا سکے۔
            </p>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK کا نظام سادہ، شفاف، اور اعتماد پر مبنی ہے۔ آپ معیاری مصنوعات تجویز کرتے ہیں، اپنے کلائنٹس کی بہتر رہنمائی کرتے ہیں، اور اپنی پیشہ ورانہ ساکھ کے ذریعے مستقل کمائی حاصل کرتے ہیں — بغیر کسی اضافی دباؤ کے۔
            </p>
            <p className="leading-relaxed text-lg md:text-xl">
              AestheticPK وہ جگہ ہے جہاں خوبصورتی کمائی میں بدلتی ہے، اور جہاں اعتماد محض ایک احساس نہیں بلکہ ایک مستحکم آمدن بن جاتا ہے۔
            </p>
          </div>
        </div>

        {/* No inventory section - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="border rounded-lg p-5 bg-white shadow-sm text-base text-gray-700 space-y-2">
            <p className="font-medium text-gray-900">No inventory. No upfront investment.</p>
            <p>
              Just recommend products you already trust — we handle orders, payments, delivery, and
              customer support.
            </p>
            <p>
              You don't need to buy stock or manage logistics. Simply share your code with clients and start earning from every confirmed order.
            </p>
          </div>
          <div className="border rounded-lg p-5 bg-white shadow-sm space-y-2 text-right" dir="rtl">
            <p className="font-medium text-gray-900 text-lg">نہ اسٹاک، نہ سرمایہ کاری</p>
            <p className="text-lg leading-relaxed text-gray-700">
              AestheticPK کے ساتھ کام کرنے کے لیے آپ کو نہ کوئی اسٹاک رکھنے کی ضرورت ہے اور نہ ہی کسی قسم کی پیشگی سرمایہ کاری کرنی ہوتی ہے۔
            </p>
            <p className="text-lg leading-relaxed text-gray-700">
              آپ صرف وہی مصنوعات تجویز کرتے ہیں جن پر آپ خود اعتماد کرتے ہیں۔ آرڈر لینا، ادائیگی وصول کرنا، ڈیلیوری اور کسٹمر سپورٹ — یہ سب AestheticPK خود سنبھالتا ہے۔
            </p>
          </div>
        </div>

        {/* How it works section - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="space-y-4 border rounded-lg p-5 bg-white shadow-md">
            <h2 className="font-medium text-lg">How it works</h2>
            <ol className="list-decimal pl-5 text-base space-y-2">
              <li>
                <span className="font-semibold">Sign up in minutes</span> – create your free affiliate
                account as a salon, beautician or student.
              </li>
              <li>
                <span className="font-semibold">Get your unique referral code</span> – share it with
                clients on WhatsApp, Instagram, or inside your parlour.
              </li>
              <li>
                <span className="font-semibold">Clients order from our website</span> – they enter your
                code at checkout.
              </li>
              <li>
                <span className="font-semibold">They get a discount</span> – your referral code unlocks
                a special offer for them.
              </li>
              <li>
                <span className="font-semibold">You earn commission</span> – every confirmed order is
                recorded in your dashboard and commission is added to your account.
              </li>
            </ol>
          </div>
          <div className="space-y-4 border rounded-lg p-5 bg-white shadow-md text-right" dir="rtl">
            <h2 className="font-medium text-lg">یہ پروگرام کیسے کام کرتا ہے؟</h2>
            <ol className="list-decimal pr-5 text-lg space-y-3 leading-relaxed">
              <li>
                <span className="font-semibold">چند منٹ میں رجسٹریشن</span> — AestheticPK پر مفت اکاؤنٹ بنائیں — بطور سیلون، بیوٹیشن یا طالب علم۔
              </li>
              <li>
                <span className="font-semibold">اپنا ذاتی ریفرل کوڈ حاصل کریں</span> — یہ کوڈ صرف آپ کے لیے ہوگا، جسے آپ اپنے کلائنٹس کے ساتھ شیئر کریں گے۔
              </li>
              <li>
                <span className="font-semibold">کلائنٹس ویب سائٹ سے آرڈر کرتے ہیں</span> — کلائنٹ چیک آؤٹ کے وقت آپ کا ریفرل کوڈ استعمال کرتے ہیں۔
              </li>
              <li>
                <span className="font-semibold">کلائنٹ کو خصوصی رعایت ملتی ہے</span> — آپ کے کوڈ سے کلائنٹ کو ڈسکاؤنٹ آفر ملتی ہے۔
              </li>
              <li>
                <span className="font-semibold">آپ کمیشن کماتے ہیں</span> — ہر کنفرم شدہ آرڈر کا کمیشن خودکار طور پر آپ کے ڈیش بورڈ میں شامل ہو جاتا ہے۔
              </li>
            </ol>
          </div>
        </div>

        {/* Why join section - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
            <h2 className="font-medium text-lg">Why join our program?</h2>
            <ul className="grid grid-cols-1 gap-2 text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>No upfront investment — no stock to buy, no bulk orders, no financial risk.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Exclusive client benefits — your referral code unlocks special pricing for your clients.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Commission on every confirmed order — not just the first purchase.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Your own personal referral code — easy to share, easy to remember.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Clear earnings dashboard — track every order, commission, and payout in real time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Built for beauty professionals — ideal for salons, home beauticians, and students.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md text-right" dir="rtl">
            <h2 className="font-medium text-lg">لوگ اس پروگرام کو کیوں جوائن کرتے ہیں؟</h2>
            <ul className="grid grid-cols-1 gap-2 text-lg leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>بغیر سرمایہ کاری — نہ اسٹاک خریدنے کی ضرورت، نہ بلک آرڈر، نہ مالی رسک۔</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>کلائنٹس کے لیے خصوصی فائدہ — آپ کے ریفرل کوڈ سے کلائنٹس کو خاص رعایت ملتی ہے۔</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>ہر کنفرم آرڈر پر کمیشن — صرف پہلی خریداری تک محدود نہیں۔</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>آپ کا ذاتی ریفرل کوڈ — آسانی سے شیئر کریں، آسانی سے پہچانا جائے۔</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>واضح ڈیش بورڈ — ہر آرڈر، کمیشن اور ادائیگی تفصیل سے دیکھیں۔</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>بیوٹی پروفیشنلز کے لیے بنایا گیا — سیلونز، ہوم بیوٹیشنز اور طلبہ کے لیے بہترین۔</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Who this is for section - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
            <h2 className="font-medium text-lg">Who is this program for?</h2>
            <p className="text-base text-gray-700">This program is designed for people who already guide clients on beauty choices:</p>
            <ul className="grid grid-cols-1 gap-2 text-base">
              <li>• Beauty salons & parlours</li>
              <li>• Home-based beauticians</li>
              <li>• Makeup artists & hair specialists</li>
              <li>• Beauty students & trainees</li>
              <li>• Anyone who already recommends beauty products to clients</li>
            </ul>
            <p className="text-sm text-gray-600 mt-1">
              You focus on your clients. AestheticPK handles orders, payments, delivery, and support.
            </p>
          </div>
          <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md text-right" dir="rtl">
            <h2 className="font-medium text-lg">یہ پروگرام کن لوگوں کے لیے ہے؟</h2>
            <p className="text-lg leading-relaxed">یہ پروگرام اُن افراد کے لیے بنایا گیا ہے جو پہلے ہی کلائنٹس کو بیوٹی کے حوالے سے رہنمائی دیتے ہیں:</p>
            <ul className="grid grid-cols-1 gap-2 text-lg leading-relaxed">
              <li>• بیوٹی سیلونز اور پارلرز</li>
              <li>• گھر سے کام کرنے والی بیوٹیشنز</li>
              <li>• میک اپ آرٹسٹس اور ہیئر اسپیشلسٹس</li>
              <li>• بیوٹی کے طلبہ اور ٹرینی</li>
              <li>• وہ تمام افراد جو کلائنٹس کو بیوٹی مصنوعات تجویز کرتے ہیں</li>
            </ul>
            <p className="text-base text-gray-600 mt-1">
              آپ کلائنٹس پر توجہ دیں — آرڈر، ادائیگی، ڈیلیوری اور سپورٹ AestheticPK سنبھالتا ہے۔
            </p>
          </div>
        </div>

        {/* Real example section - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="border rounded-lg bg-emerald-50/70 shadow-sm p-5 space-y-2 text-sm text-gray-800">
            <h2 className="font-medium text-base text-gray-900">Real example</h2>
            <p>
              A home-based beautician shares her code with around 15 regular clients. Even if only 8 of
              them place orders each month, she earns commission on every confirmed order – without
              handling stock, payments or delivery.
            </p>
            <p>
              The more clients you refer, the more you earn. It's passive income from the trust you've already built.
            </p>
          </div>
          <div className="border rounded-lg bg-emerald-50/70 shadow-sm p-5 space-y-3 text-right" dir="rtl">
            <h2 className="font-medium text-lg text-gray-900">ایک سادہ مثال</h2>
            <p className="text-lg leading-relaxed text-gray-800">
              فرض کریں ایک ہوم بیسڈ بیوٹیشن اپنے تقریباً 15 مستقل کلائنٹس کے ساتھ اپنا ریفرل کوڈ شیئر کرتی ہے۔
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              اگر ان میں سے صرف 8 کلائنٹس بھی ہر مہینے آرڈر دیتے ہیں، تو ہر کنفرم شدہ آرڈر پر اسے کمیشن ملتا رہتا ہے — بغیر اسٹاک رکھے، بغیر پیسے لگائے، اور بغیر ڈیلیوری سنبھالے۔
            </p>
          </div>
        </div>

        {/* Earnings potential - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-baseline">
              <h2 className="font-medium text-lg">How your earnings can grow</h2>
              <span className="text-xs text-gray-500">Example only</span>
            </div>
            <p className="text-sm text-gray-600">
              These examples show how regular client orders can turn into monthly commission.
            </p>
            <div className="space-y-3 text-sm text-gray-800">
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
            <p className="text-xs text-gray-500 mt-2">Actual earnings depend on client activity and order frequency.</p>
          </div>
          <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4 text-right" dir="rtl">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">صرف مثال</span>
              <h2 className="font-medium text-lg">آپ کی کمائی کیسے بڑھ سکتی ہے</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              یہ مثالیں دکھاتی ہیں کہ کلائنٹس کے باقاعدہ آرڈرز ماہانہ کمیشن میں کیسے بدل سکتے ہیں۔
            </p>
            <div className="space-y-3 text-sm text-gray-800">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">≈ 5,000 روپے / ماہ</span>
                  <span>5 مستقل کلائنٹس</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-50">
                  <div className="h-2 w-1/4 rounded-full bg-emerald-500 mr-auto" />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">≈ 20,000 روپے / ماہ</span>
                  <span>20 مستقل کلائنٹس</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-50">
                  <div className="h-2 w-2/4 rounded-full bg-emerald-500 mr-auto" />
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
            <p className="text-xs text-gray-500 mt-2">اصل کمائی کلائنٹس کے آرڈر کرنے کی تعداد اور فریکوئنسی پر منحصر ہوتی ہے۔</p>
          </div>
        </div>

        {/* FAQ / Common questions - English left, Urdu right */}
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4">
            <h2 className="font-medium text-lg">Common questions</h2>
            <div className="space-y-3 text-sm text-gray-800">
              <div className="space-y-1">
                <p className="font-semibold">Do I need to buy any products?</p>
                <p>No. You recommend the products, we handle stock, orders and delivery.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Is there any registration fee?</p>
                <p>No. Creating your affiliate account is free.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">When do I get paid?</p>
                <p>Commissions are calculated on confirmed orders and paid out on a monthly cycle.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">What if a client forgets my code?</p>
                <p>Only orders placed with your code are tracked and counted towards your commission.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Can I see all my sales and earnings?</p>
                <p>Yes. Your affiliate dashboard shows tracked orders, total sales and commission.</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Is this only for salons?</p>
                <p>It's for salons, home-based beauticians, makeup artists and beauty students.</p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4 text-right" dir="rtl">
            <h2 className="font-medium text-lg">عام سوالات</h2>
            <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
              <div className="space-y-1">
                <p className="font-semibold">کیا مجھے کوئی پروڈکٹ خریدنا ہوگا؟</p>
                <p>نہیں۔ آپ صرف تجویز کریں، اسٹاک، آرڈرز اور ڈیلیوری ہم سنبھالتے ہیں۔</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">کیا رجسٹریشن فیس ہے؟</p>
                <p>نہیں۔ ایفیلیئیٹ اکاؤنٹ بنانا مفت ہے۔</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">مجھے پیسے کب ملتے ہیں؟</p>
                <p>کمیشن کنفرم شدہ آرڈرز پر حساب ہوتا ہے اور ماہانہ ادا کیا جاتا ہے۔</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">اگر کلائنٹ میرا کوڈ بھول جائے؟</p>
                <p>صرف وہ آرڈرز جن میں آپ کا کوڈ استعمال ہو، آپ کے کمیشن میں شمار ہوتے ہیں۔</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">کیا میں اپنی سیلز اور کمائی دیکھ سکتا/سکتی ہوں؟</p>
                <p>ہاں۔ آپ کا ڈیش بورڈ تمام آرڈرز، سیلز اور کمیشن دکھاتا ہے۔</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">کیا یہ صرف سیلون کے لیے ہے؟</p>
                <p>یہ سیلون، ہوم بیوٹیشن، میک اپ آرٹسٹس اور بیوٹی طلبہ سب کے لیے ہے۔</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share with friends section */}
        <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4">
          <div className="text-center">
            <h2 className="font-medium text-lg">Share with friends / دوستوں کے ساتھ شیئر کریں</h2>
            <p className="text-base text-emerald-700 font-medium mt-2">Copy a ready-made message to share on WhatsApp</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => copyToClipboard('english')}
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {copied === 'english' ? '✓ Copied!' : 'Copy English'}
            </button>
            <button
              onClick={() => copyToClipboard('urdu')}
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {copied === 'urdu' ? '✓ کاپی ہو گیا!' : 'اردو کاپی کریں'}
            </button>
            <button
              onClick={() => copyToClipboard('both')}
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 bg-emerald-100 border border-emerald-300 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
            >
              {copied === 'both' ? '✓ Copied Both!' : 'Copy Both'}
            </button>
          </div>
        </div>

        {/* Instagram Bio section */}
        <div className="border rounded-lg bg-white shadow-sm p-5 space-y-4">
          <div className="text-center">
            <h2 className="font-medium text-lg">Instagram Bio / انسٹاگرام بائیو</h2>
            <p className="text-base text-emerald-700 font-medium mt-2">Copy a ready-made bio for your Instagram profile</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Professional English */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase">Professional (English)</p>
              <p className="text-sm whitespace-pre-line text-gray-800">{INSTA_BIO_PROFESSIONAL}</p>
              <button
                onClick={() => copyBioToClipboard('professional')}
                className="w-full rounded-lg px-4 py-2 border border-gray-300 text-sm font-medium text-gray-800 hover:bg-white"
              >
                {copiedBio === 'professional' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            {/* Urdu */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase">Urdu / اردو</p>
              <p className="text-sm whitespace-pre-line text-gray-800 text-right" dir="rtl">{INSTA_BIO_URDU}</p>
              <button
                onClick={() => copyBioToClipboard('urdu')}
                className="w-full rounded-lg px-4 py-2 border border-gray-300 text-sm font-medium text-gray-800 hover:bg-white"
              >
                {copiedBio === 'urdu' ? '✓ کاپی ہو گیا!' : 'Copy'}
              </button>
            </div>
            {/* Bilingual */}
            <div className="border rounded-lg p-4 space-y-3 bg-emerald-50">
              <p className="text-xs font-semibold text-emerald-600 uppercase">Bilingual (Recommended)</p>
              <p className="text-sm whitespace-pre-line text-gray-800">{INSTA_BIO_BILINGUAL}</p>
              <button
                onClick={() => copyBioToClipboard('bilingual')}
                className="w-full rounded-lg px-4 py-2 bg-emerald-100 border border-emerald-300 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
              >
                {copiedBio === 'bilingual' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">Optional add-ons: Nationwide delivery 🇵🇰 • No stock | No investment • Salon-grade products</p>
        </div>

        {/* CTAs */}
        <div className="pt-8 space-y-5">
          <div className="text-center text-sm text-gray-800 space-y-1">
            <p>Start earning from the trust you've already built with your clients.</p>
            <p>اپنے بنائے گئے اعتماد سے آج ہی کمائی شروع کریں۔</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <a
                href="/affiliate/signup"
                className="inline-flex items-center justify-center rounded-xl px-10 py-4 bg-black text-white text-lg font-semibold hover:bg-gray-900 shadow-lg"
              >
                Create account (Sign up)
              </a>
              <p className="text-xs text-gray-500 mt-2">Free to join. No payment details required.</p>
              <p className="text-xs text-gray-500" dir="rtl">رجسٹریشن مفت ہے۔ کسی قسم کی ادائیگی کی معلومات درکار نہیں۔</p>
            </div>
            <a
              href="/affiliate/dashboard"
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 border-2 border-emerald-600 text-emerald-600 text-sm font-medium hover:bg-emerald-50"
            >
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
