'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AffiliateTermsPage() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/affiliate" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            ← Back to Affiliate Program
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4">
            {lang === 'en' ? 'AestheticPK Affiliate / Partner Program' : 'AestheticPK افیلیئیٹ / پارٹنر پروگرام'}
          </h1>
          <p className="text-lg text-emerald-600 font-medium mt-2">
            {lang === 'en' ? 'Terms & Conditions' : 'شرائط و ضوابط'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'en' ? 'Effective as of: 10 January 2026' : 'مؤثر از: 10 جنوری 2026'}
          </p>
          
          {/* Language Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                lang === 'en' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang('ur')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                lang === 'ur' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Content - English */}
        {lang === 'en' && (
          <div className="space-y-8 text-gray-800">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">1. Overview</h2>
              <p>
                The AestheticPK Affiliate / Partner Program allows individuals and businesses to recommend AestheticPK 
                products and earn commission when customers place orders using the affiliate's referral code. 
                Participation is subject to these Terms & Conditions.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">2. Eligibility</h2>
              <p>This program is open to:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Beauticians, salons, and parlour staff</li>
                <li>Students and trainees</li>
                <li>Shop staff or individuals who regularly guide customers and provide product recommendations</li>
                <li>Any person with a genuine network of customers/clients</li>
              </ul>
              <p className="text-sm text-gray-600">
                AestheticPK may accept, review, suspend, or revoke affiliates at its discretion to protect service quality and reduce delivery losses.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">3. Referral Codes and Proper Use</h2>
              <p>Each affiliate receives a unique referral code. Customers must enter the referral code at checkout for the discount and commission to apply.</p>
              <p>Affiliates may share their code on WhatsApp, Instagram, in-store, or in-person.</p>
              <p className="font-medium mt-2">Affiliates must not:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Claim they are an AestheticPK employee, representative, or official agent</li>
                <li>Misrepresent product claims, pricing, availability, or delivery timelines</li>
                <li>Use unethical tactics (spam, fake orders, forced COD refusals, etc.)</li>
              </ul>
              <p className="text-sm text-red-600 font-medium mt-2">Violation may result in suspension or revocation.</p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">4. Customer Discount</h2>
              <p>When a valid affiliate code is used at checkout:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>The customer receives the discount shown on the website (e.g., 10% off, where applicable).</li>
                <li>Discount rules may vary by product or campaign and can be changed by AestheticPK at any time.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">5. Commission Schedule (Important)</h2>
              <p>Customer discount and affiliate commission are determined by the <strong>Commission Schedule</strong> configured by AestheticPK per product.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>The Commission Schedule may vary by product, campaign, or time period.</li>
                <li>Commission may be: <strong>Fixed amount per unit</strong>, or <strong>Percentage per unit</strong> (based on product's base unit price)</li>
                <li>The commission amount shown/recorded at checkout is the <strong>source of truth</strong> for that order.</li>
                <li>Commission is not recalculated later if product settings change — existing orders keep their checkout snapshot.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">6. Commission Status and Hold Period</h2>
              <p>Commission progresses through the following states:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Pending:</strong> Order delivered, but within the hold period</p>
                <p><strong>Payable:</strong> Hold period passed and eligible for the next payout batch</p>
                <p><strong>Paid:</strong> Included in a completed payout batch</p>
                <p><strong>Void:</strong> Not payable due to return/refund/cancellation/failed delivery or policy violation</p>
              </div>
              <p className="mt-2"><strong>Hold Period (10 days):</strong> Commission becomes eligible only after the order is marked delivered and remains valid for 10 days.</p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">7. Payout Schedule</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Payouts are processed once per month, usually on or around the 10th.</li>
                <li>The payout includes all commissions that are Payable at the time of the payout run.</li>
                <li>AestheticPK may require the affiliate to provide correct payout details (bank/other). If payout details are missing or invalid, payout may be delayed until corrected.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">8. Returns, Refunds, and Cancellations</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>If an order is cancelled, returned, refunded, or otherwise invalidated, the related commission will be marked <strong>Void</strong> and will not be paid.</li>
                <li>If a return/refund occurs after payout, AestheticPK may adjust future payouts to recover the commission amount.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 text-red-700">9. Failed Delivery and Strike Policy (Rolling 30 Days)</h2>
              <p>To reduce courier losses, AestheticPK uses a strike system based on strike-eligible failed deliveries within a rolling 30-day window.</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-amber-800">What counts as a "failed delivery" (strike-eligible):</p>
                <ul className="list-disc list-inside ml-4 text-amber-700">
                  <li>Wrong or incomplete address</li>
                  <li>Unreachable phone number</li>
                  <li>Customer refused delivery / COD refused</li>
                  <li>Customer not available after multiple attempts</li>
                  <li>Customer requested cancellation at doorstep or after dispatch</li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-emerald-800">What does NOT count as a strike:</p>
                <ul className="list-disc list-inside ml-4 text-emerald-700">
                  <li>Courier operational issues</li>
                  <li>Weather/road closures</li>
                  <li>Shipment damaged in transit</li>
                  <li>Lost by courier</li>
                  <li>Other courier-side exceptions beyond customer's control</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-red-800">Strike thresholds (rolling 30 days):</p>
                <ul className="list-disc list-inside ml-4 text-red-700">
                  <li><strong>Warning:</strong> 3 or more strikes</li>
                  <li><strong>Suspended:</strong> 5 or more strikes (referral code disabled automatically; no new commissions can be earned)</li>
                  <li><strong>Revoked:</strong> Manual admin action for severe or repeated abuse (permanent removal)</li>
                </ul>
                <p className="text-sm text-red-600 mt-2">AestheticPK's decision is final where courier evidence indicates customer-caused failure patterns.</p>
              </div>
              
              {/* Expandable detailed policy */}
              <details className="mt-4 border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  View detailed Failed Delivery policy →
                </summary>
                <div className="p-4 space-y-4 text-sm text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">What Counts as a Failed Delivery</h3>
                    <p className="mb-2">An order will be classified as a Failed Delivery if the courier company is unable to successfully deliver the parcel due to reasons attributable to the customer or affiliate referral:</p>
                    
                    <div className="space-y-3 ml-2">
                      <div>
                        <p className="font-medium">Incorrect or Incomplete Address</p>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                          <li>Wrong house number, street, area, or city</li>
                          <li>Missing essential address details</li>
                          <li>Address that does not exist or cannot be located</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium">Customer Unreachable</p>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                          <li>Phone switched off or incorrect</li>
                          <li>Customer does not answer calls after multiple attempts</li>
                          <li>No response to SMS or WhatsApp delivery confirmations</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium">Customer Refusal</p>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                          <li>Customer refuses to accept the parcel at delivery</li>
                          <li>Customer claims they did not place the order</li>
                          <li>Customer changes their mind at the time of delivery</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium">Repeated Delivery Attempts with No Resolution</p>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                          <li>Courier attempts delivery multiple times and fails</li>
                          <li>No alternate instructions provided by the customer</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium">Fake, Test, or Non-Serious Orders</p>
                        <ul className="list-disc list-inside ml-4 text-gray-600">
                          <li>Orders placed without intent to receive the product</li>
                          <li>Prank, duplicate, or intentionally misleading orders</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <h3 className="font-semibold text-emerald-800 mb-2">What Does NOT Count as a Failed Delivery</h3>
                    <ul className="list-disc list-inside ml-2 text-emerald-700">
                      <li>Courier delay due to weather, strikes, or logistics issues</li>
                      <li>Warehouse or dispatch delays caused by AestheticPK</li>
                      <li>Courier operational errors after successful address verification</li>
                      <li>Product damage during transit (handled under returns)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Accountability Rule</h3>
                    <ul className="list-disc list-inside ml-2 text-gray-600">
                      <li>Failed deliveries are logged based on courier status reports, not personal claims</li>
                      <li>AestheticPK relies on official courier delivery status (e.g. Unreachable, Refused, Address Incorrect)</li>
                      <li>Decisions regarding failed deliveries are final and based on courier documentation</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h3 className="font-semibold text-red-800 mb-2">Threshold & Consequences</h3>
                    <p className="text-red-700">If 5 or more Failed Deliveries linked to an affiliate occur within a single calendar month:</p>
                    <ul className="list-disc list-inside ml-2 text-red-700 mt-1">
                      <li>Affiliate account will be immediately suspended or terminated</li>
                      <li>Referral code disabled permanently</li>
                      <li>Shipping costs for failed deliveries are not reimbursable and not commissionable</li>
                    </ul>
                  </div>
                </div>
              </details>
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">10. Order Attribution Rules (No Double Attribution)</h2>
              <p>An order cannot be attributed to both:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>A parlour/bulk/manual channel, AND</li>
                <li>An affiliate referral code</li>
              </ul>
              <p className="text-sm text-gray-600">at the same time. AestheticPK enforces system guardrails to prevent double credit.</p>
            </section>

            {/* Section 11 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">11. Program Changes and Termination</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>AestheticPK may update discounts, commission settings, payout rules, and program policies at any time.</li>
                <li>Continued participation after changes means acceptance of the updated terms.</li>
                <li>AestheticPK may suspend or revoke any affiliate account to protect platform integrity and delivery performance.</li>
              </ul>
            </section>
          </div>
        )}

        {/* Content - Urdu */}
        {lang === 'ur' && (
          <div className="space-y-8 text-gray-800 text-right" dir="rtl">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۱. تعارف</h2>
              <p className="text-xl leading-relaxed">
                AestheticPK افیلیئیٹ / پارٹنر پروگرام کے ذریعے آپ اپنے کلائنٹس/دوستوں کو AestheticPK کی مصنوعات تجویز کر سکتے ہیں اور جب وہ آپ کا ریفرل کوڈ استعمال کرکے آرڈر کریں تو آپ کمیشن حاصل کر سکتے ہیں۔ اس پروگرام میں شمولیت ان شرائط و ضوابط کے تحت ہوگی۔
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۲. اہلیت</h2>
              <p className="text-xl">یہ پروگرام ان افراد کے لیے ہے:</p>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• بیوٹیشنز، سیلونز اور پارلر اسٹاف</li>
                <li>• طلبہ و ٹرینیز</li>
                <li>• شاپ/پارلر کے وہ افراد جو کسٹمرز کو پروڈکٹس کی ریکمنڈیشن دیتے ہیں</li>
                <li>• کوئی بھی شخص جس کے پاس حقیقی کسٹمر نیٹ ورک ہو</li>
              </ul>
              <p className="text-lg text-gray-600">
                AestheticPK معیار اور ڈلیوری لاسز کو کنٹرول کرنے کے لیے افیلیئیٹس کو قبول/ریویو/سسپنڈ/ری ووک کرنے کا حق رکھتا ہے۔
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۳. ریفرل کوڈ اور درست استعمال</h2>
              <p className="text-xl">ہر افیلیئیٹ کو ایک منفرد ریفرل کوڈ دیا جاتا ہے۔ ڈسکاؤنٹ اور کمیشن کے لیے ضروری ہے کہ کسٹمر چیک آؤٹ پر کوڈ درج کرے۔</p>
              <p className="text-xl">آپ کوڈ واٹس ایپ، انسٹاگرام، یا بالمشافہ شیئر کر سکتے ہیں۔</p>
              <p className="font-medium text-xl mt-2">افیلیئیٹ یہ نہیں کر سکتا:</p>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• خود کو AestheticPK کا ملازم/نمائندہ/آفیشل ایجنٹ ظاہر کرنا</li>
                <li>• غلط دعوے کرنا (پروڈکٹ، قیمت، دستیابی، یا ڈلیوری کے بارے میں)</li>
                <li>• غیر اخلاقی طریقے استعمال کرنا (اسپام، جعلی آرڈرز، زبردستی COD ریفیوز وغیرہ)</li>
              </ul>
              <p className="text-lg font-medium text-red-600 mt-2">خلاف ورزی پر اکاؤنٹ سسپنڈ یا ری ووک کیا جا سکتا ہے۔</p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۴. کسٹمر ڈسکاؤنٹ</h2>
              <p className="text-xl">جب کسٹمر درست افیلیئیٹ کوڈ استعمال کرے:</p>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• کسٹمر کو ویب سائٹ پر دکھایا گیا ڈسکاؤنٹ ملتا ہے (مثلاً 10% جہاں لاگو ہو)۔</li>
                <li>• ڈسکاؤنٹ قواعد پروڈکٹ یا کیمپین کے مطابق بدل سکتے ہیں اور AestheticPK انہیں کسی بھی وقت تبدیل کر سکتا ہے۔</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۵. کمیشن شیڈول (اہم)</h2>
              <p className="text-xl">کسٹمر ڈسکاؤنٹ اور افیلیئیٹ کمیشن AestheticPK کے <strong>کمیشن شیڈول</strong> کے مطابق ہر پروڈکٹ کے لیے سیٹ ہوتے ہیں۔</p>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• کمیشن شیڈول پروڈکٹ، کیمپین یا وقت کے مطابق مختلف ہو سکتا ہے۔</li>
                <li>• کمیشن کی قسم: <strong>فی یونٹ فکسڈ رقم</strong> یا <strong>فی یونٹ فیصد</strong></li>
                <li>• چیک آؤٹ پر ریکارڈ شدہ کمیشن اس آرڈر کے لیے <strong>حتمی حوالہ</strong> ہے۔</li>
                <li>• بعد میں سیٹنگز بدلنے سے پرانے آرڈرز کا کمیشن نہیں بدلتا — چیک آؤٹ کا اسنیپ شاٹ برقرار رہتا ہے۔</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۶. کمیشن اسٹیٹس اور ہولڈ پیریڈ</h2>
              <p className="text-xl">کمیشن کے اسٹیٹس:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-lg">
                <p><strong>Pending (زیرِ التواء):</strong> آرڈر ڈلیور ہو گیا لیکن ہولڈ پیریڈ میں ہے</p>
                <p><strong>Payable (قابلِ ادائیگی):</strong> ہولڈ پیریڈ مکمل، اگلی پیمنٹ میں شامل ہونے کے قابل</p>
                <p><strong>Paid (ادا شدہ):</strong> پیمنٹ بیچ میں شامل ہو کر ادا ہو چکا</p>
                <p><strong>Void (منسوخ):</strong> ریٹرن/ریفنڈ/کینسل/فیلڈ ڈلیوری یا پالیسی خلاف ورزی کی وجہ سے</p>
              </div>
              <p className="text-xl mt-2"><strong>ہولڈ پیریڈ (10 دن):</strong> کمیشن تب ہی اہل ہوگا جب آرڈر "Delivered" ہو اور ڈلیوری کے بعد 10 دن تک آرڈر درست رہے۔</p>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۷. پیمنٹ شیڈول</h2>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• پیمنٹس ماہ میں ایک بار عموماً ہر ماہ کی 10 تاریخ کے آس پاس کی جاتی ہیں۔</li>
                <li>• پیمنٹ میں وہ تمام کمیشن شامل ہوں گے جو اس وقت Payable ہوں۔</li>
                <li>• افیلیئیٹ کو درست پیمنٹ ڈیٹیلز دینا ہوں گی۔ غلط/نامکمل ڈیٹیلز کی صورت میں ادائیگی تاخیر کا شکار ہو سکتی ہے۔</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۸. ریٹرن، ریفنڈ اور کینسلیشن</h2>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• اگر آرڈر کینسل، ریٹرن، ریفنڈ یا کسی بھی وجہ سے ان ویلیڈ ہو جائے تو متعلقہ کمیشن <strong>Void</strong> کر دیا جائے گا اور ادا نہیں ہوگا۔</li>
                <li>• اگر ریٹرن/ریفنڈ پیمنٹ کے بعد ہو تو AestheticPK آئندہ پیمنٹس میں ایڈجسٹمنٹ کر سکتا ہے۔</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-red-700">۹. فیلڈ ڈلیوری اور اسٹرائیک پالیسی (رولنگ 30 دن)</h2>
              <p className="text-xl">کورئیر لاسز کم کرنے کے لیے AestheticPK "اسٹرائیک سسٹم" استعمال کرتا ہے جو رولنگ 30 دن میں اسٹرائیک-ایلیجیبل فیلڈ ڈلیوریز پر مبنی ہے۔</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-amber-800 text-xl">کیا چیز "Failed Delivery" میں شمار ہوگی (اسٹرائیک-ایلیجیبل):</p>
                <ul className="mr-6 text-xl text-amber-700 space-y-1">
                  <li>• غلط یا نامکمل ایڈریس</li>
                  <li>• فون بند/ناقابلِ رابطہ</li>
                  <li>• کسٹمر نے ڈلیوری یا COD ریفیوز کیا</li>
                  <li>• متعدد کوششوں کے بعد بھی کسٹمر دستیاب نہ ہو</li>
                  <li>• ڈسپیچ کے بعد یا دروازے پر کینسل کروانا</li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-emerald-800 text-xl">کیا چیز اسٹرائیک میں شمار نہیں ہوگی:</p>
                <ul className="mr-6 text-xl text-emerald-700 space-y-1">
                  <li>• کورئیر آپریشنل ایشوز</li>
                  <li>• موسم/سڑک بندش</li>
                  <li>• دورانِ ٹرانزٹ پارسل ڈیمیج</li>
                  <li>• کورئیر سے پارسل گم ہو جانا</li>
                  <li>• دیگر ایسی وجوہات جو کسٹمر کے کنٹرول میں نہ ہوں</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-red-800 text-xl">اسٹرائیک تھریش ہولڈز (رولنگ 30 دن):</p>
                <ul className="mr-6 text-xl text-red-700 space-y-1">
                  <li>• <strong>Warning:</strong> 3 یا اس سے زیادہ اسٹرائیک</li>
                  <li>• <strong>Suspended:</strong> 5 یا اس سے زیادہ اسٹرائیک (کوڈ خودکار طور پر بند؛ نیا کمیشن نہیں بنے گا)</li>
                  <li>• <strong>Revoked:</strong> ایڈمن کی طرف سے دستی مستقل ری ووک — سنگین یا مسلسل غلط استعمال پر</li>
                </ul>
                <p className="text-lg text-red-600 mt-2">کورئیر ریکارڈ اور شواہد کی بنیاد پر AestheticPK کا فیصلہ حتمی ہوگا۔</p>
              </div>
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۱۰. آرڈر اٹریبیوشن رول</h2>
              <p className="text-xl">ایک ہی آرڈر کو بیک وقت:</p>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• پارلر/بلک/مینول چینل، اور</li>
                <li>• افیلیئیٹ کوڈ</li>
              </ul>
              <p className="text-xl">دونوں کے نام پر کریڈٹ نہیں کیا جا سکتا۔ سسٹم میں گارڈ ریلز موجود ہیں تاکہ ڈبل کریڈٹ نہ ہو۔</p>
            </section>

            {/* Section 11 */}
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-900">۱۱. پروگرام میں تبدیلی یا خاتمہ</h2>
              <ul className="space-y-2 text-xl text-gray-700 mr-4">
                <li>• AestheticPK کسی بھی وقت ڈسکاؤنٹ، کمیشن، پیمنٹ رولز اور پالیسیز اپڈیٹ کر سکتا ہے۔</li>
                <li>• اپڈیٹ کے بعد پروگرام جاری رکھنا نئی شرائط کی قبولیت سمجھا جائے گا۔</li>
                <li>• AestheticPK پلیٹ فارم اور ڈلیوری پرفارمنس کے تحفظ کے لیے کسی بھی افیلیئیٹ اکاؤنٹ کو سسپنڈ یا ری ووک کر سکتا ہے۔</li>
              </ul>
            </section>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200 space-y-4">
          <p className="text-center text-sm text-gray-600">
            {lang === 'en' 
              ? 'By signing up, you agree to these terms and conditions.' 
              : 'سائن اپ کرنے سے آپ ان شرائط و ضوابط سے اتفاق کرتے ہیں۔'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/affiliate/signup"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 shadow-md"
            >
              {lang === 'en' ? 'Create account (Sign up)' : 'اکاؤنٹ بنائیں (سائن اپ)'}
            </Link>
            <Link
              href="/affiliate"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 bg-gray-100 text-gray-800 text-sm font-medium hover:bg-gray-200"
            >
              {lang === 'en' ? 'Back to Program Overview' : 'پروگرام کا جائزہ دیکھیں'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
