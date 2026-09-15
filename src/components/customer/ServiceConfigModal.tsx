import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import {
  CleaningTier,
  PropertyFurnishing,
  BHKSize,
  TransformationMode,
  CleaningAddon,
  SpecificItemPackage,
} from '../../types';
import { SPECIFIC_PACKAGES, CLEANING_ADDONS } from '../../data/mockData';
import {
  X,
  Check,
  Sparkles,
  Info,
  Clock,
  Home,
  Shield,
  Layers,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Zap,
  HelpCircle,
} from 'lucide-react';

interface ServiceConfigModalProps {
  serviceType?: 'transformation' | 'cleaning';
  initialConfig?: any;
  onClose?: () => void;
  onProceedToCheckout: (config: {
    serviceType: 'transformation' | 'cleaning';
    serviceTitle: string;
    configurationSummary: string;
    serviceTier?: CleaningTier;
    furnishing?: PropertyFurnishing;
    bhkSize?: BHKSize;
    transformationMode?: TransformationMode;
    selectedAddons: CleaningAddon[];
    baseAmount: number;
    originalAmount: number;
    specificPackage?: SpecificItemPackage;
    hourlyHours?: number;
  }) => void;
}

export const ServiceConfigModal: React.FC<ServiceConfigModalProps> = ({
  serviceType,
  initialConfig,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    activeConfigService,
    setActiveConfigService,
    preselectedTier,
    setPreselectedTier,
    pricing,
    goBack,
    getPreviousTitle,
    saveServiceConfigDraft,
    getServiceConfigDraft,
  } = useApp();

  const currentServiceType = serviceType || activeConfigService;
  const existingDraft = currentServiceType ? getServiceConfigDraft(currentServiceType) : null;
  const effectiveConfig = initialConfig || existingDraft;

  // Transformation states
  const [transMode, setTransMode] = useState<TransformationMode>(
    effectiveConfig?.transformationMode || 'bhk'
  );
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState(() => {
    if (effectiveConfig?.hourlyHours && pricing?.hourlyRates) {
      const idx = pricing.hourlyRates.findIndex((r) => r.hours === effectiveConfig.hourlyHours);
      return idx !== -1 ? idx : 1;
    }
    return 1;
  }); // 3 hours default
  const [selectedTransBHK, setSelectedTransBHK] = useState<BHKSize>(
    effectiveConfig?.bhkSize || '2BHK'
  );
  const [selectedSpecificPkg, setSelectedSpecificPkg] = useState<SpecificItemPackage>(
    effectiveConfig?.specificPackage || SPECIFIC_PACKAGES[0]
  );

  // Deep Cleaning states
  const [furnishing, setFurnishing] = useState<PropertyFurnishing>(
    effectiveConfig?.furnishing || 'furnished'
  );
  const [selectedCleaningTier, setSelectedCleaningTier] = useState<CleaningTier>(
    effectiveConfig?.serviceTier || preselectedTier || 'platinum'
  );
  const [selectedCleaningBHK, setSelectedCleaningBHK] = useState<BHKSize>(
    effectiveConfig?.bhkSize || '2BHK'
  );
  const [selectedAddons, setSelectedAddons] = useState<CleaningAddon[]>(
    effectiveConfig?.selectedAddons || []
  );
  const [showTierComparison, setShowTierComparison] = useState(false);

  // Persist draft whenever choices change
  useEffect(() => {
    if (currentServiceType) {
      saveServiceConfigDraft(currentServiceType, {
        transformationMode: transMode,
        hourlyHours: pricing?.hourlyRates?.[selectedHourlyIndex]?.hours,
        bhkSize: currentServiceType === 'transformation' ? selectedTransBHK : selectedCleaningBHK,
        specificPackage: selectedSpecificPkg,
        furnishing,
        serviceTier: selectedCleaningTier,
        selectedAddons,
      });
    }
  }, [
    currentServiceType,
    transMode,
    selectedHourlyIndex,
    selectedTransBHK,
    selectedSpecificPkg,
    furnishing,
    selectedCleaningTier,
    selectedCleaningBHK,
    selectedAddons,
  ]);

  useEffect(() => {
    if (preselectedTier && !initialConfig?.serviceTier) {
      setSelectedCleaningTier(preselectedTier);
    }
  }, [preselectedTier, initialConfig?.serviceTier]);

  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.transformationMode) setTransMode(initialConfig.transformationMode);
      if (initialConfig.bhkSize) {
        setSelectedTransBHK(initialConfig.bhkSize);
        setSelectedCleaningBHK(initialConfig.bhkSize);
      }
      if (initialConfig.furnishing) setFurnishing(initialConfig.furnishing);
      if (initialConfig.serviceTier) setSelectedCleaningTier(initialConfig.serviceTier);
      if (initialConfig.selectedAddons) setSelectedAddons(initialConfig.selectedAddons);
      if (initialConfig.specificPackage) setSelectedSpecificPkg(initialConfig.specificPackage);
    }
  }, [initialConfig]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      goBack();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!currentServiceType) return null;

  // Compute live price
  let currentPrice = 0;
  let originalPrice = 0;
  let configSummary = '';
  let serviceTitle = '';

  if (currentServiceType === 'transformation') {
    serviceTitle = 'Home Transformation & Organizing';
    if (transMode === 'hourly') {
      const hRate = pricing.hourlyRates[selectedHourlyIndex];
      currentPrice = hRate.price;
      originalPrice = hRate.originalPrice;
      configSummary = `${hRate.label} · Dedicated Space Organizer with Label Tools`;
    } else if (transMode === 'bhk') {
      const bRate = pricing.bhkTransformation[selectedTransBHK];
      currentPrice = bRate.price;
      originalPrice = bRate.originalPrice;
      configSummary = `${selectedTransBHK} Complete Home Organizing & Declutter Overhaul`;
    } else {
      currentPrice = selectedSpecificPkg.price;
      originalPrice = selectedSpecificPkg.originalPrice;
      configSummary = `${selectedSpecificPkg.name} (${selectedSpecificPkg.category})`;
    }
  } else {
    serviceTitle = 'Home Deep Cleaning';
    const tierData = pricing.cleaningTiers[selectedCleaningTier];
    const base = tierData.basePrice[furnishing][selectedCleaningBHK];
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const addonsOriginalTotal = selectedAddons.reduce((sum, a) => sum + a.originalPrice, 0);

    currentPrice = base + addonsTotal;
    originalPrice = Math.round(base * tierData.originalPriceMultiplier) + addonsOriginalTotal;

    const addonsText =
      selectedAddons.length > 0 ? ` + ${selectedAddons.length} Add-on(s)` : '';
    configSummary = `${tierData.name} · ${selectedCleaningBHK} (${furnishing})${addonsText}`;
  }

  const toggleAddon = (addon: CleaningAddon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons((prev) => prev.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons((prev) => [...prev, addon]);
    }
  };

  const handleContinue = () => {
    onProceedToCheckout({
      serviceType: currentServiceType,
      serviceTitle,
      configurationSummary: configSummary,
      serviceTier: currentServiceType === 'cleaning' ? selectedCleaningTier : undefined,
      furnishing: currentServiceType === 'cleaning' ? furnishing : undefined,
      bhkSize:
        currentServiceType === 'cleaning'
          ? selectedCleaningBHK
          : transMode === 'bhk'
          ? selectedTransBHK
          : undefined,
      transformationMode: currentServiceType === 'transformation' ? transMode : undefined,
      selectedAddons,
      baseAmount: currentPrice,
      originalAmount: originalPrice,
      specificPackage:
        currentServiceType === 'transformation' && transMode === 'specific'
          ? selectedSpecificPkg
          : undefined,
      hourlyHours:
        currentServiceType === 'transformation' && transMode === 'hourly'
          ? pricing.hourlyRates[selectedHourlyIndex].hours
          : undefined,
    });
  };

  const allBhkSizes: BHKSize[] = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];
  const allTiers: CleaningTier[] = ['silver', 'gold', 'platinum', 'diamond'];

  return (
    <AnimatedModal
      isOpen={Boolean(currentServiceType)}
      onClose={handleClose}
      variant="sheet"
      maxWidth="max-w-2xl"
      className="bg-[#F8F9FB]"
    >
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center justify-center shrink-0"
            title="Back to Previous Screen"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A5F]">
                {currentServiceType === 'transformation' ? 'Primary Service Line' : 'Deep Restoration'}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Mumbai Pros
              </span>
            </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#12222E] mt-0.5">
                {currentServiceType === 'transformation'
                  ? 'Home Transformation & Organizing'
                  : 'Home Deep Cleaning'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SERVICE LINE 1: HOME TRANSFORMATION */}
          {currentServiceType === 'transformation' && (
            <div className="space-y-6">
              {/* Mode Switcher Tabs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Choose Booking Format
                </label>
                <div className="grid grid-cols-3 gap-2 bg-gray-200/70 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setTransMode('bhk')}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                      transMode === 'bhk'
                        ? 'bg-white text-[#12222E] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Full-Home (BHK)
                  </button>
                  <button
                    onClick={() => setTransMode('hourly')}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                      transMode === 'hourly'
                        ? 'bg-white text-[#12222E] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Hourly Slots
                  </button>
                  <button
                    onClick={() => setTransMode('specific')}
                    className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                      transMode === 'specific'
                        ? 'bg-white text-[#12222E] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Specific Area
                  </button>
                </div>
              </div>

              {/* BHK Mode */}
              {transMode === 'bhk' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Select Property Layout</span>
                    <span className="text-xs text-gray-500">Includes all rooms & wardrobes</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {allBhkSizes.map((bhk) => {
                      const isSelected = selectedTransBHK === bhk;
                      const itemPrice = pricing.bhkTransformation[bhk].price;
                      return (
                        <button
                          key={bhk}
                          onClick={() => setSelectedTransBHK(bhk)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'border-[#FF5A5F] bg-[#FFF5F6] text-[#12222E] ring-2 ring-[#FF5A5F]/30 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="font-extrabold text-sm sm:text-base">{bhk}</div>
                          <div className="text-[11px] font-semibold text-gray-600 mt-1">
                            ₹{itemPrice.toLocaleString('en-IN')}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Included Scope Details */}
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs space-y-2.5">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#FF5A5F]" />
                      <span>Included in {selectedTransBHK} Full-Home Transformation</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>All bedroom wardrobes sorted & folded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Modular kitchen pullouts & jars aligned</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Hydraulic bedbox & heavy luggage sort</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Label printing & category binning tools</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hourly Mode */}
              {transMode === 'hourly' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Choose Duration</span>
                    <span className="text-xs text-gray-500">Starting from ₹999</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(pricing?.hourlyRates || []).map((rate, idx) => {
                      const isSelected = selectedHourlyIndex === idx;
                      return (
                        <div
                          key={rate.hours}
                          onClick={() => setSelectedHourlyIndex(idx)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[#FF5A5F] bg-[#FFF5F6] ring-2 ring-[#FF5A5F]/30 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#12222E]">{rate.label}</span>
                            <div className="text-right">
                              <span className="text-base font-extrabold text-[#12222E]">
                                ₹{rate.price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-400 line-through ml-1.5">
                                ₹{rate.originalPrice.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#FF5A5F]" />
                            <span>{rate.hours} hours active sorting by certified organizer</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specific Items Mode */}
              {transMode === 'specific' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Select Specific Package</span>
                    <span className="text-xs text-gray-500">Curated targeted zones</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {SPECIFIC_PACKAGES.map((pkg) => {
                      const isSelected = selectedSpecificPkg.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedSpecificPkg(pkg)}
                          className={`rounded-2xl border overflow-hidden cursor-pointer transition-all flex flex-col ${
                            isSelected
                              ? 'border-[#FF5A5F] ring-2 ring-[#FF5A5F]/30 shadow-sm bg-white'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="relative h-32 w-full overflow-hidden">
                            <img
                              src={pkg.image}
                              alt={pkg.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            {pkg.popular && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-xs">
                                MOST LOVED
                              </span>
                            )}
                            <span className="absolute bottom-2 left-2 text-[11px] font-semibold text-white/90">
                              {pkg.estimatedHours}
                            </span>
                            <div className="absolute bottom-2 right-2 text-right">
                              <span className="text-white font-extrabold text-sm">
                                ₹{pkg.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="font-bold text-xs sm:text-sm text-[#12222E]">
                                {pkg.name}
                              </h5>
                              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                {pkg.description}
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-gray-400">
                                {pkg.category}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  isSelected ? 'text-[#FF5A5F]' : 'text-gray-500'
                                }`}
                              >
                                {isSelected ? 'Selected ✓' : 'Select'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SERVICE LINE 2: HOME DEEP CLEANING */}
          {currentServiceType === 'cleaning' && (
            <div className="space-y-6">
              {/* Furnished vs Unfurnished Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Property State
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-200/70 p-1.5 rounded-2xl">
                  <button
                    onClick={() => setFurnishing('furnished')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                      furnishing === 'furnished'
                        ? 'bg-white text-[#12222E] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Furnished Home</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Standard
                    </span>
                  </button>
                  <button
                    onClick={() => setFurnishing('unfurnished')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                      furnishing === 'unfurnished'
                        ? 'bg-white text-[#12222E] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Unfurnished / Vacant</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                      Save ~20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Property BHK Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">Property Size</label>
                  <span className="text-xs text-gray-500">1RK to 5BHK</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {allBhkSizes.map((bhk) => {
                    const isSelected = selectedCleaningBHK === bhk;
                    return (
                      <button
                        key={bhk}
                        onClick={() => setSelectedCleaningBHK(bhk)}
                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-[#FF5A5F] bg-[#FFF5F6] text-[#12222E] ring-2 ring-[#FF5A5F]/30 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-extrabold text-sm">{bhk}</div>
                        <div className="text-[10px] text-gray-500">
                          {furnishing === 'furnished' ? 'Furnished' : 'Vacant'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-Tier Selector (Silver / Gold / Platinum / Diamond) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Select Cleaning Tier
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTierComparison(!showTierComparison)}
                    className="text-xs font-bold text-[#FF5A5F] hover:underline flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{showTierComparison ? 'Hide Comparison' : 'Compare 4 Tiers'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allTiers.map((tierKey) => {
                    const tier = pricing.cleaningTiers[tierKey];
                    const isSelected = selectedCleaningTier === tierKey;
                    const price = tier.basePrice[furnishing][selectedCleaningBHK];
                    const orig = Math.round(price * tier.originalPriceMultiplier);

                    return (
                      <div
                        key={tierKey}
                        onClick={() => setSelectedCleaningTier(tierKey)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#FF5A5F] bg-[#FFF5F6] ring-2 ring-[#FF5A5F]/30 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FF5A5F]/10 text-[#FF5A5F] uppercase">
                              {tier.badge}
                            </span>
                            <div className="text-right">
                              <span className="text-base font-extrabold text-[#12222E]">
                                ₹{price.toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-400 line-through ml-1.5">
                                ₹{orig.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-sm text-[#12222E] mt-2">
                            {tier.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                            {tier.tagline}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-gray-100">
                          <ul className="space-y-1 text-[11px] text-gray-600">
                            {(tier.highlights || []).slice(0, 2).map((h, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="line-clamp-1">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Detailed Tier Comparison Modal / Drawer */}
              {showTierComparison && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h5 className="text-xs font-bold uppercase text-gray-800">
                      Tier Inclusion Comparison ({selectedCleaningBHK})
                    </h5>
                    <button
                      onClick={() => setShowTierComparison(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Close
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="py-2 pr-2">Feature / Scope</th>
                          <th className="py-2 px-1 text-center font-bold">Silver</th>
                          <th className="py-2 px-1 text-center font-bold">Gold</th>
                          <th className="py-2 px-1 text-center font-bold">Platinum</th>
                          <th className="py-2 px-1 text-center font-bold text-[#FF5A5F]">Diamond</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        <tr>
                          <td className="py-2 pr-2 font-medium">Floor Single-Disc Buffing</td>
                          <td className="text-center py-2">✓</td>
                          <td className="text-center py-2">✓</td>
                          <td className="text-center py-2">✓</td>
                          <td className="text-center py-2 font-bold text-emerald-600">✓ Italian Compound</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 font-medium">Hard Water Descaling (Bath)</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2">✓ Heavy</td>
                          <td className="text-center py-2">✓ Heavy</td>
                          <td className="text-center py-2 font-bold text-emerald-600">✓ + Grout Seal</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 font-medium">Sofa Injection Shampooing</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 font-bold text-emerald-600">✓ 5-Seater</td>
                          <td className="text-center py-2 font-bold text-emerald-600">✓ 5-Seater + Mattresses</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 font-medium">140°C High-Temp Steam Sterilization</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 font-bold text-[#FF5A5F]">✓ Medical Grade</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 font-medium">Inside Kitchen Cabinets Deep Clean</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 text-gray-300">—</td>
                          <td className="text-center py-2 font-bold text-emerald-600">✓ Complete Empty & Wipe</td>
                        </tr>
                        <tr className="bg-gray-50/80 font-bold">
                          <td className="py-2.5 pr-2 text-gray-900">Price ({selectedCleaningBHK})</td>
                          <td className="text-center py-2.5">
                            ₹{pricing.cleaningTiers.silver.basePrice[furnishing][selectedCleaningBHK].toLocaleString('en-IN')}
                          </td>
                          <td className="text-center py-2.5">
                            ₹{pricing.cleaningTiers.gold.basePrice[furnishing][selectedCleaningBHK].toLocaleString('en-IN')}
                          </td>
                          <td className="text-center py-2.5">
                            ₹{pricing.cleaningTiers.platinum.basePrice[furnishing][selectedCleaningBHK].toLocaleString('en-IN')}
                          </td>
                          <td className="text-center py-2.5 text-[#FF5A5F]">
                            ₹{pricing.cleaningTiers.diamond.basePrice[furnishing][selectedCleaningBHK].toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add-ons Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Optional Add-ons
                  </label>
                  <span className="text-xs text-gray-500">Tap to toggle</span>
                </div>

                <div className="space-y-2">
                  {CLEANING_ADDONS.map((addon) => {
                    const isSelected = selectedAddons.some((a) => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'border-[#FF5A5F] bg-[#FFF5F6]'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                              isSelected
                                ? 'bg-[#FF5A5F] border-[#FF5A5F] text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-[#12222E]">{addon.name}</h5>
                            <p className="text-[11px] text-gray-500">{addon.description}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <div className="text-xs font-extrabold text-[#12222E]">
                            +₹{addon.price.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-gray-400 line-through">
                            ₹{addon.originalPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live-Updating Sticky Bottom Bar */}
        <div className="bg-white border-t border-gray-100 p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-[#12222E]">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {originalPrice > currentPrice && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  Save ₹{(originalPrice - currentPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">{configSummary}</p>
          </div>

          <button
            onClick={handleContinue}
            className="min-h-[44px] py-3 px-5 sm:px-7 rounded-[20px] bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-[#FF5A5F]/25 transition shrink-0 active:scale-98"
          >
            <span>Select Slot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
    </AnimatedModal>
  );
};
