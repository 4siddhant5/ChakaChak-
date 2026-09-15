import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHome } from './CustomerHome';
import { CustomerHistoryView } from './CustomerHistoryView';
import { CustomerOffersView } from './CustomerOffersView';
import { CustomerProfileView } from './CustomerProfileView';
import { LiveTrackingView } from './LiveTrackingView';
import { ServiceConfigModal } from './ServiceConfigModal';
import { BookingCheckoutModal } from './BookingCheckoutModal';
import { AddressPickerModal } from './AddressPickerModal';
import { CustomerNotificationsModal } from './CustomerNotificationsModal';
import { RatingModal } from './RatingModal';
import { DigitalInvoiceModal } from './DigitalInvoiceModal';
import { CustomerBottomNav } from './CustomerBottomNav';
import { AuthOverlay } from '../auth/AuthOverlay';
import { HelpSupportChatModal } from '../common/HelpSupportChatModal';
import { Headphones } from 'lucide-react';

export const CustomerApp: React.FC = () => {
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const {
    activeCustomerTab,
    setActiveCustomerTab,
    activeTrackingBookingId,
    setActiveTrackingBookingId,
    activeConfigService,
    activeInvoiceBookingId,
    activeRatingBookingId,
    setPreselectedTier,
    activeConfigInitialData,
    checkoutConfig,
    setCheckoutConfig,
    savedConfigData,
    setSavedConfigData,
    openCheckout,
    goBack,
  } = useApp();

  const handleCloseServiceConfig = () => {
    goBack();
  };

  const handleCloseCheckout = () => {
    goBack();
  };

  const handleBackToConfigFromCheckout = () => {
    goBack();
  };

  // If currently tracking a specific live booking, show full-screen live tracking
  if (activeTrackingBookingId) {
    return (
      <div className="h-full w-full bg-[#F8F9FB] flex flex-col">
        <LiveTrackingView
          bookingId={activeTrackingBookingId}
          onBack={goBack}
        />
        {/* Modals available from tracking */}
        {activeInvoiceBookingId && (
          <DigitalInvoiceModal
            bookingId={activeInvoiceBookingId}
            onClose={goBack}
          />
        )}
        {activeRatingBookingId && (
          <RatingModal
            bookingId={activeRatingBookingId}
            onClose={goBack}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[#F8F9FB] flex flex-col relative font-sans">
      {/* Tab Switcher Body */}
      <main className="flex-1">
        {activeCustomerTab === 'home' && <CustomerHome />}
        {activeCustomerTab === 'history' && <CustomerHistoryView />}
        {activeCustomerTab === 'offers' && <CustomerOffersView />}
        {activeCustomerTab === 'profile' && <CustomerProfileView />}
      </main>

      {/* Persistent Customer Navigation Bar */}
      <CustomerBottomNav />

      {/* Service Configuration Flow Modal */}
      {activeConfigService && (
        <ServiceConfigModal
          serviceType={activeConfigService}
          initialConfig={activeConfigInitialData || savedConfigData}
          onClose={handleCloseServiceConfig}
          onProceedToCheckout={(configPayload) => {
            openCheckout(configPayload, 'slot_and_coupon');
          }}
        />
      )}

      {/* Booking Checkout Flow Modal */}
      {checkoutConfig && (
        <BookingCheckoutModal
          config={checkoutConfig}
          onClose={handleCloseCheckout}
          onBackToConfig={handleBackToConfigFromCheckout}
          onSuccess={(newBookingId) => {
            setCheckoutConfig(null);
            setSavedConfigData(null);
            setPreselectedTier(undefined);
            setActiveCustomerTab('history');
            setActiveTrackingBookingId(newBookingId);
          }}
        />
      )}

      {/* Common Customer Overlays */}
      <AddressPickerModal />
      <CustomerNotificationsModal />

      {/* Digital Invoice Modal */}
      {activeInvoiceBookingId && (
        <DigitalInvoiceModal
          bookingId={activeInvoiceBookingId}
          onClose={goBack}
        />
      )}

      {/* Rating & Review Modal */}
      {activeRatingBookingId && (
        <RatingModal
          bookingId={activeRatingBookingId}
          onClose={goBack}
        />
      )}

      {/* Global Authentication Overlay */}
      <AuthOverlay />

      {/* 24x7 Help & Support Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsSupportChatOpen(true)}
        className="fixed bottom-20 right-4 z-40 p-3 bg-gradient-to-tr from-[#12222E] to-[#1C3345] text-white rounded-2xl shadow-xl hover:shadow-2xl border border-gray-700/60 flex items-center gap-2 group transition active:scale-95"
        title="24x7 Mumbai Help & Support"
        aria-label="24x7 Help & Support Chat"
      >
        <div className="relative">
          <Headphones className="w-5 h-5 text-[#FF5A5F] group-hover:scale-110 transition-transform" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
        </div>
        <span className="text-xs font-extrabold pr-1 hidden sm:inline text-white">
          24x7 Support
        </span>
      </button>

      {/* Help & Support Chat Overlay */}
      <HelpSupportChatModal
        isOpen={isSupportChatOpen}
        onClose={() => setIsSupportChatOpen(false)}
        role="customer"
        currentUserId="cust-mumbai-01"
        currentUserName="Riya Mehta"
        activeBookingId={activeTrackingBookingId || undefined}
      />
    </div>
  );
};
