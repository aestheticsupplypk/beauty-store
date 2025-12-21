import React from "react";

export function AffiliateLandingWeb() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-6 text-white shadow-md space-y-3">
          <div>
            <p className="text-sm font-medium text-emerald-50/90">
              Your clients already trust you. Now let that trust pay you back.
            </p>
            <p className="mt-0.5 text-sm text-emerald-50/90">
              آپ کے کلائنٹس پہلے ہی آپ پر اعتماد کرتے ہیں — اب اسی اعتماد کو کمائی میں بدلیں۔
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Affiliate / Beautician Partner Program</h1>
            <p className="mt-1 text-base text-emerald-50">
              Earn from every client you recommend — without buying stock. Turn your daily
              recommendations into real income.
            </p>
          </div>
          <p className="text-sm text-emerald-50/90">
            Share your personal code with clients, they save money, and you earn commission on every
            confirmed order.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Zero investment</div>
              <div className="text-emerald-50 text-xs">No stock, no bulk buying — just referrals.</div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Client discount</div>
              <div className="text-emerald-50 text-xs">Your clients get an exclusive offer.</div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <div className="font-semibold">Dashboard tracking</div>
              <div className="text-emerald-50 text-xs">See every order and rupee earned.</div>
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

          <div className="border-t border-emerald-100 pt-4 space-y-2 text-right" dir="rtl">
            <h2 className="text-lg font-semibold text-gray-900">برانڈ پیغام</h2>
            <p className="leading-relaxed text-base md:text-lg">
              AestheticPK میں ہمارا یقین ہے کہ آپ کی رائے کی اپنی قدر ہے۔ روزانہ آپ اپنے کلائنٹس کی
              رہنمائی کرتے ہیں، انہیں بہترین پروڈکٹس کی تجویز دیتے ہیں اور ان کا اعتماد جیتتے ہیں — اور
              یہی اعتماد انعام کا حق دار ہے۔ یہ صرف خوبصورتی نہیں، بلکہ ایسی خوبصورتی ہے جو بدلہ دیتی
              ہے، جہاں ہر سفارش ایک موقع بن جاتی ہے اور اعتماد حقیقی کمائی میں بدل جاتا ہے۔
            </p>
            <p className="leading-relaxed text-base md:text-lg">
              آپ کو اپنے کام کا طریقہ بدلنے کی ضرورت نہیں — بس جو آپ پہلے ہی کرتے ہیں، اسی سے کمائیں۔
              کیونکہ آپ کی مہارت قیمتی ہے، اور آپ کی روزمرہ کی دی گئی رائے کی بھی ایک قیمت ہے۔
            </p>
            <p className="leading-relaxed text-base md:text-lg">
              یہاں سب کچھ سادہ ہے: سفارش کریں، کمائیں، اور آگے بڑھیں۔ یہ ہے وہ جگہ جہاں خوبصورتی کمائی
              بن جاتی ہے — جہاں اعتماد، آمدن میں بدلتا ہے۔
            </p>
          </div>
        </div>

        {/* Main content sections in a responsive two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <div className="space-y-6">
            {/* Value proposition */}
            <div className="border rounded-lg p-5 bg-white shadow-sm text-base text-gray-700 space-y-2">
              <p className="font-medium text-gray-900">No inventory. No upfront investment.</p>
              <p>
                Just recommend products you already trust — we handle orders, payments, delivery, and
                customer support.
              </p>
            </div>

            {/* How it works */}
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

            {/* Info / benefits block */}
            <div className="border rounded-lg p-5 bg-emerald-50/80 space-y-3 text-base text-gray-800 shadow-sm">
              <p className="leading-relaxed">
                آپ کو اسٹاک رکھنے کی ضرورت نہیں۔ آپ صرف اپنے کلائنٹس کو ہمارا پروڈکٹ ریکمینڈ کریں۔ جب
                کلائنٹ آپ کا کوڈ استعمال کرے:
              </p>
              <p className="leading-relaxed">
                • کلائنٹ کو ڈسکاؤنٹ ملتا ہے۔
                • آپ کو کمیشن ملتا ہے۔
                • سب کچھ ڈیش بورڈ میں صاف نظر آتا ہے۔
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Why join */}
            <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
              <h2 className="font-medium text-lg">Why join our program?</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-base">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Zero investment – no stock, no bulk buying.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Exclusive discount for your clients when they use your code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Commission on every successful order — not just first purchase.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Personal referral code just for you.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Real-time dashboard to track sales and earnings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Perfect for salons, home beauticians and students.</span>
                </li>
              </ul>
            </div>

            {/* Who this is for */}
            <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
              <h2 className="font-medium text-lg">Who is this program for?</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-base">
                <li>Beauty salons & parlours.</li>
                <li>Home-based beauticians.</li>
                <li>Makeup artists & hair specialists.</li>
                <li>Beauty students & trainees.</li>
                <li>Anyone who already recommends products to clients.</li>
              </ul>
              <p className="text-sm text-gray-600 mt-1">
                You focus on your clients. We handle orders, payments, delivery, and support.
              </p>
            </div>
          </div>
        </div>

        {/* Real example card */}
        <div className="mt-4 border rounded-lg bg-emerald-50/70 shadow-sm p-5 space-y-2 text-sm text-gray-800">
          <h2 className="font-medium text-base text-gray-900">Real example</h2>
          <p>
            A home-based beautician shares her code with around 15 regular clients. Even if only 8 of
            them place orders each month, she earns commission on every confirmed order – without
            handling stock, payments or delivery.
          </p>
          <p className="leading-relaxed">
            ایک ہوم بیسڈ بیوٹیشن اپنے تقریباً 15 ریگولر کلائنٹس کے ساتھ اپنا کوڈ شیئر کرتی ہے۔ چاہے مہینے
            میں صرف 8 ہی آرڈر کریں، ہر کنفرمڈ آرڈر پر اسے کمیشن ملتا ہے — بغیر اسٹاک سنبھالے، پیمنٹس
            یا ڈیلیوری کے جھنجھٹ کے۔
          </p>
        </div>

        {/* Earnings potential illustration */}
        <div className="mt-4 border rounded-lg bg-white shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-baseline">
            <h2 className="font-medium text-lg">How your earnings can grow</h2>
            <span className="text-xs text-gray-500">Example only – actual earnings may vary</span>
          </div>
          <p className="text-sm text-gray-600">
            These examples show how regular client orders can turn into monthly commission. Amounts are
            approximate and depend on the products your clients buy and the commission set for each
            product.
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
        </div>

        {/* FAQ / Common questions */}
        <div className="mt-6 border rounded-lg bg-white shadow-sm p-5 space-y-4">
          <h2 className="font-medium text-lg">Common questions</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm text-gray-800">
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
              <p>It’s for salons, home-based beauticians, makeup artists and beauty students.</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="pt-6 space-y-3">
          <div className="text-center text-sm text-gray-800 space-y-1">
            <p>Start earning from the trust you’ve already built with your clients.</p>
            <p>اپنے بنائے گئے اعتماد سے آج ہی کمائی شروع کریں۔</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/affiliate/signup"
              className="inline-flex items-center justify-center rounded px-5 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-900"
            >
              Create account (Sign up)
            </a>
            <a
              href="/affiliate/dashboard"
              className="inline-flex items-center justify-center rounded px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Already have an account? View dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
