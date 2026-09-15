import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PricingConfig, BHKSize, CleaningTier, PropertyFurnishing } from '../../types';
import {
  DollarSign,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
} from 'lucide-react';

export const AdminPricingManager: React.FC = () => {
  const { pricing, updatePricingConfig, showToast } = useApp();

  // Local state for editable fields
  const [formPricing, setFormPricing] = useState<PricingConfig>(() =>
    JSON.parse(JSON.stringify(pricing))
  );
  const [isSaved, setIsSaved] = useState(false);
  const [activeFurnishingTab, setActiveFurnishingTab] = useState<PropertyFurnishing>('furnished');

  // Test Calculator State to verify live pricing math
  const [calcTier, setCalcTier] = useState<CleaningTier>('diamond');
  const [calcBHK, setCalcBHK] = useState<BHKSize>('3BHK');
  const [calcFurnished, setCalcFurnished] = useState<boolean>(true);

  const testPrice =
    formPricing.cleaningTiers?.[calcTier]?.basePrice?.[
      calcFurnished ? 'furnished' : 'unfurnished'
    ]?.[calcBHK] || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricingConfig(formPricing);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormPricing(JSON.parse(JSON.stringify(pricing)));
    showToast('Reverted to current live prices');
  };

  const bhkList: BHKSize[] = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];
  const transformationBhkList: BHKSize[] = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];
  const tiers: CleaningTier[] = ['silver', 'gold', 'platinum', 'diamond'];

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#12222E]">
            Dynamic Pricing & Catalogue Matrix
          </h2>
          <p className="text-xs text-gray-500">
            Real-time rate management across Mumbai zones. Updates take effect instantly in the Customer & Partner apps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revert</span>
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white text-xs font-black shadow-md shadow-[#FF5A5F]/20 hover:opacity-95 transition flex items-center gap-1.5"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Published Live!' : 'Publish Prices'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pricing Configuration Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: Home Transformation / Organizing Rates */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#12222E] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF5A5F]" />
                  <span>1. Home Transformation & Decluttering Rates</span>
                </h3>
                <p className="text-xs text-gray-500">Hourly Pro rates and Full-Home BHK packages</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-900 rounded-full">
                Primary Service Line
              </span>
            </div>

            {/* Hourly Packages */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Hourly Session Packages (₹)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(formPricing.hourlyRates || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-700 block">{item.label}</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value);
                          const newHourlyRates = [...(formPricing.hourlyRates || [])];
                          newHourlyRates[idx] = { ...newHourlyRates[idx], price: newPrice };
                          setFormPricing({ ...formPricing, hourlyRates: newHourlyRates });
                        }}
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent Surcharge */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Urgent 90-Minute Dispatch Surcharge (₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-2 text-gray-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={formPricing.urgentSurcharge || 0}
                  onChange={(e) =>
                    setFormPricing({
                      ...formPricing,
                      urgentSurcharge: Number(e.target.value),
                    })
                  }
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-[#FF5A5F]"
                />
              </div>
            </div>

            {/* BHK Full-Home Transformation */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-gray-500" />
                <span>Full-Home Transformation by BHK (₹)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {transformationBhkList.map((bhk) => (
                  <div key={bhk} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      {bhk}
                    </span>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1 text-gray-400 font-bold text-[10px]">₹</span>
                      <input
                        type="number"
                        value={formPricing.bhkTransformation?.[bhk]?.price || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormPricing({
                            ...formPricing,
                            bhkTransformation: {
                              ...formPricing.bhkTransformation,
                              [bhk]: {
                                ...(formPricing.bhkTransformation?.[bhk] || { originalPrice: Math.round(val * 1.3) }),
                                price: val,
                              },
                            },
                          });
                        }}
                        className="w-full pl-5 pr-1.5 py-1 rounded-lg border border-gray-200 text-xs font-extrabold bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: Deep Cleaning Matrix (Silver to Diamond) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#12222E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>2. Home Deep Cleaning Matrix (Silver → Diamond)</span>
                </h3>
                <p className="text-xs text-gray-500">Tier base prices across standard Mumbai BHK configurations</p>
              </div>

              {/* Furnishing Tab Switcher */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFurnishingTab('furnished')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeFurnishingTab === 'furnished'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Furnished
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFurnishingTab('unfurnished')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeFurnishingTab === 'unfurnished'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Unfurnished
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-500 font-bold">
                    <th className="py-2 px-2">Tier</th>
                    {bhkList.map((bhk) => (
                      <th key={bhk} className="py-2 px-2 text-center">
                        {bhk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tiers.map((tier) => (
                    <tr key={tier} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-bold uppercase text-[#12222E]">
                        {tier}
                      </td>
                      {bhkList.map((bhk) => (
                        <td key={bhk} className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={
                              formPricing.cleaningTiers?.[tier]?.basePrice?.[activeFurnishingTab]?.[bhk] || 0
                            }
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const currentTier = formPricing.cleaningTiers?.[tier];
                              if (!currentTier) return;
                              setFormPricing({
                                ...formPricing,
                                cleaningTiers: {
                                  ...formPricing.cleaningTiers,
                                  [tier]: {
                                    ...currentTier,
                                    basePrice: {
                                      ...currentTier.basePrice,
                                      [activeFurnishingTab]: {
                                        ...currentTier.basePrice?.[activeFurnishingTab],
                                        [bhk]: val,
                                      },
                                    },
                                  },
                                },
                              });
                            }}
                            className="w-18 px-1.5 py-1 text-center rounded-md border border-gray-200 text-xs font-bold"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400">
              * Editing prices under <strong className="text-gray-700 capitalize">{activeFurnishingTab}</strong> properties. Switch tabs above to configure unfurnished rates.
            </p>
          </div>
        </div>

        {/* Right Col: Live Simulation Playground & Diagnostics */}
        <div className="space-y-4">
          <div className="bg-gradient-to-tr from-[#12222E] to-[#1E3B50] text-white p-5 rounded-3xl shadow-lg space-y-4 sticky top-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm sm:text-base">Live Quote Simulator</h3>
            </div>
            <p className="text-xs text-gray-300">
              Test how changes will reflect for Mumbai customers on the booking screen in real-time.
            </p>

            {/* Test Controls */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Tier</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {tiers.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCalcTier(t)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition ${
                        calcTier === t ? 'bg-[#FF5A5F] text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">BHK</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {bhkList.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setCalcBHK(b)}
                      className={`py-1 px-2 rounded-lg text-xs font-bold transition ${
                        calcBHK === b ? 'bg-amber-400 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-300">Property Status:</span>
                <button
                  type="button"
                  onClick={() => setCalcFurnished(!calcFurnished)}
                  className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition"
                >
                  {calcFurnished ? 'Furnished' : 'Unfurnished'}
                </button>
              </div>
            </div>

            {/* Result Display */}
            <div className="pt-4 border-t border-white/20">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                Calculated Base Customer Price
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                ₹{testPrice.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synchronized with active AppContext</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
