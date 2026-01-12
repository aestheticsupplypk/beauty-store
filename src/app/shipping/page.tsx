import Link from 'next/link';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-[#7A1E3A] font-bold text-lg">
            Aesthetic PK
          </Link>
          <Link href="/products" className="text-sm text-gray-600 hover:text-[#7A1E3A]">
            Products
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#2B2B2B] mb-6">Shipping & Delivery</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Delivery Timeline</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between p-3 bg-rose-50 rounded-lg">
                  <span>Major Cities (Karachi, Lahore, Islamabad)</span>
                  <span className="font-medium">2-3 days</span>
                </div>
                <div className="flex justify-between p-3 bg-rose-50 rounded-lg">
                  <span>Other Cities</span>
                  <span className="font-medium">3-5 days</span>
                </div>
                <div className="flex justify-between p-3 bg-rose-50 rounded-lg">
                  <span>Remote Areas</span>
                  <span className="font-medium">5-7 days</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Dispatch Time</h2>
              <p className="text-sm leading-relaxed">
                Orders are processed and dispatched within 24-48 hours of placement. 
                You will receive a tracking number via SMS once your order is shipped.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Cash on Delivery (COD)</h2>
              <p className="text-sm leading-relaxed">
                We offer Cash on Delivery across Pakistan. Pay the courier when you receive your order. 
                Please have the exact amount ready for a smooth delivery experience.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Shipping Charges</h2>
              <p className="text-sm leading-relaxed">
                Shipping charges are calculated at checkout based on your location and order weight. 
                Free shipping may be available on orders above a certain amount.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Order Tracking</h2>
              <p className="text-sm leading-relaxed">
                Track your order anytime using your order ID or phone number on our{' '}
                <Link href="/track" className="text-[#7A1E3A] underline">
                  Track Order
                </Link>{' '}
                page.
              </p>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Delivery times are estimates and may vary during peak seasons or due to unforeseen circumstances.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
