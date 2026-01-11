'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  affiliate_commission_type: 'fixed' | 'percent' | null;
  affiliate_commission_value: number | null;
}

interface Tier {
  name: string;
  min_delivered_orders_30d: number;
  multiplier_percent: number;
}

interface TermsContentProps {
  products: Product[];
  tiers: Tier[];
  lastUpdated: string;
}

export default function TermsContent({ products, tiers, lastUpdated }: TermsContentProps) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  // Format the last updated date
  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedDateUrdu = new Date(lastUpdated).toLocaleDateString('ur-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Format multiplier as ×1.5
  const formatMultiplier = (percent: number) => `×${(percent / 100).toFixed(1)}`;

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
            {lang === 'en' ? `Last updated: ${formattedDate}` : `آخری تازہ کاری: ${formattedDate}`}
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

            {/* Section 5 - Commission Schedule with Dynamic Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">5. Commission Schedule</h2>
              <p>Customer discount and affiliate commission are determined by the <strong>Commission Schedule</strong> configured by AestheticPK per product.</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Commission may be: <strong>Fixed amount per unit</strong>, or <strong>Percentage per unit</strong> (based on product's base unit price)</li>
                <li>The commission amount shown/recorded at checkout is the <strong>source of truth</strong> for that order.</li>
                <li>Commission is not recalculated later if product settings change — existing orders keep their checkout snapshot.</li>
              </ul>

              {/* Dynamic Commission Table */}
              {products.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Commission by Product</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">Product</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">Base Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{product.name}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {product.affiliate_commission_type === 'fixed' ? 'Fixed' : 'Percentage'}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {product.affiliate_commission_type === 'fixed' 
                                ? `${product.affiliate_commission_value} PKR`
                                : `${product.affiliate_commission_value}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Commission is snapshotted at checkout. Changes affect new orders only.
                  </p>
                </div>
              )}
            </section>

            {/* Section 5b - Tier Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">5b. Commission Tiers</h2>
              <p>Affiliates can earn higher commissions by delivering more orders. Tier multipliers apply to the base commission.</p>
              
              {tiers.length > 0 && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">Tier</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">Min Delivered Orders (30d)</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">Multiplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tiers.map((tier) => (
                          <tr key={tier.name} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{tier.name}</td>
                            <td className="px-4 py-2 text-gray-600">{tier.min_delivered_orders_30d}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatMultiplier(tier.multiplier_percent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Example: Base 500 PKR + ×1.5 tier = 750 PKR. Base 10% + ×1.5 tier = 15%.
                  </p>
                </div>
              )}
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
                <li>If an order is cancelled, returned, refunded, or otherwise invalidated before payout, the related commission will be marked <strong>Void</strong> and will not be paid.</li>
                <li>Once a commission has been marked <strong>Paid</strong>, it is considered final and non-reversible.</li>
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
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">10. Taxes</h2>
              <p>Affiliates are responsible for reporting and paying any applicable taxes on their commission earnings. AestheticPK does not withhold taxes and does not provide tax advice.</p>
            </section>

            {/* Section 11 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">11. Changes to Terms</h2>
              <p>AestheticPK may update these Terms & Conditions at any time. Continued participation in the affiliate program after changes constitutes acceptance of the updated terms.</p>
            </section>

            {/* Section 12 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">12. Contact</h2>
              <p>For questions about the affiliate program, contact us at <a href="mailto:Aestheticsupplypk@gmail.com" className="text-emerald-600 hover:underline">Aestheticsupplypk@gmail.com</a>.</p>
            </section>
          </div>
        )}

        {/* Content - Urdu */}
        {lang === 'ur' && (
          <div className="space-y-8 text-gray-800" dir="rtl">
            {/* Important Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium text-amber-800">اہم نوٹ</p>
              <p className="text-amber-700 text-sm mt-1">یہ اردو ترجمہ سہولت کے لیے فراہم کیا گیا ہے۔ کسی بھی اختلاف کی صورت میں انگریزی ورژن کو حتمی حیثیت حاصل ہوگی۔</p>
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">1. جائزہ</h2>
              <p>
                AestheticPK افیلیئیٹ / پارٹنر پروگرام افراد اور کاروباروں کو AestheticPK کی مصنوعات کی سفارش کرنے اور کمیشن کمانے کی اجازت دیتا ہے، جب گاہک افیلیئیٹ کے ریفرل کوڈ کا استعمال کرتے ہوئے آرڈر دیتے ہیں۔ اس پروگرام میں شرکت ان شرائط و ضوابط کے تابع ہے۔
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">2. اہلیت</h2>
              <p>یہ پروگرام درج ذیل افراد کے لیے کھلا ہے:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>بیوٹیشنز، سیلون اور پارلر کا عملہ</li>
                <li>طلباء اور ٹرینیز</li>
                <li>دکان کا عملہ یا وہ افراد جو باقاعدہ طور پر گاہکوں کی رہنمائی کرتے ہیں</li>
                <li>کوئی بھی شخص جس کے پاس حقیقی گاہکوں یا کلائنٹس کا نیٹ ورک ہو</li>
              </ul>
              <p className="text-sm text-gray-600">AestheticPK سروس کے معیار کو برقرار رکھنے اور ڈیلیوری نقصانات کو کم کرنے کے لیے کسی بھی افیلیئیٹ کو منظور کرنے، معطل کرنے یا مستقل طور پر ختم کرنے کا حق محفوظ رکھتا ہے۔</p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">3. ریفرل کوڈ اور اس کا درست استعمال</h2>
              <p>ہر افیلیئیٹ کو ایک منفرد ریفرل کوڈ فراہم کیا جاتا ہے۔ کمیشن اور رعایت کے اطلاق کے لیے گاہک کا چیک آؤٹ کے وقت ریفرل کوڈ درج کرنا لازمی ہے۔</p>
              <p>افیلیئیٹس اپنا کوڈ WhatsApp، Instagram، دکان میں یا ذاتی طور پر شیئر کر سکتے ہیں۔</p>
              <p className="font-medium mt-2">افیلیئیٹس کو درج ذیل کاموں کی اجازت نہیں ہے:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>خود کو AestheticPK کا ملازم، نمائندہ یا سرکاری ایجنٹ ظاہر کرنا</li>
                <li>مصنوعات، قیمتوں، دستیابی یا ڈیلیوری کے بارے میں غلط بیانی کرنا</li>
                <li>غیر اخلاقی طریقے استعمال کرنا (جیسے اسپام، جعلی آرڈرز، یا زبردستی COD ریفیوز کروانا)</li>
              </ul>
              <p className="text-sm text-red-600 font-medium mt-2">خلاف ورزی کی صورت میں افیلیئیٹ اکاؤنٹ معطل یا مستقل طور پر ختم کیا جا سکتا ہے۔</p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">4. گاہک کو دی جانے والی رعایت</h2>
              <p>جب گاہک درست افیلیئیٹ کوڈ استعمال کرتا ہے:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>گاہک کو ویب سائٹ پر ظاہر کی گئی رعایت دی جاتی ہے (جہاں لاگو ہو)</li>
                <li>رعایت کے قواعد پروڈکٹ یا مہم کے لحاظ سے مختلف ہو سکتے ہیں اور AestheticPK کسی بھی وقت تبدیل کر سکتا ہے</li>
              </ul>
            </section>

            {/* Section 5 - Commission Schedule with Dynamic Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">5. کمیشن شیڈول</h2>
              <p>افیلیئیٹ کمیشن ہر پروڈکٹ کے لیے AestheticPK کی جانب سے مقرر کیا جاتا ہے۔</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>کمیشن: <strong>فکسڈ رقم فی یونٹ</strong> یا <strong>فیصد فی یونٹ</strong> (چیک آؤٹ پر ادا کی گئی اصل قیمت پر)</li>
                <li>چیک آؤٹ پر محفوظ کیا گیا کمیشن اس آرڈر کے لیے حتمی تصور کیا جاتا ہے</li>
                <li>کمیشن چیک آؤٹ کے وقت محفوظ (Snapshot) ہو جاتا ہے اور بعد میں پروڈکٹ سیٹنگز تبدیل ہونے پر دوبارہ حساب نہیں کیا جاتا</li>
              </ul>

              {/* Dynamic Commission Table - Urdu */}
              {products.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">پروڈکٹ کے لحاظ سے موجودہ کمیشن</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">پروڈکٹ</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">قسم</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">بنیادی کمیشن</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{product.name}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {product.affiliate_commission_type === 'fixed' ? 'فکسڈ' : 'فیصد'}
                            </td>
                            <td className="px-4 py-2 text-left font-medium">
                              {product.affiliate_commission_type === 'fixed' 
                                ? `${product.affiliate_commission_value} PKR`
                                : `${product.affiliate_commission_value}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">نوٹ: کمیشن میں تبدیلیاں صرف نئے آرڈرز پر لاگو ہوں گی۔ پہلے سے موجود آرڈرز کا کمیشن تبدیل نہیں ہوگا۔</p>
                </div>
              )}
            </section>

            {/* Section 6 - Tier Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">6. کمیشن ٹیئرز</h2>
              <p>افیلیئیٹس زیادہ کامیاب ڈیلیوریز کے ذریعے زیادہ کمیشن حاصل کر سکتے ہیں۔ ٹیئر ملٹی پلائر پروڈکٹ کے بنیادی کمیشن پر لاگو ہوتا ہے، چاہے کمیشن فکسڈ ہو یا فیصد۔</p>
              
              {tiers.length > 0 && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">ٹیئر</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-700">کم از کم ڈیلیور شدہ آرڈرز (30 دن)</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-700">ملٹی پلائر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tiers.map((tier) => (
                          <tr key={tier.name} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{tier.name}</td>
                            <td className="px-4 py-2 text-gray-600">{tier.min_delivered_orders_30d}</td>
                            <td className="px-4 py-2 text-left font-medium">{formatMultiplier(tier.multiplier_percent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">مثال: 500 PKR + ×1.5 = 750 PKR۔ 10% + ×1.5 = 15%۔</p>
                </div>
              )}
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">7. کمیشن کی حیثیت اور ہولڈ پیریڈ</h2>
              <p>کمیشن درج ذیل مراحل سے گزرتا ہے:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>زیر التوا (Pending):</strong> آرڈر ڈیلیور ہو چکا ہے مگر ہولڈ پیریڈ میں ہے</p>
                <p><strong>قابل ادائیگی (Payable):</strong> ہولڈ پیریڈ مکمل ہو چکا ہے</p>
                <p><strong>ادا شدہ (Paid):</strong> پے آؤٹ بیچ میں شامل ہو چکا ہے</p>
                <p><strong>کالعدم (Void):</strong> واپسی، ریفنڈ، منسوخی، ناکام ڈیلیوری یا پالیسی خلاف ورزی کی وجہ سے ناقابل ادائیگی</p>
              </div>
              <p className="mt-2"><strong>ہولڈ پیریڈ:</strong> آرڈر کے ڈیلیور ہونے کے بعد 10 دن تک کمیشن زیر التوا رہتا ہے۔</p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">8. پے آؤٹ شیڈول</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>پے آؤٹس ماہانہ بنیاد پر کیے جاتے ہیں، عموماً ہر ماہ کی 10 تاریخ کے قریب</li>
                <li>صرف وہ کمیشن شامل کیے جاتے ہیں جو پے آؤٹ کے وقت قابل ادائیگی ہوں</li>
                <li>افیلیئیٹس کو درست پے آؤٹ تفصیلات فراہم کرنا ہوں گی؛ غلط یا نامکمل معلومات کی صورت میں ادائیگی میں تاخیر ہو سکتی ہے</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">9. واپسی، ریفنڈ اور منسوخی</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mr-2">
                <li>اگر کوئی آرڈر پے آؤٹ سے پہلے منسوخ، واپس یا ریفنڈ ہو جائے تو متعلقہ کمیشن کالعدم (Void) کر دیا جائے گا اور ادا نہیں کیا جائے گا</li>
                <li>ایک بار جب کمیشن ادا شدہ (Paid) ہو جائے تو وہ حتمی اور ناقابل واپسی تصور کیا جائے گا</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 text-red-700">10. ناکام ڈیلیوری اور اسٹرائیک پالیسی (30 دن)</h2>
              <p>کورئیر نقصانات کو کم کرنے کے لیے AestheticPK 30 دن کے اندر صارف کی وجہ سے ناکام ڈیلیوریز پر اسٹرائیک سسٹم استعمال کرتا ہے۔</p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <p className="font-medium text-amber-800">اسٹرائیک کے قابل ناکام ڈیلیوریز:</p>
                <ul className="list-disc list-inside mr-4 text-amber-700">
                  <li>غلط یا نامکمل پتہ</li>
                  <li>فون نمبر بند یا ناقابل رسائی</li>
                  <li>گاہک کی جانب سے ڈیلیوری یا COD سے انکار</li>
                  <li>متعدد کوششوں کے باوجود دستیاب نہ ہونا</li>
                  <li>ڈسپیچ کے بعد یا دروازے پر منسوخی</li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-emerald-800">اسٹرائیک میں شامل نہیں:</p>
                <ul className="list-disc list-inside mr-4 text-emerald-700">
                  <li>کورئیر کی آپریشنل غلطیاں</li>
                  <li>موسم یا سڑک بند ہونے کے مسائل</li>
                  <li>شپمنٹ کا ضائع یا خراب ہونا (کورئیر کی غلطی)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mt-3">
                <p className="font-medium text-red-800">اسٹرائیک حدیں (30 دن):</p>
                <ul className="list-disc list-inside mr-4 text-red-700">
                  <li><strong>وارننگ:</strong> 3 یا زیادہ اسٹرائیکس</li>
                  <li><strong>معطلی:</strong> 5 یا زیادہ اسٹرائیکس (ریفرل کوڈ خودکار طور پر بند)</li>
                  <li><strong>مستقل پابندی:</strong> شدید یا بار بار بدسلوکی پر ایڈمن کا فیصلہ</li>
                </ul>
                <p className="text-sm text-red-600 mt-2">کورئیر شواہد کی بنیاد پر AestheticPK کا فیصلہ حتمی ہوگا۔</p>
              </div>
            </section>

            {/* Section 11 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">11. ٹیکس</h2>
              <p>افیلیئیٹس اپنے کمیشن پر لاگو تمام ٹیکسز کی ادائیگی کے خود ذمہ دار ہوں گے۔ AestheticPK ٹیکس منہا نہیں کرتا اور ٹیکس مشورہ فراہم نہیں کرتا۔</p>
            </section>

            {/* Section 12 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">12. شرائط میں تبدیلی</h2>
              <p>AestheticPK کسی بھی وقت ان شرائط و ضوابط میں تبدیلی کر سکتا ہے۔ تبدیلی کے بعد پروگرام میں شرکت جاری رکھنا نئی شرائط کی منظوری تصور ہوگا۔</p>
            </section>

            {/* Section 13 */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">13. رابطہ</h2>
              <p>افیلیئیٹ پروگرام کے بارے میں سوالات کے لیے رابطہ کریں: <a href="mailto:Aestheticsupplypk@gmail.com" className="text-emerald-600 hover:underline">Aestheticsupplypk@gmail.com</a></p>
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
