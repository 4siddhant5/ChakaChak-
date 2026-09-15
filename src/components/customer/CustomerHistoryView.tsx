import React, { useState, useEffect } from 'react';
import { useApp, useRealtimeUserBookingsAndCatalog } from '../../context/AppContext';
import { Booking } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PhotoZoomModal } from './PhotoZoomModal';
import {
  Clock,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Navigation,
  FileText,
  Star,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Home,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Receipt,
  Eye,
  Maximize2,
  X,
  Layers,
  ZoomIn,
  Sliders,
  Check,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface PhotoLightboxState {
  isOpen: boolean;
  bookingId: string;
  serviceTitle: string;
  beforePhoto?: string;
  afterPhoto?: string;
  activeView: 'before' | 'after' | 'side-by-side';
}

export const CustomerHistoryView: React.FC = () => {
  const {
    bookings: contextBookings,
    setActiveCustomerTab,
    setActiveTrackingBookingId,
    setActiveInvoiceBookingId,
    setActiveRatingBookingId,
    setActiveConfigService,
    rebookBooking,
    showToast,
    goBack,
    pushNav,
    getPreviousTitle,
  } = useApp();

  // Use the Firestore onSnapshot real-time sync hook
  const { userBookings, isSyncing, isConnected } = useRealtimeUserBookingsAndCatalog();
  const bookings = userBookings.length > 0 ? userBookings : contextBookings;

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Track expanded cards. Default expand the first completed booking or top booking for immediate clarity
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const firstCompleted = bookings.find((b) => b.status === 'completed');
    if (firstCompleted) {
      return { [firstCompleted.id]: true };
    }
    return bookings[0] ? { [bookings[0].id]: true } : {};
  });

  // Lightbox for high-resolution before/after photo inspection
  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);

  useEffect(() => {
    const handleCloseEvent = () => {
      setLightbox(null);
    };
    window.addEventListener('close-photo-lightbox', handleCloseEvent);
    return () => window.removeEventListener('close-photo-lightbox', handleCloseEvent);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox?.isOpen) {
        handleCloseLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const toggleExpand = (bookingId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return b.status !== 'completed' && b.status !== 'cancelled';
    if (filter === 'completed') return b.status === 'completed';
    return true;
  });

  const handleOpenLightbox = (
    booking: Booking,
    initialView: 'before' | 'after' | 'side-by-side' = 'after'
  ) => {
    const beforePhoto = booking.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85';
    const afterPhoto = booking.afterPhotos?.[0] || (booking.status === 'completed' ? 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=85' : undefined);
    
    setLightbox({
      isOpen: true,
      bookingId: booking.id,
      serviceTitle: booking.serviceTitle,
      beforePhoto,
      afterPhoto,
      activeView: initialView,
    });
    pushNav('photo_lightbox', 'modal', `Inspection ${booking.id}`);
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
    goBack();
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 pb-28 max-w-4xl mx-auto">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={goBack}
            className="w-9 h-9 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-center text-gray-700 hover:text-[#FF5A5F] hover:bg-gray-50 transition active:scale-95 shrink-0"
            title={getPreviousTitle()}
            aria-label="Back to Previous View"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#12222E]">Your Service History</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-bold text-emerald-700">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : 'animate-pulse'}`}></span>
                Live Sync
              </span>
            </div>
            <p className="text-xs text-gray-500">Inspect before/after results, itemized receipts & re-book in 1-tap</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveCustomerTab('home')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition shrink-0 shadow-xs"
        >
          <Home className="w-3.5 h-3.5 text-[#FF5A5F]" />
          <span>Home</span>
        </button>
      </div>

      {/* Filter Tabs & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex gap-1.5 bg-gray-200/70 p-1 rounded-2xl w-full sm:w-auto">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial sm:px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold capitalize transition flex items-center justify-center ${
                filter === tab
                  ? 'bg-white text-[#12222E] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'all' ? 'All Bookings' : tab === 'active' ? 'Active Jobs' : 'Completed'}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-semibold text-gray-400 self-end sm:self-center">
          Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
        </span>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No bookings match this filter</p>
            <p className="text-xs text-gray-400 mt-1">Ready to book an organizing or deep cleaning pro?</p>
            <button
              type="button"
              onClick={() => setActiveConfigService('cleaning')}
              className="mt-4 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF5A5F] text-white text-xs font-bold hover:bg-[#E8355C] transition shadow-xs active:scale-95 flex items-center justify-center mx-auto"
            >
              Book ChakaChak Pro
            </button>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isActive = b.status !== 'completed' && b.status !== 'cancelled';
            const isExpanded = !!expandedIds[b.id];
            const hasBeforePhotos = (b.beforePhotos && b.beforePhotos.length > 0);
            const hasAfterPhotos = (b.afterPhotos && b.afterPhotos.length > 0);
            const showPhotosSection = hasBeforePhotos || hasAfterPhotos;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-[20px] border transition-all duration-200 overflow-hidden shadow-sm ${
                  isExpanded ? 'border-gray-300 ring-2 ring-gray-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Collapsed / Summary Header Bar */}
                <div 
                  className="p-4 sm:p-5 cursor-pointer select-none"
                  onClick={() => toggleExpand(b.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          #{b.id}
                        </span>
                        <StatusBadge status={b.status} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{b.date}</span>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-[#12222E] tracking-tight truncate">
                        {b.serviceTitle}
                      </h3>
                      
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {b.configurationSummary}
                      </p>
                    </div>

                    {/* Price & Primary Header Actions */}
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-base sm:text-lg font-black text-[#12222E]">
                        ₹{b.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Quick Meta Row */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-500 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.timeSlot}</span>
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{b.customerAddress.locality}</span>
                      </span>
                      {b.workerName && (
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <img
                            src={b.workerPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                            alt={b.workerName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{b.workerName}</span>
                        </span>
                      )}
                    </div>

                    {/* Expand/Collapse Toggle & Re-book shortcut */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => rebookBooking(b)}
                        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#FF5A5F] hover:text-[#E8355C] text-xs font-bold flex items-center gap-1 transition active:scale-95 border border-red-100/80"
                        title="Re-book with exact same options"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-book</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(b.id)}
                        className="min-h-[44px] px-2.5 py-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition flex items-center gap-0.5 text-xs font-semibold"
                        aria-expanded={isExpanded}
                      >
                        <span className="hidden sm:inline text-[11px]">{isExpanded ? 'Less' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-[#FBFBFC] p-4 sm:p-5 space-y-5 animate-fadeIn">
                    {/* SECTION 1: Service Lifecycle Timestamps */}
                    <div className="bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#FF5A5F]" />
                          <span>Service Milestones & Timeline</span>
                        </h4>
                        <span className="text-[11px] font-mono text-gray-400">
                          Invoice: {b.invoiceNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-semibold block">Confirmed</span>
                          <span className="text-xs font-bold text-gray-800">{b.statusTimestamps.confirmed || 'Recorded'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-semibold block">Pro Assigned</span>
                          <span className="text-xs font-bold text-gray-800">{b.statusTimestamps.worker_assigned || '09:15 AM'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-semibold block">En Route / Arrived</span>
                          <span className="text-xs font-bold text-gray-800">{b.statusTimestamps.en_route || '10:00 AM'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-semibold block">Job Status</span>
                          <span className={`text-xs font-bold ${b.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {b.status === 'completed' ? (b.statusTimestamps.completed || 'Completed') : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: HIGH-RES BEFORE & AFTER PHOTO PREVIEWS */}
                    <div className="bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>High-Resolution Before / After Results</span>
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            High-definition camera logs documented by your ChakaChak specialist
                          </p>
                        </div>

                        {showPhotosSection && (
                          <button
                            type="button"
                            onClick={() => handleOpenLightbox(b, 'side-by-side')}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                          >
                            <Maximize2 className="w-3 h-3 text-gray-500" />
                            <span>Side-by-Side Zoom</span>
                          </button>
                        )}
                      </div>

                      {showPhotosSection ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Before Card */}
                          <div 
                            onClick={() => handleOpenLightbox(b, 'before')}
                            className="group relative rounded-2xl overflow-hidden border border-gray-200 cursor-pointer bg-gray-900 shadow-xs aspect-4/3 sm:aspect-16/10 flex flex-col justify-end"
                          >
                            <img
                              src={b.beforePhotos?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'}
                              alt="Before Service Condition"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                            
                            <div className="relative p-3 z-10 flex items-end justify-between">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-md bg-black/70 text-gray-200 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-xs border border-white/20">
                                  Before Service
                                </span>
                                <p className="text-white text-xs font-semibold mt-1 drop-shadow-xs">
                                  Initial Inspection & Deep Grime
                                </p>
                              </div>

                              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-[#FF5A5F] transition">
                                <ZoomIn className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>

                          {/* After Card */}
                          <div 
                            onClick={() => handleOpenLightbox(b, 'after')}
                            className="group relative rounded-2xl overflow-hidden border border-emerald-200/80 cursor-pointer bg-gray-900 shadow-xs aspect-4/3 sm:aspect-16/10 flex flex-col justify-end"
                          >
                            <img
                              src={
                                b.afterPhotos?.[0] ||
                                (b.status === 'completed'
                                  ? 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
                                  : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80')
                              }
                              alt="After ChakaChak Transformation"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-black/20 to-transparent pointer-events-none" />
                            
                            <div className="relative p-3 z-10 flex items-end justify-between">
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-xs border border-white/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>After ChakaChak</span>
                                </span>
                                <p className="text-white text-xs font-semibold mt-1 drop-shadow-xs">
                                  140°C Sanitized & Restored
                                </p>
                              </div>

                              <div className="w-7 h-7 rounded-full bg-emerald-500/80 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-emerald-600 transition">
                                <ZoomIn className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500">
                          Pre-service inspection photos are in progress. High-res documentation will appear upon job completion.
                        </div>
                      )}
                    </div>

                    {/* SECTION 3: ITEMIZED FINAL COSTS BREAKDOWN */}
                    <div className="bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-[#FF5A5F]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Itemized Cost Breakdown
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500">
                          Currency: INR (₹)
                        </span>
                      </div>

                      {/* Line Items Table */}
                      <div className="space-y-2 text-xs">
                        {/* Base Service */}
                        <div className="flex items-center justify-between py-1">
                          <div>
                            <span className="font-bold text-gray-800">{b.serviceTitle}</span>
                            <p className="text-[11px] text-gray-500">{b.configurationSummary}</p>
                          </div>
                          <span className="font-mono font-bold text-gray-800">
                            ₹{b.baseAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Itemized Addons */}
                        {b.selectedAddons && b.selectedAddons.length > 0 ? (
                          b.selectedAddons.map((addon) => (
                            <div key={addon.id} className="flex items-center justify-between py-1 pl-2 border-l-2 border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-700 font-medium">+ {addon.name}</span>
                              </div>
                              <span className="font-mono font-medium text-gray-700">
                                ₹{addon.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))
                        ) : null}

                        {/* Rapid Fee if any */}
                        {b.urgentFee > 0 && (
                          <div className="flex items-center justify-between py-1 pl-2 border-l-2 border-amber-300">
                            <span className="text-amber-800 font-medium">⚡ Rapid 90-Min Surcharge</span>
                            <span className="font-mono font-medium text-amber-800">
                              +₹{b.urgentFee.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Discount / Coupon if any */}
                        {b.discountAmount > 0 && (
                          <div className="flex items-center justify-between py-1 pl-2 border-l-2 border-emerald-300">
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>Promotional Discount / Coupon</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              -₹{b.discountAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Taxes */}
                        <div className="flex items-center justify-between py-1 text-gray-500">
                          <span>Applicable GST & Central Taxes (18%)</span>
                          <span className="font-mono">₹{b.taxes.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Total Grand Cost */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-black text-[#12222E]">Final Total Amount</span>
                            <span className="block text-[10px] text-gray-400 font-medium">
                              Paid via {b.paymentMethod}
                            </span>
                          </div>
                          <span className="text-base font-black text-[#12222E]">
                            ₹{b.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Payment Status Summary */}
                        <div className="p-2.5 rounded-xl bg-gray-50 flex items-center justify-between text-[11px] font-medium text-gray-600">
                          <span>Amount Paid: ₹{b.amountPaid.toLocaleString('en-IN')}</span>
                          <span>Balance Due: {b.balanceDue > 0 ? `₹${b.balanceDue.toLocaleString('en-IN')}` : 'Nil (Fully Settled)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: ASSIGNED PRO PROFILE & RATING */}
                    <div className="bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.workerPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                            alt={b.workerName || 'Partner'}
                            className="w-11 h-11 rounded-2xl object-cover border border-gray-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-[#12222E]">{b.workerName || 'Assigned Specialist'}</h4>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Verified</span>
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">Certified Deep Cleanliness & Transformation Pro</p>
                          </div>
                        </div>

                        {b.workerPhone && (
                          <a
                            href={`tel:${b.workerPhone}`}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                            title="Call Partner"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Contact</span>
                          </a>
                        )}
                      </div>

                      {/* Customer Rating Section */}
                      {b.customerRating ? (
                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= b.customerRating!.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="text-xs font-black text-amber-800 ml-1">
                                {b.customerRating.stars}.0 Customer Review
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveRatingBookingId(b.id)}
                              className="min-h-[44px] px-2 text-[11px] font-bold text-amber-800 hover:underline flex items-center"
                            >
                              Edit
                            </button>
                          </div>

                          <p className="text-xs text-gray-700 italic">
                            "{b.customerRating.comment}"
                          </p>

                          {b.customerRating.tags && b.customerRating.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {b.customerRating.tags.map((tag) => (
                                <span key={tag} className="text-[10px] bg-white border border-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                  ✓ {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-500">Rate your service quality & partner punctuality</span>
                          <button
                            type="button"
                            onClick={() => setActiveRatingBookingId(b.id)}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-amber-600 hover:border-amber-300 transition flex items-center gap-1 shadow-2xs active:scale-95"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Rate Service</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SECTION 5: COMPREHENSIVE ACTION FOOTER */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      {/* Left: Secondary actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveInvoiceBookingId(b.id)}
                          className="min-h-[44px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          <span>Download Tax Invoice</span>
                        </button>

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => setActiveTrackingBookingId(b.id)}
                            className="min-h-[44px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#FF5A5F]/20 active:scale-95"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Track Live</span>
                          </button>
                        )}
                      </div>

                      {/* Right: PRIMARY RE-BOOK BUTTON */}
                      <button
                        type="button"
                        onClick={() => rebookBooking(b)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF5A5F] hover:bg-[#E8355C] text-white text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-sm shadow-[#FF5A5F]/25"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-book This Service (Pre-populated)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* HIGH-RESOLUTION PHOTO COMPARISON LIGHTBOX WITH PINCH-TO-ZOOM */}
      {lightbox?.isOpen && (
        <PhotoZoomModal
          isOpen={lightbox.isOpen}
          onClose={handleCloseLightbox}
          bookingId={lightbox.bookingId}
          serviceTitle={lightbox.serviceTitle}
          beforePhotos={lightbox.beforePhoto ? [lightbox.beforePhoto] : []}
          afterPhotos={lightbox.afterPhoto ? [lightbox.afterPhoto] : []}
          initialMode={lightbox.activeView === 'side-by-side' ? 'split' : lightbox.activeView}
        />
      )}
    </div>
  );
};
