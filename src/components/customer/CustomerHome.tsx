import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db, collection, doc, onSnapshot } from '../../lib/firebase';
import { Booking, PricingConfig, SpecificItemPackage, CleaningAddon } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { TransformationBeforeAfter } from '../common/TransformationBeforeAfter';
import { MumbaiTestimonials } from '../common/MumbaiTestimonials';
import {
  MapPin,
  Bell,
  ChevronDown,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  ChevronRight,
  ArrowRight,
  Tag,
  Percent,
  CheckCircle2,
  Navigation,
  RotateCcw,
  SlidersHorizontal,
  Mic,
  MicOff,
  Volume2,
  X,
  Zap,
  Check,
  History,
  TrendingUp,
  Trash2,
} from 'lucide-react';

/**
 * Shimmer / Skeleton Loading State for Customer Service Cards during Firestore data synchronization
 */
const ServiceCardsSkeleton: React.FC = () => {
  return (
    <div id="service-cards-skeleton" className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
      {[1, 2].map((idx) => (
        <div
          key={idx}
          className="relative rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col"
        >
          {/* Shimmer Light Reflection Wave */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10"></div>

          {/* Photo banner skeleton */}
          <div className="relative h-48 sm:h-52 w-full bg-gray-200 animate-pulse">
            {/* Top-left Badge Skeleton */}
            <div className="absolute top-3 left-3 w-28 h-6 rounded-full bg-gray-300/80"></div>
            {/* Bottom-right Price Skeleton */}
            <div className="absolute bottom-3 right-3 text-right space-y-1">
              <div className="w-14 h-2.5 bg-gray-300/80 rounded-md ml-auto"></div>
              <div className="w-20 h-6 bg-gray-300/80 rounded-lg ml-auto"></div>
            </div>
            {/* Bottom-left Title Skeleton */}
            <div className="absolute bottom-3 left-3 right-24 space-y-1.5">
              <div className="w-4/5 h-5 bg-gray-300/80 rounded-lg"></div>
              <div className="w-1/2 h-3.5 bg-gray-300/80 rounded-md"></div>
            </div>
          </div>

          {/* Body Skeleton */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-full h-3.5 bg-gray-100 rounded-md"></div>
              <div className="w-5/6 h-3.5 bg-gray-100 rounded-md"></div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-12 h-3 bg-gray-200 rounded-md"></div>
                <div className="w-12 h-3 bg-gray-200 rounded-md"></div>
                <div className="w-16 h-3 bg-gray-200 rounded-md"></div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CustomerHome: React.FC = () => {
  const {
    customer,
    selectedAddressId,
    setAddressPickerOpen,
    setNotificationsDrawerOpen,
    notifications,
    setActiveConfigService,
    setPreselectedTier,
    setActiveCustomerTab,
    setActiveTrackingBookingId,
    bookings,
    pricing,
    coupons,
    showToast,
    currentUser,
    loginWithGoogle,
    isAuthLoading,
    setAuthModalOpen,
  } = useApp();

  const selectedAddr =
    customer.savedAddresses.find((a) => a.id === selectedAddressId) ||
    customer.savedAddresses[0];

  const unreadNotifsCount = notifications.filter(
    (n) => !n.read && (n.target === 'customer' || n.target === 'all')
  ).length;

  // Search cycling placeholder
  const searchPlaceholders = [
    "Search 'wardrobe organizing'...",
    "Search 'deep clean'...",
    "Search 'modular kitchen'...",
    "Search 'bedbox declutter'...",
    "Search 'bathroom hard water descaling'...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Local Storage recent searches implementation
  const RECENT_SEARCHES_KEY = 'chakachak_recent_searches';
  const DEFAULT_RECENT_SEARCHES = [
    'Wardrobe organizing',
    'Kitchen deep clean',
    'Diamond steam sanitization',
    'Sofa shampooing',
  ];

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Could not load recent searches from local storage:', err);
    }
    return DEFAULT_RECENT_SEARCHES;
  });

  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save recent search to local storage:', e);
      }
      return updated;
    });
  };

  const handleRemoveRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== queryToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not update recent searches in local storage:', e);
      }
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Could not clear recent searches in local storage:', e);
    }
  };

  const handleSelectSearchQuery = (query: string) => {
    setSearchQuery(query);
    saveRecentSearch(query);
    setIsSearchFocused(false);
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time Firestore state for service catalog and jobs
  const [realtimeBookings, setRealtimeBookings] = useState<Booking[]>([]);
  const [realtimePricing, setRealtimePricing] = useState<PricingConfig | null>(null);
  const [realtimePackages, setRealtimePackages] = useState<SpecificItemPackage[]>([]);
  const [realtimeAddons, setRealtimeAddons] = useState<CleaningAddon[]>([]);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isCatalogSyncing, setIsCatalogSyncing] = useState<boolean>(true);

  // Manual refresh simulator to showcase Firestore skeleton sync
  const handleRefreshCatalog = () => {
    setIsCatalogSyncing(true);
    showToast('Syncing Mumbai service catalog with Firestore...');
    setTimeout(() => {
      setIsCatalogSyncing(false);
      showToast('Catalog updated with real-time Firestore prices.');
    }, 650);
  };

  // Direct Firestore onSnapshot listeners for real-time service and job streams
  useEffect(() => {
    // 1. Real-time jobs / bookings stream
    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Booking);
          setRealtimeBookings(list);
        }
        setIsRealtimeActive(true);
      },
      (err) => console.warn('CustomerHome bookings onSnapshot warning:', err)
    );

    // 2. Real-time pricing catalog stream
    const unsubPricing = onSnapshot(
      doc(db, 'pricing', 'current'),
      (snap) => {
        if (snap.exists()) {
          setRealtimePricing(snap.data() as PricingConfig);
        }
        setIsRealtimeActive(true);
        setTimeout(() => setIsCatalogSyncing(false), 250);
      },
      (err) => {
        console.warn('CustomerHome pricing onSnapshot warning:', err);
        setIsCatalogSyncing(false);
      }
    );

    // 3. Real-time packages stream
    const unsubPackages = onSnapshot(
      collection(db, 'packages'),
      (snap) => {
        if (!snap.empty) {
          setRealtimePackages(snap.docs.map((d) => d.data() as SpecificItemPackage));
        }
      },
      (err) => console.warn('CustomerHome packages onSnapshot warning:', err)
    );

    // 4. Real-time addons stream
    const unsubAddons = onSnapshot(
      collection(db, 'addons'),
      (snap) => {
        if (!snap.empty) {
          setRealtimeAddons(snap.docs.map((d) => d.data() as CleaningAddon));
        }
      },
      (err) => console.warn('CustomerHome addons onSnapshot warning:', err)
    );

    return () => {
      unsubBookings();
      unsubPricing();
      unsubPackages();
      unsubAddons();
    };
  }, []);

  const effectiveBookings = realtimeBookings.length > 0 ? realtimeBookings : bookings;
  const effectivePricing = realtimePricing || pricing;

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Voice Search Handler using Web Speech Recognition API with fallback
  const handleToggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful fallback for browsers without native Web Speech API support
      const voiceSimulations = [
        'Wardrobe organizing',
        'Deep cleaning 3BHK',
        'Kitchen decluttering',
        'Sofa shampoo',
        'Bathroom cleaning',
      ];
      const simulatedText = voiceSimulations[Math.floor(Math.random() * voiceSimulations.length)];
      setIsListening(true);
      showToast(`🎤 Listening... (Simulated voice: "${simulatedText}")`);
      setTimeout(() => {
        setSearchQuery(simulatedText);
        setIsListening(false);
        showToast(`Matched voice: "${simulatedText}"`);
      }, 1400);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian English accents

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Listening... Speak your service request (e.g., "Deep Clean" or "Organizing")');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setSearchQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Please allow microphone permissions in your browser.');
        } else {
          showToast('Could not capture voice. Try typing your service.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      showToast('Voice input unavailable on this browser.');
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const CATEGORY_CHIPS = [
    { id: 'all', label: 'All Services', icon: '✨' },
    { id: 'wardrobe', label: 'Wardrobe Declutter', icon: '👗', service: 'transformation' as const },
    { id: 'cleaning', label: 'Deep Clean & Steam', icon: '🧼', service: 'cleaning' as const, tier: 'diamond' as const },
    { id: 'kitchen', label: 'Modular Kitchen', icon: '🍳', service: 'transformation' as const },
    { id: 'urgent', label: '90m Urgent', icon: '⚡', service: 'cleaning' as const, tier: 'platinum' as const },
    { id: 'hourly', label: 'Hourly Organizing', icon: '⏱️', service: 'transformation' as const },
  ];

  // Active ongoing booking for persistent quick-pill from real-time stream
  const activeBooking = effectiveBookings.find(
    (b) => b.status === 'en_route' || b.status === 'job_started' || b.status === 'worker_assigned'
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Top Bar */}
      <header className="bg-white px-4 pt-3.5 pb-3 border-b border-gray-100 shadow-xs sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3">
          {/* Brand Mark & Real-time indicator */}
          <div className="flex items-center gap-2">
            <BrandLogo size="md" />
            {isRealtimeActive && (
              <div
                id="realtime-firestore-badge"
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold"
                title="Firestore real-time listeners active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Sync</span>
              </div>
            )}
          </div>

          {/* Right: Address pill & Notification Bell */}
          <div className="flex items-center gap-2">
            {/* Saved Address Selector Pill */}
            <button
              onClick={() => setAddressPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200/80 text-[#12222E] transition text-xs max-w-[170px] sm:max-w-[220px]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0" />
              <span className="truncate font-semibold text-[11px] sm:text-xs">
                {selectedAddr.label} · {selectedAddr.locality}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotificationsDrawerOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 relative transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A5F] absolute top-1.5 right-1.5 ring-2 ring-white"></span>
              )}
            </button>

            {/* Google User Avatar / Quick Auth */}
            {currentUser ? (
              <button
                onClick={() => setActiveCustomerTab('profile')}
                className="w-8 h-8 rounded-full ring-2 ring-[#FF5A5F]/30 hover:ring-[#FF5A5F] transition overflow-hidden shadow-2xs relative shrink-0"
                title={`${currentUser.displayName || 'Google Account'} (Click to view Profile)`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#12222E] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName?.charAt(0) || 'G'}
                  </div>
                )}
              </button>
            ) : (
              <button
                id="home-header-signin-btn"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-bold shadow-2xs transition cursor-pointer"
                title="Sign in or Create Account"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 sm:px-5 space-y-6">
        {/* Active Dispatch Tracker Floating Card (if any job is en-route or in-progress) */}
        {activeBooking && (
          <div
            onClick={() => setActiveTrackingBookingId(activeBooking.id)}
            className="p-4 rounded-[20px] bg-gradient-to-r from-[#12222E] to-[#1E3A4C] text-white shadow-sm cursor-pointer flex items-center justify-between gap-3 transition-transform hover:scale-[1.01] min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-400/30">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Live Booking #{activeBooking.id}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-xs">
                  {activeBooking.workerName || 'Partner'} is{' '}
                  {activeBooking.status === 'en_route' ? 'En Route 🛵' : 'at your location 🛠️'}
                </h4>
                <p className="text-[11px] text-gray-300">
                  {activeBooking.status === 'en_route'
                    ? `ETA: ${activeBooking.etaMinutes || 14} mins to Carter Road`
                    : 'Restoration checklist in progress'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0">
              <span className="hidden sm:inline">Track</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Personalized Greeting */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Mumbai Metro · Verified Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12222E] mt-1 tracking-tight">
            Hi {customer.name.split(' ')[0]} 👋
          </h1>
          <p className="text-base sm:text-lg font-medium text-gray-600 mt-0.5">
            What are we sorting today?
          </p>
        </div>

        {/* Prominent Search Bar with Local Storage Recent Searches Dropdown & Voice-To-Text */}
        <div ref={searchDropdownRef} className="relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveRecentSearch(searchQuery);
                  setIsSearchFocused(false);
                }
              }}
              placeholder={
                isListening ? 'Listening... Speak your service request' : searchPlaceholders[placeholderIndex]
              }
              className={`w-full pl-11 pr-20 py-3.5 rounded-2xl bg-white border shadow-xs text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden transition ${
                isListening
                  ? 'border-[#FF5A5F] ring-2 ring-[#FF5A5F]/30 bg-[#FFF5F6]/30'
                  : 'border-gray-200/90 focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent'
              }`}
            />

            <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Microphone Voice-to-Text Button */}
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                className={`p-2 rounded-xl transition flex items-center justify-center relative ${
                  isListening
                    ? 'bg-[#FF5A5F] text-white shadow-md shadow-[#FF5A5F]/40 animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200/80 text-gray-600 hover:text-[#FF5A5F]'
                }`}
                title={isListening ? 'Stop listening' : 'Search by voice'}
                aria-label="Voice search microphone"
              >
                {isListening ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-white absolute -top-1 -right-1 animate-ping"></span>
                    <Mic className="w-4 h-4" />
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Local Storage Search Dropdown (Recent Searches & Quick Navigation) */}
          {(isSearchFocused || searchQuery.trim().length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-30 animate-fadeIn divide-y divide-gray-100">
              {/* 1. Recent Searches from Local Storage */}
              {recentSearches.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <History className="w-3.5 h-3.5 text-[#FF5A5F]" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllRecentSearches}
                      className="text-gray-400 hover:text-red-500 text-[10px] font-semibold transition"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectSearchQuery(item)}
                        className="group flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[#FFF5F6] cursor-pointer text-xs transition"
                      >
                        <span className="flex items-center gap-2.5 text-gray-700 group-hover:text-[#FF5A5F] font-medium">
                          <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A5F]" />
                          <span>{item}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecentSearch(item, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Trending Mumbai Search Queries */}
              <div className="p-3 bg-gray-50/60">
                <div className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Trending in Mumbai</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Wardrobe Organizing',
                    'Diamond Steam Clean',
                    'Modular Kitchen Grout',
                    'Sofa Sanitization',
                    'Bathroom Descaling',
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleSelectSearchQuery(topic)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#FF5A5F] text-gray-700 hover:text-[#FF5A5F] text-[11px] font-semibold shadow-2xs transition"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Direct Service Matching Quick Launch */}
              {searchQuery && (
                <div className="p-3 space-y-1 bg-white">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block pb-1">
                    Matching Services for "{searchQuery}"
                  </span>
                  <div
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setActiveConfigService('transformation');
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-2 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">
                      Wardrobe Organizing & Decluttering (Starts ₹999)
                    </span>
                    <span className="text-[#FF5A5F] font-bold">Configure →</span>
                  </div>
                  <div
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setActiveConfigService('cleaning');
                      setPreselectedTier('diamond');
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-2 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">
                      Diamond Deep Steam Sanitization
                    </span>
                    <span className="text-[#FF5A5F] font-bold">Configure →</span>
                  </div>
                  <div
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setActiveConfigService('cleaning');
                      setPreselectedTier('platinum');
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-2 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">
                      Platinum Deep Clean with Sofa Extraction
                    </span>
                    <span className="text-[#FF5A5F] font-bold">Configure →</span>
                  </div>
                  <div
                    onClick={() => {
                      saveRecentSearch(searchQuery);
                      setActiveConfigService('transformation');
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-2 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-gray-800">
                      Kitchen Cabinet Restoration & Declutter
                    </span>
                    <span className="text-[#FF5A5F] font-bold">Configure →</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Listening Live Voice Indicator */}
        {isListening && (
          <div className="p-3 bg-gradient-to-r from-[#FFF5F6] to-red-50/50 rounded-2xl border border-[#FF5A5F]/30 flex items-center justify-between text-xs text-[#12222E] animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5A5F]"></span>
              </span>
              <span className="font-bold text-[#FF5A5F]">Listening to voice...</span>
              <span className="text-gray-500 text-[11px]">Speak clearly (e.g., "Wardrobe organizing", "Deep clean")</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoiceSearch}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-200"
            >
              Done
            </button>
          </div>
        )}

        {/* Quick Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(chip.id);
                  if (chip.service) {
                    setActiveConfigService(chip.service);
                    if (chip.tier) {
                      setPreselectedTier(chip.tier);
                    }
                  }
                }}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95 shadow-2xs ${
                  isSelected
                    ? 'bg-[#12222E] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:border-gray-300 hover:text-[#12222E]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Horizontally Scrollable Promo Carousel */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Live Offers & Coupons
            </span>
            <button
              onClick={() => setActiveCustomerTab('offers')}
              className="text-xs font-bold text-[#FF5A5F] hover:underline"
            >
              See all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {/* Promo Card 1: 20% OFF DEEP CLEANING */}
            <div
              onClick={() => {
                setActiveConfigService('cleaning');
                setPreselectedTier('diamond');
              }}
              className="min-w-[84%] sm:min-w-[340px] snap-center rounded-[20px] p-4 sm:p-5 bg-gradient-to-tr from-[#FF5A5F] via-[#FF4365] to-[#E8355C] text-white shadow-sm cursor-pointer relative overflow-hidden flex flex-col justify-between shrink-0"
            >
              {/* Background decorative shine */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                    LIMITED TIME
                  </span>
                  <Tag className="w-4 h-4 text-white/80" />
                </div>
                <h3 className="text-base sm:text-lg font-black mt-2 leading-snug">
                  20% OFF this week
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  On every deep cleaning tier (Silver → Diamond)
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-white/70 uppercase font-semibold">CODE:</span>
                  <span className="font-mono font-black text-xs tracking-wider">CHAKA20</span>
                </div>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Apply & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Promo Card 2: ₹400 OFF WARDROBE ORGANIZING */}
            <div
              onClick={() => setActiveConfigService('transformation')}
              className="min-w-[84%] sm:min-w-[340px] snap-center rounded-[20px] p-4 sm:p-5 bg-gradient-to-tr from-[#12222E] via-[#1C364A] to-[#264C67] text-white shadow-sm cursor-pointer relative overflow-hidden flex flex-col justify-between shrink-0"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    MOST POPULAR
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <h3 className="text-base sm:text-lg font-black mt-2 leading-snug">
                  Flat ₹400 OFF
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  Wardrobe declutter & modular kitchen revamp
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-white/70 uppercase font-semibold">CODE:</span>
                  <span className="font-mono font-black text-xs tracking-wider">SORTMUMBAI</span>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>Apply & Book</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Promo Card 3: ₹500 OFF FIRST BOOKING */}
            <div
              onClick={() => setActiveConfigService('cleaning')}
              className="min-w-[84%] sm:min-w-[340px] snap-center rounded-[20px] p-4 sm:p-5 bg-gradient-to-tr from-emerald-700 to-teal-800 text-white shadow-sm cursor-pointer relative overflow-hidden flex flex-col justify-between shrink-0"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                    NEW ON CHAKACHAK
                  </span>
                  <Percent className="w-4 h-4 text-white/80" />
                </div>
                <h3 className="text-base sm:text-lg font-black mt-2 leading-snug">
                  Welcome ₹500 Welcome Off
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  Valid on any full-home service above ₹2,499
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-white/70 uppercase font-semibold">CODE:</span>
                  <span className="font-mono font-black text-xs tracking-wider">FIRST500</span>
                </div>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* "Our Services" Section - Large Photo Cards with Badges & Overlays */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#12222E]">Our Services</h2>
              <p className="text-xs text-gray-500">
                Premium specialized residential care in Mumbai
              </p>
            </div>

            {/* Real-time sync badge & refresh trigger */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Sync</span>
              </span>
              <button
                onClick={handleRefreshCatalog}
                disabled={isCatalogSyncing}
                className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                title="Sync catalog prices with Firestore"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isCatalogSyncing ? 'animate-spin text-[#FF5A5F]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Shimmer skeleton loading state while syncing catalog */}
          {isCatalogSyncing ? (
            <ServiceCardsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SERVICE CARD 1: HOME TRANSFORMATION / ORGANIZING (Primary) */}
              <div
                onClick={() => setActiveConfigService('transformation')}
                className="group rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col"
              >
                {/* Photo header with dark gradient overlay */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80"
                    alt="Organized wardrobe interiors"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle dark gradient overlay at bottom so text stays legible */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12222E]/90 via-[#12222E]/30 to-transparent"></div>

                  {/* Badge top-left in accent gradient */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-md">
                      MOST LOVED
                    </span>
                  </div>

                  {/* Starting price bottom-right */}
                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[10px] text-white/80 uppercase font-semibold block">
                      Starting from
                    </span>
                    <span className="text-lg font-black text-white">
                      ₹{(effectivePricing?.hourlyOrganizing?.ratePerHour || 999).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Card Title on photo */}
                  <div className="absolute bottom-3 left-3 right-20">
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      Home Transformation & Organizing
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Decluttering, wardrobe folding, kitchen pantry jar zoning, bedbox compaction & label printing by certified space organizers.
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                      <span>Hourly</span>
                      <span>·</span>
                      <span>1–5 BHK</span>
                      <span>·</span>
                      <span>Specific Zone</span>
                    </div>
                    <span className="text-xs font-bold text-[#FF5A5F] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span>Customize</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* SERVICE CARD 2: HOME DEEP CLEANING (Secondary) */}
              <div
                onClick={() => {
                  setActiveConfigService('cleaning');
                  setPreselectedTier('diamond');
                }}
                className="group rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col"
              >
                {/* Photo header with dark gradient overlay */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"
                    alt="Spotless kitchen deep clean in Mumbai"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Subtle dark gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12222E]/90 via-[#12222E]/30 to-transparent"></div>

                  {/* Badge top-left */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white shadow-md">
                      SILVER → DIAMOND
                    </span>
                  </div>

                  {/* Starting price bottom-right */}
                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[10px] text-white/80 uppercase font-semibold block">
                      Starting from
                    </span>
                    <span className="text-lg font-black text-white">
                      ₹{(effectivePricing?.cleaningTiers?.silver?.basePrice?.['1BHK'] || 1799).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Card Title on photo */}
                  <div className="absolute bottom-3 left-3 right-20">
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      Home Deep Cleaning & Steam
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Single-disc machine floor buffing, hard-water bathroom descaling, grease extraction & 140°C medical steam sterilization.
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                      <span>4 Tiers</span>
                      <span>·</span>
                      <span>Furnished / Vacant</span>
                      <span>·</span>
                      <span>1RK–5BHK</span>
                    </div>
                    <span className="text-xs font-bold text-[#FF5A5F] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      <span>Compare Tiers</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Interactive Before & After Transformation Slider */}
        <TransformationBeforeAfter />

        {/* Trust-Signal Row: 3 Compact Pill Cards */}
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-gray-900">
              Verified pros
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">Police & KYC cleared</span>
          </div>

          <div className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-gray-900">
              On-time or free
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">Prompt arrival guarantee</span>
          </div>

          <div className="bg-white p-3 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-extrabold text-[11px] sm:text-xs text-gray-900">
              4.8 avg rating
            </span>
            <span className="text-[9px] text-gray-400 mt-0.5">Across 12,000+ homes</span>
          </div>
        </section>

        {/* Why ChakaChak Gold Standards */}
        <section className="bg-white rounded-[20px] p-4 sm:p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FFF5F6] text-[#FF5A5F] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#12222E]">The ChakaChak Gold Standard</h3>
              <p className="text-[11px] text-gray-400">Specially calibrated for Mumbai coastal living & dust</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-[16px] bg-gray-50/70 border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">140°C Medical Steam</span>
                <span className="text-[11px] text-gray-500">Eliminates monsoon mold, bed bugs & 99.9% bacteria without corrosive chemicals.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-[16px] bg-gray-50/70 border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">KonMari Trained Organizers</span>
                <span className="text-[11px] text-gray-500">Certified spatial planners who zone, fold, label, and optimize wardrobe depth.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-[16px] bg-gray-50/70 border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">Zero-Surprise Transparent Pricing</span>
                <span className="text-[11px] text-gray-500">No on-the-spot price negotiations or sudden chemical upcharges.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-[16px] bg-gray-50/70 border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">Live Telemetry & Safety Check</span>
                <span className="text-[11px] text-gray-500">GPS tracked en-route dispatch with verified digital ID cards and uniform.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Real Mumbai Customer Testimonials */}
        <MumbaiTestimonials />

        {/* "Book Again" Section - Horizontally scrollable past service cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#12222E]">Book Again</h3>
              <p className="text-[11px] text-gray-400">Rebook your favorite Mumbai professionals in 1 tap</p>
            </div>
            <button
              onClick={() => setActiveCustomerTab('history')}
              className="text-xs font-bold text-[#FF5A5F] hover:underline"
            >
              See all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
            {bookings.slice(0, 3).map((pastBooking) => (
              <div
                key={pastBooking.id}
                className="min-w-[80%] sm:min-w-[280px] snap-center bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm flex flex-col justify-between shrink-0"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {pastBooking.date}
                    </span>
                    <span className="font-black text-xs text-[#12222E]">
                      ₹{pastBooking.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-[#12222E] mt-1 line-clamp-1">
                    {pastBooking.serviceTitle}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {pastBooking.configurationSummary}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={pastBooking.workerPhoto}
                      alt={pastBooking.workerName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[90px]">
                      {pastBooking.workerName}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (pastBooking.serviceType === 'cleaning') {
                        setActiveConfigService('cleaning');
                        setPreselectedTier(pastBooking.serviceTier || 'platinum');
                      } else {
                        setActiveConfigService('transformation');
                      }
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFF5F6] hover:bg-[#FF5A5F] text-[#FF5A5F] hover:text-white text-xs font-bold transition flex items-center gap-1 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rebook</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
