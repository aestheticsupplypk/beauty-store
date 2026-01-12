import Link from 'next/link';

export default function AboutPage() {
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
          <h1 className="text-2xl font-bold text-[#2B2B2B] mb-6">About Aesthetic PK</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Who We Are</h2>
              <p className="text-sm leading-relaxed">
                Aesthetic PK is Pakistan's trusted source for professional-grade beauty products. 
                We supply salon-tested skincare, hair treatments, and beauty essentials to parlours, 
                beauticians, and everyday customers across the country.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Our Promise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="font-medium text-[#7A1E3A] text-sm">Salon-Grade Quality</p>
                  <p className="text-xs text-gray-600 mt-1">Products trusted by professional beauticians</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="font-medium text-[#7A1E3A] text-sm">Carefully Sourced</p>
                  <p className="text-xs text-gray-600 mt-1">Dermatologist-inspired selection process</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="font-medium text-[#7A1E3A] text-sm">Real Results</p>
                  <p className="text-xs text-gray-600 mt-1">Tested in Pakistani climate and routines</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg">
                  <p className="font-medium text-[#7A1E3A] text-sm">Nationwide Delivery</p>
                  <p className="text-xs text-gray-600 mt-1">COD available across Pakistan</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">Why Professionals Trust Us</h2>
              <p className="text-sm leading-relaxed">
                We work directly with salons and beauty academies across Pakistan to understand 
                what professionals need. Every product we offer has been tested in real salon 
                environments before being made available to our customers.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-[#7A1E3A] mb-2">For Parlours & Salons</h2>
              <p className="text-sm leading-relaxed mb-3">
                If you're a salon owner or beauty professional looking for wholesale pricing 
                and bulk ordering, we have a dedicated portal for you.
              </p>
              <Link 
                href="/parlours"
                className="inline-block bg-[#7A1E3A] text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-[#5A1226]"
              >
                Apply for Wholesale Access
              </Link>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center font-urdu" dir="rtl">
                — Aesthetic PK، پاکستان بھر کے سیلونز کا اعتماد
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
