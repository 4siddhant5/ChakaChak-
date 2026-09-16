import React, { useState, useEffect } from 'react';
import { useApp, useAuth } from '../../context/AppContext';
import { AnimatedModal } from '../common/AnimatedModal';
import { AuthOverlay } from '../auth/AuthOverlay';
import { CleaningTier, PropertyFurnishing, BHKSize, TransformationMode, CleaningAddon } from '../../types';
import { PreferredTimeSlotsGrid } from './PreferredTimeSlotsGrid';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Tag,
  Check,
  ShieldCheck,
  CreditCard,
  Smartphone,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Percent,
} from 'lucide-react';

interface BookingCheckoutModalProps {
  config: {
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
    specificPackage?: any;
    hourlyHours?: number;
    preferredDate?: string;
    preferredTimeSlot?: string;
    isUrgent?: boolean;
  };
  onClose: () => void;
  onBackToConfig?: (config: any) => void;
  onSuccess: (bookingId: string) => void;
}

export const BookingCheckoutModal: React.FC<BookingCheckoutModalProps> = ({
  config,
  onClose,
  onBackToConfig,
  onSuccess,
}) => {
  const {
    customer,
    selectedAddressId,
    setAddressPickerOpen,
    coupons,
    createNewBooking,
    pricing,
    showToast,
    goBack,
    pushNav,
    checkoutStep,
    setCheckoutStep,
    getPreviousTitle,
    checkoutDraft,
    updateCheckoutDraft,
    clearCheckoutDraft,
  } = useApp();

  const { user, isAuthenticated } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const selectedAddr =
    customer.savedAddresses.find((a) => a.id === selectedAddressId) ||
    customer.savedAddresses[0];

  // Steps: 'slot_and_coupon' | 'review_and_pay'
  const [step, setStep] = useState<'slot_and_coupon' | 'review_and_pay'>(checkoutStep || 'slot_and_coupon');

  useEffect(() => {
    if (checkoutStep && checkoutStep !== step) {
      setStep(checkoutStep);
    }
  }, [checkoutStep]);

  // Slot states initialized with config / draft if available
  const [selectedDate, setSelectedDate] = useState(
    config.preferredDate || checkoutDraft?.selectedDate || 'Today'
  );
  const [selectedSlot, setSelectedSlot] = useState(
    config.preferredTimeSlot || checkoutDraft?.selectedSlot || '02:30 PM - 06:30 PM'
  );
  const [isUrgent, setIsUrgent] = useState(
    config.isUrgent !== undefined ? config.isUrgent : (checkoutDraft?.isUrgent || false)
  );

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState(checkoutDraft?.appliedCouponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof coupons[0] | null>(() => {
    if (checkoutDraft?.appliedCouponCode) {
      return coupons.find((c) => c.code === checkoutDraft.appliedCouponCode) || null;
    }
    return null;
  });
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment choice
  const [paymentChoice, setPaymentChoice] = useState<'full' | 'advance'>(checkoutDraft?.paymentChoice || 'advance');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit Card' | 'Netbanking' | 'Cash on completion'>(
    checkoutDraft?.paymentMethod || 'UPI'
  );

  const handleSelectDate = (d: string) => {
    setSelectedDate(d);
    updateCheckoutDraft({ selectedDate: d });
  };

  const handleSelectSlot = (s: string) => {
    setSelectedSlot(s);
    updateCheckoutDraft({ selectedSlot: s });
  };

  const handleToggleUrgent = (urgent: boolean) => {
    setIsUrgent(urgent);
    updateCheckoutDraft({ isUrgent: urgent });
  };

  const handleSelectPaymentChoice = (choice: 'full' | 'advance') => {
    setPaymentChoice(choice);
    updateCheckoutDraft({ paymentChoice: choice });
  };

  const handleSelectPaymentMethod = (method: 'UPI' | 'Credit Card' | 'Netbanking' | 'Cash on completion') => {
    setPaymentMethod(method);
    updateCheckoutDraft({ paymentMethod: method });
  };

  const handleBack = () => {
    if (step === 'review_and_pay') {
      goBack();
    } else {
      if (onBackToConfig) {
        onBackToConfig(config);
      } else {
        goBack();
      }
    }
  };

  const handleGoToReview = () => {
    setStep('review_and_pay');
    setCheckoutStep('review_and_pay');
    pushNav('checkout_step2', 'step', 'Review & Payment');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onClose]);

  // Calculate financials
  const urgentFee = isUrgent ? pricing.urgentSurcharge : 0;
  const rawSubtotal = config.baseAmount;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      const calc = (rawSubtotal * appliedCoupon.discountPercent) / 100;
      discountAmount = appliedCoupon.maxDiscount ? Math.min(calc, appliedCoupon.maxDiscount) : calc;
    } else if (appliedCoupon.flatDiscount) {
      discountAmount = appliedCoupon.flatDiscount;
    }
  }

  const taxableAmount = Math.max(0, rawSubtotal + urgentFee - discountAmount);
  const taxes = Math.round(taxableAmount * 0.05); // 5% GST
  const grandTotal = taxableAmount + taxes;

  // Partial advance calculation: 10% standard, 20% urgent
  const advancePercent = isUrgent ? 20 : 10;
  const advancePayable = Math.round((grandTotal * advancePercent) / 100);
  const amountToPayNow = paymentChoice === 'full' ? grandTotal : advancePayable;
  const balanceDue = grandTotal - amountToPayNow;

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    setCouponError(null);

    const found = coupons.find((c) => c.code === code && c.active);
    if (!found) {
      setCouponError('Invalid or expired coupon code');
      return;
    }

    if (rawSubtotal < found.minOrderValue) {
      setCouponError(`Minimum booking amount of ₹${found.minOrderValue} required for ${code}`);
      return;
    }

    setAppliedCoupon(found);
    setCouponCodeInput(found.code);
    updateCheckoutDraft({ appliedCouponCode: found.code });
    showToast(`Promo code ${found.code} applied successfully!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError(null);
    updateCheckoutDraft({ appliedCouponCode: '' });
  };

  const handleConfirmAndPay = () => {
    // Require authentication before confirming any booking
    if (!user && !isAuthenticated) {
      showToast('Please sign in or create an account to book this service.');
      setShowAuthOverlay(true);
      return;
    }

    clearCheckoutDraft();
    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5A5F', '#E8355C', '#10B981', '#12222E'],
      });
    } catch (e) {
      // ignore
    }

    const newBooking = createNewBooking({
      serviceType: config.serviceType,
      serviceTitle: config.serviceTitle,
      configurationSummary: config.configurationSummary,
      serviceTier: config.serviceTier,
      furnishing: config.furnishing,
      bhkSize: config.bhkSize,
      transformationMode: config.transformationMode,
      selectedAddons: config.selectedAddons,
      date: isUrgent ? 'Today (Urgent 90-Min Dispatch)' : selectedDate,
      timeSlot: isUrgent ? 'Within 90 mins' : selectedSlot,
      isUrgent,
      baseAmount: rawSubtotal,
      discountAmount,
      urgentFee,
      taxes,
      totalAmount: grandTotal,
      paymentType: paymentChoice === 'full' ? 'full' : isUrgent ? 'advance_20' : 'advance_10',
      amountPaid: amountToPayNow,
      balanceDue,
      paymentMethod,
      paymentStatus: paymentChoice === 'full' ? 'Paid' : 'Advance Paid',
    });

    onSuccess(newBooking.id);
  };

  const timeSlots = [
    '08:30 AM - 12:30 PM',
    '11:30 AM - 03:30 PM',
    '02:30 PM - 06:30 PM',
    '05:00 PM - 08:30 PM',
  ];

  return (
    <AnimatedModal
      isOpen={Boolean(config)}
      onClose={onClose}
      variant="sheet"
      maxWidth="max-w-xl"
      className="bg-[#F8F9FB]"
    >
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-[44px] px-3.5 rounded-[14px] bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center gap-1.5 shrink-0"
            title={step === 'review_and_pay' ? 'Back to Slot Selection' : 'Back to Service Configuration'}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">
              {step === 'review_and_pay' ? 'Back to Timing' : 'Back to Service'}
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF5A5F] uppercase tracking-wider">
                {step === 'slot_and_coupon' ? 'Step 1 of 2 · Timing & Promos' : 'Step 2 of 2 · Payment & Review'}
              </span>
            </div>
            <h3 className="text-lg font-black text-[#12222E] mt-0.5">
              {step === 'slot_and_coupon' ? 'Select Slot & Address' : 'Review & Confirm Booking'}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition flex items-center justify-center shrink-0"
          title="Cancel Checkout"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {step === 'slot_and_coupon' ? (
            <>
              {/* Address card with quick switch */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#FF5A5F]" />
                    <span>Service Location</span>
                  </span>
                  <button
                    onClick={() => setAddressPickerOpen(true)}
                    className="text-xs font-bold text-[#FF5A5F] hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="mt-2.5 flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-gray-100 text-[#12222E] font-bold text-xs">
                    {selectedAddr.label}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#12222E]">
                      {selectedAddr.locality} ({selectedAddr.zone})
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{selectedAddr.address}</p>
                  </div>
                </div>
              </div>

              {/* Urgent Dispatch Banner */}
              <div
                onClick={() => handleToggleUrgent(!isUrgent)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  isUrgent
                    ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isUrgent ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                        Urgent 90-Min Rapid Pro Dispatch
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        +₹{pricing.urgentSurcharge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Priority allocation: Nearest senior partner leaves within 15 minutes.
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isUrgent ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {isUrgent && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Date & Time Slot Picker with Live Firestore Availability */}
              {!isUrgent && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                  <PreferredTimeSlotsGrid
                    selectedDate={selectedDate}
                    onSelectDate={handleSelectDate}
                    selectedSlot={selectedSlot}
                    onSelectSlot={handleSelectSlot}
                    isUrgent={isUrgent}
                    onToggleUrgent={handleToggleUrgent}
                    urgentSurcharge={pricing?.urgentSurcharge || 299}
                    showUrgentOption={false}
                  />
                </div>
              )}

              {/* Coupon Code Section */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#FF5A5F]" />
                    <span>Apply Coupon / Promo</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code (e.g. CHAKA20, SORTMUMBAI)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F]"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={!couponCodeInput}
                        className="px-4 py-2.5 bg-[#12222E] hover:bg-black text-white rounded-xl text-xs font-bold disabled:opacity-40 transition"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && (
                      <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{couponError}</span>
                      </p>
                    )}

                    {/* Quick Available Promo Chips */}
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
                        Active Offers for you
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coupons.slice(0, 3).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FFF5F6] hover:text-[#FF5A5F] text-[11px] font-mono font-semibold text-gray-700 transition flex items-center gap-1"
                          >
                            <Percent className="w-3 h-3 text-[#FF5A5F]" />
                            <span>{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-emerald-800">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">
                          Applied
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">{appliedCoupon.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-800">
                        -₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* STEP 2: REVIEW & PAYMENT METHOD */
            <>
              {/* User Authentication Status Banner */}
              <div
                id="checkout-auth-banner"
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  user || isAuthenticated
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      user || isAuthenticated ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {user || isAuthenticated ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">
                      {user || isAuthenticated
                        ? `Booking as ${user?.displayName || user?.email || customer.name}`
                        : 'Authentication Required'}
                    </div>
                    <div className="text-[11px] opacity-80 truncate">
                      {user || isAuthenticated
                        ? 'Live GPS tracking & GST invoice will be linked to your account'
                        : 'Sign in or create account to book services'}
                    </div>
                  </div>
                </div>

                {!user && !isAuthenticated && (
                  <button
                    id="checkout-signin-btn"
                    type="button"
                    onClick={() => setShowAuthOverlay(true)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#12222E] text-white text-xs font-bold hover:bg-[#1F3347] transition shadow-xs cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase text-gray-700">Order Summary</h4>
                  <span className="text-[11px] text-gray-400">
                    {isUrgent ? 'Urgent 90-Min' : selectedDate} · {isUrgent ? 'Express' : selectedSlot}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-[#12222E]">{config.serviceTitle}</span>
                      <p className="text-[11px] text-gray-500">{config.configurationSummary}</p>
                    </div>
                    <span className="font-extrabold text-[#12222E]">
                      ₹{rawSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {config.selectedAddons.map((addon) => (
                    <div key={addon.id} className="flex justify-between text-gray-600 pl-2 text-[11px]">
                      <span>+ {addon.name}</span>
                      <span>₹{addon.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}

                  {isUrgent && (
                    <div className="flex justify-between text-amber-800 font-semibold pl-2 text-[11px]">
                      <span>+ Urgent 90-Min Dispatch Surcharge</span>
                      <span>₹{urgentFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold pl-2 text-[11px]">
                      <span>Promo Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-500 pl-2 text-[11px]">
                    <span>Taxes & Cess (5% GST)</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="font-extrabold text-sm text-[#12222E]">Grand Total</span>
                    <span className="text-lg font-black text-[#12222E]">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Split: Full vs Partial Advance */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase block">
                  Choose Payment Schedule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleSelectPaymentChoice('advance')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      paymentChoice === 'advance'
                        ? 'border-[#FF5A5F] bg-[#FFF5F6] ring-2 ring-[#FF5A5F]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#12222E]">
                        Pay {advancePercent}% Advance
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-md">
                        Popular
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-base font-black text-[#FF5A5F]">
                        ₹{advancePayable.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-500">now</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Pay remaining ₹{balanceDue.toLocaleString('en-IN')} after completion & inspection.
                    </p>
                  </div>

                  <div
                    onClick={() => handleSelectPaymentChoice('full')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      paymentChoice === 'full'
                        ? 'border-[#FF5A5F] bg-[#FFF5F6] ring-2 ring-[#FF5A5F]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#12222E]">Pay 100% Full</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">
                        Hassle Free
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-base font-black text-[#12222E]">
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-gray-500">now</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Zero settlement balance upon job handover.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase block">
                  Select Payment Method
                </span>

                <div className="space-y-2">
                  {[
                    { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm / CRED)', badge: 'Fastest' },
                    { id: 'Credit Card', label: 'Credit / Debit Card (Visa, Mastercard, RuPay)' },
                    { id: 'Netbanking', label: 'Netbanking (HDFC, ICICI, SBI, Axis)' },
                    { id: 'Cash on completion', label: 'Cash on Handover (Pay post-service)' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        paymentMethod === m.id
                          ? 'border-[#FF5A5F] bg-[#FFF5F6] font-bold text-[#12222E]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentMethod === m.id
                              ? 'border-[#FF5A5F] bg-[#FF5A5F] text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === m.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>{m.label}</span>
                      </div>
                      {m.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                          {m.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-100 p-4 sm:p-5 shadow-xl flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] text-gray-400">
              {step === 'slot_and_coupon' ? 'Estimated Total' : 'Payable Now'}
            </div>
            <div className="text-xl font-black text-[#12222E]">
              ₹{(step === 'slot_and_coupon' ? grandTotal : amountToPayNow).toLocaleString('en-IN')}
            </div>
          </div>

          {step === 'slot_and_coupon' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="py-3 px-4 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleGoToReview}
                className="py-3 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-[#FF5A5F]/25 transition active:scale-98"
              >
                <span>Review & Pay</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[44px] py-3 px-4 rounded-[20px] border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                id="checkout-confirm-pay-btn"
                type="button"
                onClick={handleConfirmAndPay}
                className="min-h-[44px] py-3 px-5 sm:px-6 rounded-[20px] bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-[#FF5A5F]/25 transition active:scale-98 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {!user && !isAuthenticated
                    ? 'Sign In & Confirm'
                    : `Confirm & Pay ₹${amountToPayNow.toLocaleString('en-IN')}`}
                </span>
              </button>
            </div>
          )}
        </div>

      {/* Authentication Overlay to Sign Up or Sign In before booking */}
      <AuthOverlay
        isOpen={showAuthOverlay}
        onClose={() => setShowAuthOverlay(false)}
        onSuccess={() => {
          setShowAuthOverlay(false);
          showToast('Authentication complete! Finalizing your booking...');
          setTimeout(() => {
            handleConfirmAndPay();
          }, 350);
        }}
        title="Sign in to Confirm Booking"
        subtitle="Sign in or register your account to confirm this booking and track your Mumbai partner in real time."
      />
    </AnimatedModal>
  );
};
