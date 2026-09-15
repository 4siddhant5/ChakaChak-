import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Coupon } from '../../types';
import { Tag, Plus, Check, X, Percent, Calendar, AlertCircle } from 'lucide-react';

export const AdminCouponsManager: React.FC = () => {
  const { coupons, addCoupon, toggleCouponActive, showToast } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('20');
  const [minOrder, setMinOrder] = useState('1499');
  const [category, setCategory] = useState<'all' | 'transformation' | 'cleaning'>('all');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Coupon code is required');
      return;
    }

    addCoupon({
      code: code.trim().toUpperCase(),
      description,
      discountPercent: discountType === 'percent' ? Number(discountValue) : undefined,
      flatDiscount: discountType === 'flat' ? Number(discountValue) : undefined,
      minOrderValue: Number(minOrder) || 999,
      category,
      active: true,
      validTill: '31 Oct 2024',
    });

    setCode('');
    setDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#12222E]">Promotions & Campaign Engine</h2>
          <p className="text-xs text-gray-500">
            Create and monitor conversion coupons across Mumbai micro-markets
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-2xl bg-[#12222E] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.code}
            className={`p-4 rounded-3xl border bg-white shadow-xs transition space-y-3 ${
              c.active ? 'border-gray-200' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-black text-base text-[#12222E] tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-lg border">
                  {c.code}
                </span>
                <span className="block text-xs font-semibold text-gray-600 mt-2">
                  {c.description}
                </span>
              </div>

              <button
                onClick={() => toggleCouponActive(c.code)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                  c.active
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-red-50 hover:text-red-700'
                    : 'bg-gray-200 text-gray-600 hover:bg-emerald-100 hover:text-emerald-800'
                }`}
              >
                {c.active ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Benefit:</span>
                <span className="font-bold text-[#FF5A5F]">
                  {c.discountPercent ? `${c.discountPercent}% Discount` : `Flat ₹${c.flatDiscount} OFF`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min Booking:</span>
                <span className="font-semibold text-gray-700">₹{c.minOrderValue}</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-semibold text-gray-700 capitalize">{c.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-[#12222E]">Create New Campaign Code</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. BANDRAVIP, SORT50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 uppercase font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. 20% off for Carter Road residents"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Rupee (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Value ({discountType === 'percent' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Applicable Line</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    <option value="all">All Services</option>
                    <option value="transformation">Transformation</option>
                    <option value="cleaning">Deep Cleaning</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF5A5F] text-white rounded-xl font-bold hover:bg-[#E8355C]"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
