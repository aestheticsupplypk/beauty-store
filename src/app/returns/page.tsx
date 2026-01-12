import Link from 'next/link';

export default function ReturnsPage() {
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
          <h1 className="text-2xl font-bold text-[#2B2B2B] mb-6">Returns Policy</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">7-Day Return Policy</h2>
              <p className="text-sm leading-relaxed">
                We accept returns for defective or damaged products within 7 days of receiving your order. 
                Products must be in their original packaging and unused condition.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">How to Request a Return</h2>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Inspect your order upon delivery</li>
                <li>If you find any defects, take photos of the product and packaging</li>
                <li>Contact us via WhatsApp with your order ID and photos</li>
                <li>Our team will review and approve eligible returns within 24-48 hours</li>
              </ol>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Refund Process</h2>
              <p className="text-sm leading-relaxed">
                Once your return is approved, refunds are processed within 7-14 business days via 
                Easypaisa, JazzCash, or bank transfer (your choice).
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Non-Returnable Items</h2>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Products that have been opened or used</li>
                <li>Products without original packaging</li>
                <li>Returns requested after 7 days</li>
              </ul>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                For any questions about returns, please contact us via WhatsApp. We're here to help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
