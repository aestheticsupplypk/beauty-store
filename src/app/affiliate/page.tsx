export default function AffiliateLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-6 text-white shadow-md space-y-3">
          <div>
            <h1 className="text-3xl font-semibold">Affiliate / Beautician Partner Program</h1>
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

        {/* Value proposition */}
        <div className="border rounded-lg p-5 bg-white shadow-sm text-base text-gray-700 space-y-2">
          <p className="font-medium text-gray-900">No inventory. No upfront investment.</p>
          <p>
            Just recommend products you already trust — we handle orders, payments, delivery, and
            customer support.
          </p>
        </div>

        {/* Why join */}
        <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
          <h2 className="font-medium text-lg">Why join our program?</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
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

        {/* Who this is for */}
        <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
          <h2 className="font-medium text-lg">Who is this program for?</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
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

        {/* Transparency & tracking */}
        <div className="space-y-3 border rounded-lg p-5 bg-white shadow-md">
          <h2 className="font-medium text-lg">Transparency & tracking</h2>
          <ul className="list-disc pl-5 text-base space-y-1">
            <li>Every order made with your code is automatically tracked.</li>
            <li>View total sales, commission and order history in one place.</li>
            <li>No guessing, no manual reporting – full visibility inside your dashboard.</li>
          </ul>
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

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
  );
}
