import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import {
  Smartphone,
  Bike,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Info,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const PortalSwitcher: React.FC = () => {
  const {
    activePortal,
    setActivePortal,
    viewMode,
    setViewMode,
    toastMessage,
    bookings,
    updateBookingStatus,
    showToast,
    setActiveConfigService,
    setPreselectedTier,
    setActiveTrackingBookingId,
    currentUser,
    firestoreConnected,
  } = useApp();

  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!tourOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTourOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourOpen]);

  // Stats for switcher badges
  const enRouteJobs = bookings.filter((b) => b.status === 'en_route').length;
  const activeJobs = bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length;

  return (
    <header className="sticky top-0 z-50 bg-[#12222E] text-white border-b border-gray-800 shadow-lg select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" lightMode={true} />
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-gray-700/60 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            <span className="font-medium text-emerald-400">
              {firestoreConnected ? 'Cloud Firestore Live' : 'Connecting Cloud...'}
            </span>
            {currentUser && (
              <span className="text-[11px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700 ml-1">
                {currentUser.displayName || currentUser.email}
              </span>
            )}
          </div>
        </div>

        {/* Center: Portal Switcher Pill */}
        <div className="flex items-center bg-gray-900/90 p-1 rounded-full border border-gray-700/80 shadow-inner">
          <button
            onClick={() => setActivePortal('customer')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activePortal === 'customer'
                ? 'bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-md shadow-[#FF5A5F]/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Customer App</span>
            <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
              Mobile
            </span>
          </button>

          <button
            onClick={() => setActivePortal('worker')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
              activePortal === 'worker'
                ? 'bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-md shadow-[#FF5A5F]/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Partner App</span>
            {enRouteJobs > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1"></span>
            )}
          </button>

          <button
            onClick={() => setActivePortal('admin')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activePortal === 'admin'
                ? 'bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-md shadow-[#FF5A5F]/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Admin Console</span>
            <span className="hidden md:inline text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
              Desktop
            </span>
          </button>
        </div>

        {/* Right: Quick Tour & View Controls */}
        <div className="flex items-center gap-2">
          {activePortal !== 'admin' && (
            <button
              onClick={() => setViewMode(viewMode === 'frame' ? 'responsive' : 'frame')}
              title={viewMode === 'frame' ? 'Expand to full screen' : 'Switch to mobile phone frame'}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs flex items-center gap-1 border border-gray-700 transition"
            >
              {viewMode === 'frame' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline">Phone Frame</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setTourOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold hover:border-amber-500/60 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Reviewer Guide</span>
          </button>
        </div>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="bg-[#E8355C] text-white text-center py-1.5 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-md animate-fadeIn">
          <Zap className="w-3.5 h-3.5 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reviewer Tour Guide Modal */}
      {tourOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTourOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#12222E] border border-gray-700 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FF5A5F]/20 text-[#FF5A5F]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">ChakaChak Prototype Walkthrough</h3>
                  <p className="text-xs text-gray-400">Instant shortcuts to evaluate the 3 portals & live reactive loop</p>
                </div>
              </div>
              <button
                onClick={() => setTourOpen(false)}
                className="text-gray-400 hover:text-white text-sm p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-1.5">
                    <span>1. Customer App (Mobile)</span>
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Explore real photo cards, tier comparison (Silver→Diamond), live-updating price totals, Bandra address selector, live Uber/Zepto-style map tracking with moving ETA.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePortal('customer');
                    setActiveConfigService('cleaning');
                    setPreselectedTier('diamond');
                    setTourOpen(false);
                  }}
                  className="px-3 py-1.5 bg-[#FF5A5F] hover:bg-[#E8355C] text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Open Config
                </button>
              </div>

              <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-1.5">
                    <span>2. Worker / Partner App (Mobile)</span>
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Logged in as Ramesh Sawant (4.92★). Advance job status: En Route 🛵 → Job Started 🛠️ → Complete ✅. Check scope tasks, upload before/after photos & receipt expenses.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePortal('worker');
                    setTourOpen(false);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Open Partner
                </button>
              </div>

              <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-white flex items-center gap-1.5">
                    <span>3. Admin Console (Desktop)</span>
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Mumbai Operations dashboard with 5 stat cards, weekly revenue gradient chart, interactive live Mumbai worker map, audit logs, and inline price editing that syncs immediately.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePortal('admin');
                    setTourOpen(false);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Open Admin
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#FF5A5F]/10 border border-[#FF5A5F]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#FF5A5F]">Quick Action:</span>
                  <span className="text-xs text-gray-300 ml-2">Progress CC-9082 to "Job Started" & watch sync</span>
                </div>
                <button
                  onClick={() => {
                    updateBookingStatus('CC-9082', 'job_started');
                    showToast('CC-9082 updated to Job Started! Check Customer Tracking and Admin Console.');
                  }}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FF5A5F] hover:bg-[#E8355C] text-white"
                >
                  Simulate
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setTourOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
