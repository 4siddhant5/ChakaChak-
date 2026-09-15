import React from 'react';
import { useApp } from '../../context/AppContext';
import { Tag, Percent, Copy, Check, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export const CustomerOffersView: React.FC = () => {
  const { coupons, setActiveConfigService, setPreselectedTier, setActiveCustomerTab, showToast } = useApp();

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(`Code "${code}" copied to clipboard!`);
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 pb-28">
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => setActiveCustomerTab('home')}
          className="w-9 h-9 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-center text-gray-700 hover:text-[#FF5A5F] hover:bg-gray-50 transition active:scale-95 shrink-0"
          title="Back to Home / Explore"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A5F] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Mumbai Promo Hub</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#12222E] mt-0.5">Exclusive Offers & Coupons</h2>
          <p className="text-xs text-gray-500">Apply any active promo code directly during checkout</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {coupons.map((coupon) => (
          <div
            key={coupon.code}
            className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
          >
            {/* Left accent notch */}
            <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-[#FF5A5F] to-[#E8355C]"></div>

            <div className="pl-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-[#12222E] tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                      {coupon.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {coupon.discountPercent ? `${coupon.discountPercent}% OFF` : `₹${coupon.flatDiscount} OFF`}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 mt-2">
                    {coupon.description}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Valid on orders above ₹{coupon.minOrderValue.toLocaleString('en-IN')} · Expires {coupon.validTill}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyCode(coupon.code)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFF5F6] hover:bg-[#FF5A5F] text-[#FF5A5F] hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">
                  Category: {coupon.category}
                </span>
                <button
                  onClick={() => {
                    handleCopyCode(coupon.code);
                    if (coupon.category === 'cleaning') {
                      setActiveConfigService('cleaning');
                      setPreselectedTier('diamond');
                    } else {
                      setActiveConfigService('transformation');
                    }
                  }}
                  className="min-h-[44px] text-xs font-bold text-[#FF5A5F] hover:underline flex items-center gap-1 active:scale-95"
                >
                  <span>Book with this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
