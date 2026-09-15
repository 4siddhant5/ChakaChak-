import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Booking,
  Worker,
  CustomerProfile,
  PricingConfig,
  Coupon,
  AdminAuditLog,
  SupportTicket,
  AppNotification,
  ServiceLineId,
  CleaningTier,
  BHKSize,
  PropertyFurnishing,
  SpecificItemPackage,
  CleaningAddon,
  BookingStatus,
} from '../types';
import {
  INITIAL_BOOKINGS,
  INITIAL_WORKERS,
  INITIAL_CUSTOMER,
  INITIAL_PRICING,
  INITIAL_COUPONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  NavStackEntry,
  NavViewType,
  createNavEntry,
  getHumanReadableTitle,
} from '../utils/navigationStack';
import {
  auth,
  db,
  signInWithGoogle,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  signOutUser,
  sanitizeForFirestore,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  User,
} from '../lib/firebase';
import {
  dbService,
  createBooking as dbCreateBooking,
  updateWorkerStatus as dbUpdateWorkerStatus,
  updateJobStatus as dbUpdateJobStatus,
  assignWorkerToBooking as dbAssignWorkerToBooking,
} from '../lib/db';

export type PortalType = 'customer' | 'worker' | 'admin';

export interface CheckoutDraft {
  selectedDate?: string;
  selectedSlot?: string;
  isUrgent?: boolean;
  appliedCouponCode?: string;
  paymentChoice?: 'full' | 'advance';
  paymentMethod?: 'UPI' | 'Credit Card' | 'Netbanking' | 'Cash on completion';
  specialNotes?: string;
}

interface AppContextType {
  // Portal Navigation
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  viewMode: 'frame' | 'responsive';
  setViewMode: (mode: 'frame' | 'responsive') => void;

  // Global Navigation Stack Helper
  navStack: NavStackEntry[];
  currentNavEntry?: NavStackEntry;
  previousNavEntry?: NavStackEntry;
  canGoBack: boolean;
  pushNav: (name: string, viewType: NavViewType, title?: string, params?: Record<string, any>) => void;
  popNav: () => boolean;
  goBack: () => boolean;
  replaceNav: (name: string, viewType: NavViewType, title?: string, params?: Record<string, any>) => void;
  resetNav: (rootName?: string) => void;
  clearHistoryTo: (targetName: string) => boolean;
  getPreviousTitle: () => string;

  // Checkout flow state across navigation
  checkoutConfig: any | null;
  setCheckoutConfig: (config: any | null) => void;
  savedConfigData: any | null;
  setSavedConfigData: (data: any | null) => void;
  checkoutStep: 'slot_and_coupon' | 'review_and_pay';
  setCheckoutStep: (step: 'slot_and_coupon' | 'review_and_pay') => void;
  checkoutDraft: CheckoutDraft | null;
  updateCheckoutDraft: (partial: Partial<CheckoutDraft>) => void;
  clearCheckoutDraft: () => void;

  // Draft preservation for service configuration
  serviceConfigDrafts: Record<string, any>;
  saveServiceConfigDraft: (serviceType: ServiceLineId, draft: any) => void;
  getServiceConfigDraft: (serviceType: ServiceLineId) => any | null;

  // High-level navigation convenience helpers
  openServiceConfig: (service: ServiceLineId, initialConfig?: any) => void;
  openCheckout: (config: any, step?: 'slot_and_coupon' | 'review_and_pay') => void;
  openTracking: (bookingId: string) => void;
  openInvoice: (bookingId: string) => void;
  openRating: (bookingId: string) => void;
  openAddressPicker: () => void;
  openNotifications: () => void;
  closeModal: () => boolean;

  // State Collections
  bookings: Booking[];
  workers: Worker[];
  customer: CustomerProfile;
  pricing: PricingConfig;
  coupons: Coupon[];
  auditLogs: AdminAuditLog[];
  supportTickets: SupportTicket[];
  notifications: AppNotification[];

  // Customer UI state
  activeCustomerTab: 'home' | 'history' | 'offers' | 'profile';
  setActiveCustomerTab: (tab: 'home' | 'history' | 'offers' | 'profile') => void;
  activeConfigService: ServiceLineId | null;
  setActiveConfigService: (service: ServiceLineId | null) => void;
  activeConfigInitialData: any | null;
  setActiveConfigInitialData: (data: any | null) => void;
  rebookBooking: (booking: Booking) => void;
  preselectedTier?: CleaningTier;
  setPreselectedTier: (tier?: CleaningTier) => void;
  activeTrackingBookingId: string | null;
  setActiveTrackingBookingId: (id: string | null) => void;
  activeInvoiceBookingId: string | null;
  setActiveInvoiceBookingId: (id: string | null) => void;
  activeRatingBookingId: string | null;
  setActiveRatingBookingId: (id: string | null) => void;
  addressPickerOpen: boolean;
  setAddressPickerOpen: (open: boolean) => void;
  notificationsDrawerOpen: boolean;
  setNotificationsDrawerOpen: (open: boolean) => void;
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;

  // Worker UI state
  activeWorkerId: string;
  setActiveWorkerId: (id: string) => void;
  selectedWorker?: Worker;
  setSelectedWorkerId: (id: string) => void;
  isWorkerOnline: boolean;
  setIsWorkerOnline: (online: boolean) => void;
  selectedWorkerJobId: string | null;
  setSelectedWorkerJobId: (id: string | null) => void;
  toggleWorkerOnline: (workerId: string) => void;

  // Real-time activity feed & operations
  liveActivityLogs: { id: string; message: string; time: string }[];
  logActivity: (message: string, bookingId?: string, workerId?: string) => void;
  updateJobStatus: (
    bookingId: string,
    status: BookingStatus,
    metadata?: {
      etaMinutes?: number;
      paymentStatus?: Booking['paymentStatus'];
      balanceDue?: number;
      statusTimestamps?: Record<string, string>;
    }
  ) => Promise<void>;
  reassignWorker: (bookingId: string, worker: Worker) => void;
  updatePricingConfig: (newPricing: PricingConfig) => void;
  addCoupon: (coupon: Coupon) => void;
  addExpenseToBooking: (bookingId: string, expense: { title: string; amount: number; receiptUrl?: string }) => void;

  // Actions
  createNewBooking: (newBookingData: Partial<Booking>) => Booking;
  updateBookingStatus: (bookingId: string, newStatus: Booking['status']) => void;
  toggleBookingTask: (bookingId: string, taskId: string) => void;
  addBookingBeforePhoto: (bookingId: string, photoUrl: string) => void;
  addBookingAfterPhoto: (bookingId: string, photoUrl: string) => void;
  addAttachedExpense: (bookingId: string, title: string, amount: number, receiptUrl: string) => void;
  submitCustomerRating: (bookingId: string, rating: { stars: number; tags: string[]; comment: string; photoUrl?: string }) => void;
  updateHourlyRate: (index: number, newPrice: number) => void;
  updateBhkTransformationPrice: (bhk: BHKSize, newPrice: number) => void;
  updateCleaningPrice: (tier: CleaningTier, furnishing: PropertyFurnishing, bhk: BHKSize, newPrice: number) => void;
  addNewCoupon: (coupon: Coupon) => void;
  toggleCouponActive: (code: string) => void;
  broadcastNotification: (title: string, message: string, target: AppNotification['target'], type: AppNotification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  resolveSupportTicket: (ticketId: string) => void;
  toggleWorkerAvailability: (workerId: string) => void;

  // Toast message
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Firebase Authentication & Real-time Database
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  currentUser: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  loginWithOTP: (phone: string, otp: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<User | null>;
  logoutUser: () => Promise<void>;
  clearAuthError: () => void;
  firestoreConnected: boolean;
  isFirestoreSyncing: boolean;
  dbService: typeof dbService;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePortal, setActivePortal] = useState<PortalType>('customer');
  const [viewMode, setViewMode] = useState<'frame' | 'responsive'>('frame');

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('chakachak_bookings');
    if (saved) {
      try {
        const parsed: Booking[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((b) => b.id));
        const missing = INITIAL_BOOKINGS.filter((b) => !existingIds.has(b.id));
        // Enrich any initial bookings with high-res photos if missing
        const updated = parsed.map((b) => {
          const init = INITIAL_BOOKINGS.find((ib) => ib.id === b.id);
          if (init && (!b.beforePhotos?.length || b.beforePhotos.length < init.beforePhotos.length)) {
            return {
              ...b,
              beforePhotos: init.beforePhotos,
              afterPhotos: init.afterPhotos,
            };
          }
          return b;
        });
        return [...updated, ...missing];
      } catch (e) {
        return INITIAL_BOOKINGS;
      }
    }
    return INITIAL_BOOKINGS;
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('chakachak_workers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((w: any) => ({
          ...w,
          photo: w.photo || w.avatar,
          locality: w.locality || w.currentLocation?.locality || w.zone,
          role: w.role || w.specialties?.[0] || 'Senior Partner',
          isOnline: w.isOnline !== undefined ? w.isOnline : w.status !== 'offline',
          totalJobsCompleted: w.totalJobsCompleted || w.jobsCompleted,
        }));
      } catch (e) {
        return INITIAL_WORKERS;
      }
    }
    return INITIAL_WORKERS;
  });

  const [customer, setCustomer] = useState<CustomerProfile>(INITIAL_CUSTOMER);

  const [pricing, setPricing] = useState<PricingConfig>(() => {
    const saved = localStorage.getItem('chakachak_pricing');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.cleaningTiers?.silver?.basePrice) {
          return parsed;
        }
      } catch (e) {
        return INITIAL_PRICING;
      }
    }
    return INITIAL_PRICING;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('chakachak_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Customer sub-states
  const [activeCustomerTabInternal, setActiveCustomerTabInternal] = useState<'home' | 'history' | 'offers' | 'profile'>('home');
  const [activeConfigService, setActiveConfigServiceInternal] = useState<ServiceLineId | null>(null);
  const [activeConfigInitialData, setActiveConfigInitialData] = useState<any | null>(null);
  const [preselectedTier, setPreselectedTier] = useState<CleaningTier | undefined>(undefined);
  const [activeTrackingBookingId, setActiveTrackingBookingIdInternal] = useState<string | null>('CC-9082');
  const [activeInvoiceBookingId, setActiveInvoiceBookingIdInternal] = useState<string | null>(null);
  const [activeRatingBookingId, setActiveRatingBookingIdInternal] = useState<string | null>(null);
  const [addressPickerOpen, setAddressPickerOpenInternal] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpenInternal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('addr-1');

  // Checkout flow state across views/modals
  const [checkoutConfig, setCheckoutConfig] = useState<any | null>(null);
  const [savedConfigData, setSavedConfigData] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'slot_and_coupon' | 'review_and_pay'>('slot_and_coupon');

  // Checkout inputs draft persistence across navigation (back-and-forth between steps and modals)
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>({
    selectedDate: 'Today',
    selectedSlot: '02:30 PM - 06:30 PM',
    isUrgent: false,
    paymentChoice: 'advance',
    paymentMethod: 'UPI',
    specialNotes: '',
  });

  const updateCheckoutDraft = (partial: Partial<CheckoutDraft>) => {
    setCheckoutDraft((prev) => ({
      ...(prev || {}),
      ...partial,
    }));
  };

  const clearCheckoutDraft = () => {
    setCheckoutDraft({
      selectedDate: 'Today',
      selectedSlot: '02:30 PM - 06:30 PM',
      isUrgent: false,
      paymentChoice: 'advance',
      paymentMethod: 'UPI',
      specialNotes: '',
    });
  };

  // Service configuration draft persistence so closing the modal never loses customized user choices
  const [serviceConfigDrafts, setServiceConfigDrafts] = useState<Record<string, any>>({});

  const saveServiceConfigDraft = (serviceType: ServiceLineId, draft: any) => {
    setServiceConfigDrafts((prev) => ({
      ...prev,
      [serviceType]: draft,
    }));
  };

  const getServiceConfigDraft = (serviceType: ServiceLineId) => {
    return serviceConfigDrafts[serviceType] || null;
  };

  // Global Navigation Stack State
  const [navStack, setNavStack] = useState<NavStackEntry[]>(() => [
    createNavEntry('home', 'tab', 'Home Explore'),
    createNavEntry('live_tracking', 'detail', 'Live Service Tracking', { bookingId: 'CC-9082' }),
  ]);

  const currentNavEntry = navStack[navStack.length - 1];
  const previousNavEntry = navStack.length > 1 ? navStack[navStack.length - 2] : undefined;
  const canGoBack = navStack.length > 1 || activeCustomerTabInternal !== 'home';

  const getPreviousTitle = (): string => {
    if (previousNavEntry) {
      return `Back to ${previousNavEntry.title || getHumanReadableTitle(previousNavEntry)}`;
    }
    if (activeCustomerTabInternal !== 'home') {
      return 'Back to Home';
    }
    return 'Back';
  };

  const pushNav = (
    name: string,
    viewType: NavViewType,
    title?: string,
    params?: Record<string, any>
  ) => {
    setNavStack((prev) => {
      const top = prev[prev.length - 1];
      if (top && top.name === name && JSON.stringify(top.params) === JSON.stringify(params)) {
        return prev;
      }
      const entry = createNavEntry(name, viewType, title, params);
      try {
        window.history.pushState({ navId: entry.id, name: entry.name }, '');
      } catch (e) {
        // Fallback for sandboxed preview environments
      }
      return [...prev, entry];
    });
  };

  const replaceNav = (
    name: string,
    viewType: NavViewType,
    title?: string,
    params?: Record<string, any>
  ) => {
    setNavStack((prev) => {
      const remaining = prev.length > 0 ? prev.slice(0, prev.length - 1) : [];
      const entry = createNavEntry(name, viewType, title, params);
      return [...remaining, entry];
    });
  };

  const resetNav = (rootName: string = 'home') => {
    setNavStack([createNavEntry(rootName, 'tab', getHumanReadableTitle({ name: rootName, viewType: 'tab', id: '', timestamp: 0 }))]);
  };

  const clearHistoryTo = (targetName: string): boolean => {
    const targetIdx = navStack.findIndex((e) => e.name === targetName);
    if (targetIdx >= 0) {
      const target = navStack[targetIdx];
      setNavStack(navStack.slice(0, targetIdx + 1));
      if (target.viewType === 'tab') {
        setActiveCustomerTabInternal(target.name as any);
        setActiveConfigServiceInternal(null);
        setCheckoutConfig(null);
        setActiveTrackingBookingIdInternal(null);
        setActiveInvoiceBookingIdInternal(null);
        setActiveRatingBookingIdInternal(null);
        setAddressPickerOpenInternal(false);
        setNotificationsDrawerOpenInternal(false);
        setSelectedWorkerJobIdInternal(null);
      }
      return true;
    }
    return false;
  };

  // The primary goBack navigation function that safely returns the user to the correct previous state
  const goBack = (): boolean => {
    if (navStack.length <= 1) {
      if (activePortal === 'customer' && activeCustomerTabInternal !== 'home') {
        setActiveCustomerTabInternal('home');
        setNavStack([createNavEntry('home', 'tab', 'Home Explore')]);
        return true;
      }
      return false;
    }

    const popped = navStack[navStack.length - 1];
    const target = navStack[navStack.length - 2];

    // Remove popped entry from stack
    setNavStack((prev) => prev.slice(0, prev.length - 1));

    // Execute state transitions without causing UI inconsistencies or data loss
    if (popped.name === 'checkout_step2') {
      setCheckoutStep('slot_and_coupon');
    } else if (popped.name === 'checkout' || popped.name === 'checkout_step1') {
      setCheckoutConfig(null);
      if (target.name === 'service_config') {
        const serviceType = target.params?.serviceType || savedConfigData?.serviceType || 'transformation';
        setActiveConfigServiceInternal(serviceType);
        if (savedConfigData) {
          setActiveConfigInitialData(savedConfigData);
        }
      }
    } else if (popped.name === 'address_picker_add') {
      if (target.name === 'address_picker') {
        window.dispatchEvent(new CustomEvent('close-address-add-substep'));
      } else {
        setAddressPickerOpenInternal(false);
      }
    } else if (popped.name === 'address_picker') {
      setAddressPickerOpenInternal(false);
    } else if (popped.name === 'notifications') {
      setNotificationsDrawerOpenInternal(false);
    } else if (popped.name === 'invoice') {
      setActiveInvoiceBookingIdInternal(null);
    } else if (popped.name === 'rating') {
      setActiveRatingBookingIdInternal(null);
    } else if (popped.name === 'tracking_chat') {
      window.dispatchEvent(new CustomEvent('close-tracking-chat'));
    } else if (popped.name === 'service_config') {
      setActiveConfigServiceInternal(null);
      setPreselectedTier(undefined);
      if (target.viewType === 'tab') {
        setActiveCustomerTabInternal(target.name as any);
      }
    } else if (popped.name === 'live_tracking') {
      setActiveTrackingBookingIdInternal(null);
      if (target.viewType === 'tab') {
        setActiveCustomerTabInternal(target.name as any);
      }
    } else if (popped.name === 'worker_job_detail') {
      setSelectedWorkerJobIdInternal(null);
    } else if (popped.name === 'photo_lightbox') {
      window.dispatchEvent(new CustomEvent('close-photo-lightbox'));
    } else if (popped.viewType === 'tab' && target.viewType === 'tab') {
      setActiveCustomerTabInternal(target.name as any);
    }

    return true;
  };

  const popNav = () => goBack();
  const closeModal = () => goBack();

  // Synchronized state setters that maintain stack consistency
  const setActiveCustomerTab = (tab: 'home' | 'history' | 'offers' | 'profile') => {
    setActiveCustomerTabInternal(tab);
    pushNav(tab, 'tab', getHumanReadableTitle({ name: tab, viewType: 'tab', id: '', timestamp: 0 }));
  };

  const setActiveConfigService = (service: ServiceLineId | null) => {
    setActiveConfigServiceInternal(service);
    if (service) {
      pushNav('service_config', 'modal', 'Service Configuration', { serviceType: service });
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'service_config') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  const setActiveTrackingBookingId = (id: string | null) => {
    setActiveTrackingBookingIdInternal(id);
    if (id) {
      pushNav('live_tracking', 'detail', 'Live Service Tracking', { bookingId: id });
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'live_tracking') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  const setActiveInvoiceBookingId = (id: string | null) => {
    setActiveInvoiceBookingIdInternal(id);
    if (id) {
      pushNav('invoice', 'modal', 'Digital Tax Invoice', { bookingId: id });
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'invoice') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  const setActiveRatingBookingId = (id: string | null) => {
    setActiveRatingBookingIdInternal(id);
    if (id) {
      pushNav('rating', 'modal', 'Rating & Feedback', { bookingId: id });
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'rating') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  const setAddressPickerOpen = (open: boolean) => {
    setAddressPickerOpenInternal(open);
    if (open) {
      pushNav('address_picker', 'modal', 'Address Selection');
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && (top.name === 'address_picker' || top.name === 'address_picker_add')) {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  const setNotificationsDrawerOpen = (open: boolean) => {
    setNotificationsDrawerOpenInternal(open);
    if (open) {
      pushNav('notifications', 'modal', 'Notifications');
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'notifications') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  // High-level navigation convenience helpers
  const openServiceConfig = (service: ServiceLineId, initialConfig?: any) => {
    if (initialConfig) {
      setActiveConfigInitialData(initialConfig);
    }
    setActiveConfigService(service);
  };

  const openCheckout = (config: any, step: 'slot_and_coupon' | 'review_and_pay' = 'slot_and_coupon') => {
    setSavedConfigData(config);
    setCheckoutConfig(config);
    setCheckoutStep(step);
    setActiveConfigServiceInternal(null);
    setActiveConfigInitialData(config);
    pushNav(step === 'review_and_pay' ? 'checkout_step2' : 'checkout_step1', 'modal', step === 'review_and_pay' ? 'Review & Payment' : 'Slot & Timing', { config });
  };

  const openTracking = (bookingId: string) => {
    setActiveTrackingBookingId(bookingId);
  };

  const openInvoice = (bookingId: string) => {
    setActiveInvoiceBookingId(bookingId);
  };

  const openRating = (bookingId: string) => {
    setActiveRatingBookingId(bookingId);
  };

  const openAddressPicker = () => {
    setAddressPickerOpen(true);
  };

  const openNotifications = () => {
    setNotificationsDrawerOpen(true);
  };

  // Global browser back and Escape key listener to trigger goBack()
  useEffect(() => {
    const handlePopState = () => {
      goBack();
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        const top = navStack[navStack.length - 1];
        if (top && (top.viewType === 'modal' || top.viewType === 'step' || top.viewType === 'detail')) {
          e.preventDefault();
          goBack();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [navStack, activeCustomerTabInternal, activePortal, checkoutStep, checkoutConfig, savedConfigData]);

  const rebookBooking = (booking: Booking) => {
    const initialData: any = {
      serviceType: booking.serviceType,
      transformationMode: booking.transformationMode || 'bhk',
      bhkSize: booking.bhkSize || '2BHK',
      furnishing: booking.furnishing || 'furnished',
      serviceTier: booking.serviceTier || 'platinum',
      selectedAddons: booking.selectedAddons ? [...booking.selectedAddons] : [],
    };
    setActiveConfigInitialData(initialData);
    if (booking.serviceTier) {
      setPreselectedTier(booking.serviceTier);
    }
    setActiveConfigService(booking.serviceType);
    showToast(`Re-booking initialized for ${booking.serviceTitle}! Previous choices pre-loaded.`);
  };

  // Worker sub-states
  const [activeWorkerId, setActiveWorkerId] = useState<string>('w-101');
  const [isWorkerOnline, setIsWorkerOnline] = useState<boolean>(true);
  const [selectedWorkerJobId, setSelectedWorkerJobIdInternal] = useState<string | null>(null);

  const setSelectedWorkerJobId = (id: string | null) => {
    setSelectedWorkerJobIdInternal(id);
    if (id) {
      pushNav('worker_job_detail', 'modal', 'Job Details', { jobId: id });
    } else {
      setNavStack((prev) => {
        const top = prev[prev.length - 1];
        if (top && top.name === 'worker_job_detail') {
          return prev.slice(0, prev.length - 1);
        }
        return prev;
      });
    }
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Firebase Authentication State: tracks authenticated user across the app
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState<boolean>(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  // Authentication Listener & User Document Sync (State Persistence)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setCurrentUser(fbUser);
      setIsAuthLoading(false);
      setAuthError(null);

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setCustomer((prev) => ({
              ...prev,
              name: data.name || fbUser.displayName || prev.name,
              email: data.email || fbUser.email || prev.email,
              avatar: data.avatar || fbUser.photoURL || prev.avatar,
              phone: data.phone || prev.phone,
              savedAddresses: data.savedAddresses || prev.savedAddresses,
            }));
          } else {
            const newProfileData = {
              id: fbUser.uid,
              name: fbUser.displayName || customer.name,
              email: fbUser.email || customer.email,
              avatar: fbUser.photoURL || customer.avatar,
              phone: customer.phone,
              savedAddresses: customer.savedAddresses,
              totalSpend: customer.totalSpend,
              bookingsCount: customer.bookingsCount,
              memberSince: customer.memberSince,
            };
            await setDoc(userDocRef, sanitizeForFirestore(newProfileData));
            setCustomer((prev) => ({
              ...prev,
              name: fbUser.displayName || prev.name,
              email: fbUser.email || prev.email,
              avatar: fbUser.photoURL || prev.avatar,
            }));
          }
        } catch (err) {
          console.warn('Firebase user profile sync warning:', err);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      const user = await signInWithGoogle();
      if (user) {
        showToast(`Welcome back, ${user.displayName || 'Customer'}! Signed in with Google.`);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const msg = error?.message || 'Authentication error';
      setAuthError(msg);
      if (error?.code === 'auth/popup-blocked') {
        showToast('Google Sign-In popup was blocked. Please allow popups for this preview.');
      } else if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        showToast('Sign-in cancelled.');
      } else {
        showToast(`Sign-in notice: ${msg}`);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      const user = await loginWithEmailAndPassword(email, pass);
      showToast(`Welcome back, ${user.displayName || user.email}!`);
      return user;
    } catch (error: any) {
      console.error('Email login error:', error);
      let msg = error?.message || 'Login failed';
      if (
        error?.code === 'auth/user-not-found' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential'
      ) {
        msg = 'Invalid email or password.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setAuthError(msg);
      showToast(msg);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithOTP = async (phone: string, otpCode: string): Promise<boolean> => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);

      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        throw new Error('Please provide a valid 10-digit mobile number.');
      }

      const cleanOtp = otpCode.trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        throw new Error('Please enter the full 6-digit verification code.');
      }

      // Demo OTP accepted: 942108 or 123456
      if (cleanOtp !== '942108' && cleanOtp !== '123456') {
        throw new Error('Incorrect OTP. Please enter the demo code 942108 or click Resend.');
      }

      const formattedPhone = `+91 ${digitsOnly.slice(-10)}`;
      setCustomer((prev) => ({
        ...prev,
        phone: formattedPhone,
      }));

      // Sync customer profile in Firestore
      try {
        const demoUid = `otp-${digitsOnly.slice(-10)}`;
        const userDocRef = doc(db, 'users', demoUid);
        await setDoc(
          userDocRef,
          sanitizeForFirestore({
            id: demoUid,
            name: customer.name || 'Verified Customer',
            phone: formattedPhone,
            email: customer.email || `${digitsOnly.slice(-10)}@chakachak.com`,
            lastLogin: new Date().toISOString(),
            authMethod: 'mobile_otp',
          }),
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Firestore user profile sync on OTP login notice:', dbErr);
      }

      showToast(`Phone verified! Welcome back, ${customer.name || 'Customer'}.`);
      return true;
    } catch (error: any) {
      console.error('OTP login error:', error);
      const msg = error?.message || 'OTP verification failed';
      setAuthError(msg);
      showToast(msg);
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name?: string
  ): Promise<User | null> => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      const user = await registerWithEmailAndPassword(email, pass, name);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const newProfileData = {
          id: user.uid,
          name: name || user.displayName || customer.name,
          email: user.email || customer.email,
          avatar: user.photoURL || customer.avatar,
          phone: customer.phone,
          savedAddresses: customer.savedAddresses,
          totalSpend: customer.totalSpend,
          bookingsCount: customer.bookingsCount,
          memberSince: customer.memberSince,
        };
        await setDoc(userDocRef, sanitizeForFirestore(newProfileData));
      } catch (dbErr) {
        console.warn('User profile creation error in Firestore:', dbErr);
      }
      showToast(`Account created! Welcome, ${name || user.email}!`);
      return user;
    } catch (error: any) {
      console.error('Email registration error:', error);
      let msg = error?.message || 'Registration failed';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      }
      setAuthError(msg);
      showToast(msg);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await signOutUser();
      setAuthError(null);
      showToast('Signed out successfully.');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      showToast('Error signing out.');
    }
  };

  // Real-time Firestore Listeners with automatic initial seeding
  useEffect(() => {
    let isInitialBookings = true;
    const prevBookingsStatusMap = new Map<string, { status: string; workerId?: string; workerName?: string }>();

    const unsubBookings = onSnapshot(
      collection(db, 'bookings'),
      async (snapshot) => {
        setFirestoreConnected(true);
        if (snapshot.empty && isInitialBookings) {
          isInitialBookings = false;
          try {
            for (const b of INITIAL_BOOKINGS) {
              await setDoc(doc(db, 'bookings', b.id), sanitizeForFirestore(b));
            }
          } catch (e) {
            console.warn('Firestore initial bookings seeding error:', e);
          }
          return;
        }

        if (!snapshot.empty) {
          const remoteBookings = snapshot.docs.map((d) => d.data() as Booking);
          // Preserve ordering
          setBookings(remoteBookings);

          // Real-time status update push notifications to Customer App via Firestore onSnapshot
          if (!isInitialBookings) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'modified') {
                const updated = change.doc.data() as Booking;
                const prev = prevBookingsStatusMap.get(updated.id);

                if (prev && (prev.status !== updated.status || (updated.workerId && prev.workerId !== updated.workerId))) {
                  let notifTitle = '';
                  let notifMsg = '';

                  if (updated.status === 'worker_assigned' || (updated.workerId && prev.workerId !== updated.workerId)) {
                    notifTitle = 'Worker Assigned';
                    notifMsg = `${updated.workerName || 'Partner'} has been assigned to your booking #${updated.id} (${updated.serviceTitle}).`;
                  } else if (updated.status === 'en_route') {
                    notifTitle = 'En Route';
                    notifMsg = `${updated.workerName || 'Partner'} is en route to ${updated.customerAddress?.locality || 'your Mumbai address'} for booking #${updated.id}!`;
                  } else if (updated.status === 'job_started') {
                    notifTitle = 'Service Started';
                    notifMsg = `Partner has begun work on #${updated.id} (${updated.serviceTitle}).`;
                  } else if (updated.status === 'completed') {
                    notifTitle = 'Service Completed';
                    notifMsg = `Booking #${updated.id} is complete! View your digital invoice and before/after photos.`;
                  } else if (updated.status === 'cancelled') {
                    notifTitle = 'Booking Cancelled';
                    notifMsg = `Booking #${updated.id} has been cancelled.`;
                  }

                  if (notifTitle) {
                    const newNotif: AppNotification = {
                      id: `notif-live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      title: notifTitle,
                      message: notifMsg,
                      timestamp: 'Just now',
                      target: 'customer',
                      read: false,
                      type: 'booking',
                    };

                    // Push directly into local state and Firestore notifications collection
                    setNotifications((cur) => [newNotif, ...cur]);
                    setDoc(doc(db, 'notifications', newNotif.id), sanitizeForFirestore(newNotif)).catch(console.warn);
                    showToast(`🔔 ${notifTitle}: ${notifMsg}`);
                  }
                }
              }
            });
          }

          // Populate cache map for change detection
          snapshot.docs.forEach((d) => {
            const b = d.data() as Booking;
            prevBookingsStatusMap.set(b.id, {
              status: b.status,
              workerId: b.workerId,
              workerName: b.workerName,
            });
          });
        }
        isInitialBookings = false;
      },
      (err) => {
        console.warn('Firestore bookings snapshot error:', err);
        setFirestoreConnected(false);
      }
    );

    let isInitialWorkers = true;
    const unsubWorkers = onSnapshot(
      collection(db, 'workers'),
      async (snapshot) => {
        if (snapshot.empty && isInitialWorkers) {
          isInitialWorkers = false;
          try {
            for (const w of INITIAL_WORKERS) {
              await setDoc(doc(db, 'workers', w.id), sanitizeForFirestore(w));
            }
          } catch (e) {
            console.warn('Firestore initial workers seeding error:', e);
          }
          return;
        }
        isInitialWorkers = false;
        if (!snapshot.empty) {
          const remoteWorkers = snapshot.docs.map((d) => d.data() as Worker);
          setWorkers(remoteWorkers);
        }
      },
      (err) => console.warn('Firestore workers snapshot error:', err)
    );

    let isInitialCoupons = true;
    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      async (snapshot) => {
        if (snapshot.empty && isInitialCoupons) {
          isInitialCoupons = false;
          try {
            for (const c of INITIAL_COUPONS) {
              await setDoc(doc(db, 'coupons', c.code), sanitizeForFirestore(c));
            }
          } catch (e) {
            console.warn('Firestore initial coupons seeding error:', e);
          }
          return;
        }
        isInitialCoupons = false;
        if (!snapshot.empty) {
          const remoteCoupons = snapshot.docs.map((d) => d.data() as Coupon);
          setCoupons(remoteCoupons);
        }
      },
      (err) => console.warn('Firestore coupons snapshot error:', err)
    );

    const unsubPricing = onSnapshot(
      doc(db, 'pricing', 'current'),
      async (snapshot) => {
        if (snapshot.exists()) {
          const remotePricing = snapshot.data() as PricingConfig;
          if (remotePricing?.cleaningTiers) {
            setPricing(remotePricing);
          }
        } else {
          try {
            await setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(INITIAL_PRICING));
          } catch (e) {
            console.warn('Firestore initial pricing seeding error:', e);
          }
        }
      },
      (err) => console.warn('Firestore pricing snapshot error:', err)
    );

    let isInitialNotifs = true;
    const unsubNotifs = onSnapshot(
      collection(db, 'notifications'),
      async (snapshot) => {
        if (snapshot.empty && isInitialNotifs) {
          isInitialNotifs = false;
          try {
            for (const n of INITIAL_NOTIFICATIONS) {
              await setDoc(doc(db, 'notifications', n.id), sanitizeForFirestore(n));
            }
          } catch (e) {
            console.warn('Firestore initial notifs seeding error:', e);
          }
          return;
        }
        isInitialNotifs = false;
        if (!snapshot.empty) {
          const remoteNotifs = snapshot.docs.map((d) => d.data() as AppNotification);
          setNotifications(remoteNotifs);
        }
      },
      (err) => console.warn('Firestore notifications snapshot error:', err)
    );

    const unsubActivities = onSnapshot(
      collection(db, 'activity_logs'),
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteLogs = snapshot.docs
            .map((d) => d.data() as { id: string; message: string; time: string; createdAt?: string })
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setLiveActivityLogs((prev) => {
            const map = new Map();
            [...remoteLogs, ...prev].forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values()).slice(0, 30);
          });
        }
      },
      (err) => console.warn('Firestore activity logs listener error:', err)
    );

    return () => {
      unsubBookings();
      unsubWorkers();
      unsubCoupons();
      unsubPricing();
      unsubNotifs();
      unsubActivities();
    };
  }, []);

  // Persist fallback to localStorage
  useEffect(() => {
    localStorage.setItem('chakachak_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('chakachak_pricing', JSON.stringify(pricing));
  }, [pricing]);

  useEffect(() => {
    localStorage.setItem('chakachak_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // Actions with bidirectional local and Firestore real-time sync
  const createNewBooking = (newBookingData: Partial<Booking>): Booking => {
    const bookingCount = bookings.length + 1;
    const randomId = `CC-${9080 + bookingCount}`;
    const invoiceNum = `INV-MUM-2026-${9080 + bookingCount}`;

    const newBooking: Booking = {
      id: randomId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: {
        label: 'Home',
        flat: '1203, Sea Crest',
        building: 'Sea Crest Apartments',
        street: 'Carter Road, Bandra West',
        locality: 'Bandra West',
        zone: 'Western Line',
        pincode: '400050',
      },
      serviceType: newBookingData.serviceType || 'transformation',
      serviceTitle: newBookingData.serviceTitle || 'Home Transformation',
      configurationSummary: newBookingData.configurationSummary || 'Hourly Sort',
      serviceTier: newBookingData.serviceTier,
      furnishing: newBookingData.furnishing,
      bhkSize: newBookingData.bhkSize,
      transformationMode: newBookingData.transformationMode,
      selectedAddons: newBookingData.selectedAddons || [],
      date: newBookingData.date || 'Today (Express Slot)',
      timeSlot: newBookingData.timeSlot || '03:00 PM - 07:00 PM',
      isUrgent: !!newBookingData.isUrgent,
      baseAmount: newBookingData.baseAmount || 1999,
      discountAmount: newBookingData.discountAmount || 0,
      urgentFee: newBookingData.urgentFee || 0,
      taxes: newBookingData.taxes || 150,
      totalAmount: newBookingData.totalAmount || 2149,
      paymentType: newBookingData.paymentType || 'full',
      amountPaid: newBookingData.amountPaid || 2149,
      balanceDue: newBookingData.balanceDue || 0,
      paymentMethod: newBookingData.paymentMethod || 'UPI',
      paymentStatus: newBookingData.paymentStatus || 'Paid',
      status: 'worker_assigned',
      statusTimestamps: {
        confirmed: 'Just now',
        worker_assigned: 'Just now',
      },
      workerId: 'w-101',
      workerName: 'Ramesh Sawant',
      workerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      workerPhone: '+91 98201 44829',
      workerRating: 4.92,
      etaMinutes: 22,
      scopeTasks: [
        { id: 'task-1', title: 'Consultation & priority room mapping with customer', completed: true },
        { id: 'task-2', title: 'Declutter & category separation onto drop sheets', completed: false },
        { id: 'task-3', title: 'Label creation and ergonomic shelving placement', completed: false },
        { id: 'task-4', title: 'Final handover inspection & satisfaction sign-off', completed: false },
      ],
      beforePhotos: [
        'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=600&q=80',
      ],
      afterPhotos: [],
      attachedExpenses: [],
      invoiceNumber: invoiceNum,
      ...newBookingData,
    };

    // Optimistic local state update
    setBookings((prev) => [newBooking, ...prev]);

    // Real-time Firestore write via service layer
    try {
      dbCreateBooking(newBooking).catch((err) =>
        console.warn('Firestore write new booking error:', err)
      );
    } catch (e) {
      console.warn('Firestore write catch:', e);
    }

    // Add audit log
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      user: 'Customer Mobile App',
      action: 'New Booking Placed',
      details: `${customer.name} booked ${newBooking.serviceTitle} (${newBooking.id}) for ₹${newBooking.totalAmount.toLocaleString('en-IN')}`,
      category: 'allocation',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Add notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Booking Confirmed! 🎉',
      message: `Your booking #${newBooking.id} is confirmed. Pro Ramesh Sawant has been assigned.`,
      timestamp: 'Just now',
      target: 'customer',
      read: false,
      type: 'booking',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Set as active tracking
    setActiveTrackingBookingId(newBooking.id);
    setSelectedWorkerJobId(newBooking.id);

    showToast(`Booking #${newBooking.id} created! Partner assigned.`);
    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updatedBookingData: any = null;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updatedTimestamps = { ...b.statusTimestamps };
        if (newStatus === 'en_route') {
          updatedTimestamps.en_route = timeStr;
          b.etaMinutes = 12;
        } else if (newStatus === 'job_started') {
          updatedTimestamps.job_started = timeStr;
          b.etaMinutes = 0;
        } else if (newStatus === 'completed') {
          updatedTimestamps.completed = timeStr;
          b.etaMinutes = 0;
          b.paymentStatus = 'Paid';
          b.balanceDue = 0;
        }
        updatedBookingData = {
          ...b,
          status: newStatus,
          statusTimestamps: updatedTimestamps,
        };
        return updatedBookingData;
      })
    );

    // Sync to Firestore
    try {
      const payload: Record<string, any> = {
        status: newStatus,
      };
      if (updatedBookingData?.statusTimestamps) {
        payload.statusTimestamps = updatedBookingData.statusTimestamps;
      }
      if (newStatus === 'en_route') payload.etaMinutes = 12;
      if (newStatus === 'job_started') payload.etaMinutes = 0;
      if (newStatus === 'completed') {
        payload.etaMinutes = 0;
        payload.paymentStatus = 'Paid';
        payload.balanceDue = 0;
      }
      updateDoc(doc(db, 'bookings', bookingId), sanitizeForFirestore(payload)).catch((err) =>
        console.warn('Firestore update status error:', err)
      );
    } catch (e) {
      console.warn('Firestore update catch:', e);
    }

    // Audit log
    const booking = bookings.find((b) => b.id === bookingId);
    const statusLabels: Record<Booking['status'], string> = {
      confirmed: 'Confirmed',
      worker_assigned: 'Worker Assigned',
      en_route: 'Worker En Route 🛵',
      job_started: 'Job Started in Progress 🛠️',
      completed: 'Job Completed Successfully ✅',
      cancelled: 'Cancelled',
    };

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      user: booking?.workerName ? `${booking.workerName} (Partner App)` : 'Operations Dispatch',
      action: `Status: ${statusLabels[newStatus]}`,
      details: `Booking ${bookingId} transitioned to ${newStatus}. Live map & customer alerted.`,
      category: 'allocation',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Push notification to customer
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Update on ${bookingId}`,
      message: `Your professional has marked: ${statusLabels[newStatus]}.`,
      timestamp: 'Just now',
      target: 'customer',
      read: false,
      type: 'booking',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    try {
      setDoc(doc(db, 'notifications', newNotif.id), sanitizeForFirestore(newNotif)).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }

    showToast(`Status updated to "${statusLabels[newStatus]}"`);
  };

  const toggleBookingTask = (bookingId: string, taskId: string) => {
    let nextTasks: any[] = [];
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        nextTasks = b.scopeTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        return {
          ...b,
          scopeTasks: nextTasks,
        };
      })
    );
    try {
      if (nextTasks.length > 0) {
        updateDoc(doc(db, 'bookings', bookingId), sanitizeForFirestore({ scopeTasks: nextTasks })).catch(console.warn);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const addBookingBeforePhoto = (bookingId: string, photoUrl: string) => {
    let updatedPhotos: string[] = [];
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        updatedPhotos = [...b.beforePhotos, photoUrl];
        return { ...b, beforePhotos: updatedPhotos };
      })
    );
    try {
      updateDoc(doc(db, 'bookings', bookingId), sanitizeForFirestore({ beforePhotos: updatedPhotos })).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
    showToast('Before photo uploaded to job docket.');
  };

  const addBookingAfterPhoto = (bookingId: string, photoUrl: string) => {
    let updatedPhotos: string[] = [];
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        updatedPhotos = [...b.afterPhotos, photoUrl];
        return { ...b, afterPhotos: updatedPhotos };
      })
    );
    try {
      updateDoc(doc(db, 'bookings', bookingId), sanitizeForFirestore({ afterPhotos: updatedPhotos })).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
    showToast('After completion photo uploaded.');
  };

  const addAttachedExpense = (bookingId: string, title: string, amount: number, receiptUrl: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updatedBooking: any = null;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const newExpense = { title, amount, receiptUrl, addedAt: timeStr };
        updatedBooking = {
          ...b,
          totalAmount: b.totalAmount + amount,
          balanceDue: b.balanceDue + amount,
          attachedExpenses: [...b.attachedExpenses, newExpense],
        };
        return updatedBooking;
      })
    );

    try {
      if (updatedBooking) {
        updateDoc(
          doc(db, 'bookings', bookingId),
          sanitizeForFirestore({
            totalAmount: updatedBooking.totalAmount,
            balanceDue: updatedBooking.balanceDue,
            attachedExpenses: updatedBooking.attachedExpenses,
          })
        ).catch(console.warn);
      }
    } catch (e) {
      console.warn(e);
    }

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      user: 'Partner App',
      action: 'Materials Expense Billed',
      details: `Added ₹${amount} for "${title}" with receipt photo to booking ${bookingId}`,
      category: 'pricing',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Added ₹${amount} expense item to invoice with photo proof.`);
  };

  const submitCustomerRating = (
    bookingId: string,
    rating: { stars: number; tags: string[]; comment: string; photoUrl?: string }
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullRating = { ...rating, ratedAt: timeStr };

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          customerRating: fullRating,
        };
      })
    );

    try {
      updateDoc(
        doc(db, 'bookings', bookingId),
        sanitizeForFirestore({ customerRating: fullRating })
      ).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      user: 'Customer Mobile App',
      action: 'Review Submitted',
      details: `${rating.stars}★ review posted by ${customer.name} for ${bookingId}: "${rating.comment.slice(0, 40)}..."`,
      category: 'support',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Thank you for rating ${rating.stars} stars! Review saved.`);
  };

  const updateHourlyRate = (index: number, newPrice: number) => {
    setPricing((prev) => {
      const updated = [...prev.hourlyRates];
      const oldPrice = updated[index].price;
      updated[index] = { ...updated[index], price: newPrice };

      const newLog: AdminAuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Admin Console (Inline Editor)',
        action: 'Price updated',
        details: `Hourly Organizing ${updated[index].label} modified from ₹${oldPrice} to ₹${newPrice}`,
        category: 'pricing',
      };
      setAuditLogs((l) => [newLog, ...l]);

      const nextPricing = { ...prev, hourlyRates: updated };
      try {
        setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(nextPricing)).catch(console.warn);
      } catch (e) {
        console.warn(e);
      }

      return nextPricing;
    });
    showToast('Updated! Reflected in Customer App instantly.');
  };

  const updateBhkTransformationPrice = (bhk: BHKSize, newPrice: number) => {
    setPricing((prev) => {
      const oldPrice = prev.bhkTransformation[bhk].price;
      const newLog: AdminAuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Admin Console',
        action: 'Price updated',
        details: `Transformation ${bhk} Full-Home changed from ₹${oldPrice} to ₹${newPrice}`,
        category: 'pricing',
      };
      setAuditLogs((l) => [newLog, ...l]);

      const nextPricing = {
        ...prev,
        bhkTransformation: {
          ...prev.bhkTransformation,
          [bhk]: { ...prev.bhkTransformation[bhk], price: newPrice },
        },
      };

      try {
        setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(nextPricing)).catch(console.warn);
      } catch (e) {
        console.warn(e);
      }

      return nextPricing;
    });
    showToast('Updated! Reflected in Customer App instantly.');
  };

  const updateCleaningPrice = (
    tier: CleaningTier,
    furnishing: PropertyFurnishing,
    bhk: BHKSize,
    newPrice: number
  ) => {
    setPricing((prev) => {
      const oldPrice = prev.cleaningTiers[tier].basePrice[furnishing][bhk];
      const newLog: AdminAuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Admin Console',
        action: 'Price updated',
        details: `${tier.toUpperCase()} ${bhk} (${furnishing}) changed from ₹${oldPrice} to ₹${newPrice}`,
        category: 'pricing',
      };
      setAuditLogs((l) => [newLog, ...l]);

      const nextPricing = {
        ...prev,
        cleaningTiers: {
          ...prev.cleaningTiers,
          [tier]: {
            ...prev.cleaningTiers[tier],
            basePrice: {
              ...prev.cleaningTiers[tier].basePrice,
              [furnishing]: {
                ...prev.cleaningTiers[tier].basePrice[furnishing],
                [bhk]: newPrice,
              },
            },
          },
        },
      };

      try {
        setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(nextPricing)).catch(console.warn);
      } catch (e) {
        console.warn(e);
      }

      return nextPricing;
    });
    showToast('Updated! Reflected in Customer App instantly.');
  };

  const addNewCoupon = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev]);
    try {
      setDoc(doc(db, 'coupons', coupon.code), sanitizeForFirestore(coupon)).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Admin Console',
      action: 'Coupon Created',
      details: `Created promo code ${coupon.code}: ${coupon.description}`,
      category: 'coupon',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(`Coupon ${coupon.code} created & broadcasted.`);
  };

  const toggleCouponActive = (code: string) => {
    let toggled: Coupon | undefined;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code === code) {
          toggled = { ...c, active: !c.active };
          return toggled;
        }
        return c;
      })
    );
    if (toggled) {
      try {
        updateDoc(doc(db, 'coupons', code), sanitizeForFirestore({ active: toggled.active })).catch(console.warn);
      } catch (e) {
        console.warn(e);
      }
    }
    showToast(`Coupon ${code} status toggled.`);
  };

  const broadcastNotification = (
    title: string,
    message: string,
    target: AppNotification['target'],
    type: AppNotification['type']
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      target,
      read: false,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    try {
      setDoc(doc(db, 'notifications', newNotif.id), sanitizeForFirestore(newNotif)).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }

    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user: 'Admin Broadcast Tool',
      action: 'Push Broadcast Sent',
      details: `Dispatched "${title}" to audience: ${target.toUpperCase()}`,
      category: 'support',
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Notification broadcasted to ${target}!`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      updateDoc(doc(db, 'notifications', id), sanitizeForFirestore({ read: true })).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
  };

  const resolveSupportTicket = (ticketId: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    showToast(`Ticket ${ticketId} marked as resolved.`);
  };

  const toggleWorkerAvailability = (workerId: string) => {
    let nextStatus = 'available';
    let nextIsOnline = true;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id !== workerId) return w;
        nextStatus = w.status === 'offline' ? 'available' : 'offline';
        nextIsOnline = nextStatus !== 'offline';
        if (workerId === activeWorkerId) {
          setIsWorkerOnline(nextIsOnline);
        }
        return { ...w, status: nextStatus as any, isOnline: nextIsOnline };
      })
    );

    try {
      dbUpdateWorkerStatus(workerId, nextStatus as any, nextIsOnline).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
  };

  const selectedWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];
  const setSelectedWorkerId = setActiveWorkerId;
  const toggleWorkerOnline = toggleWorkerAvailability;

  const [liveActivityLogs, setLiveActivityLogs] = useState<{ id: string; message: string; time: string }[]>([
    { id: '1', message: 'Ramesh Sawant assigned to Deep Clean #CC-9082 (Bandra West)', time: '2 mins ago' },
    { id: '2', message: 'New 3BHK Transformation booked at Sea Crest, Carter Road', time: '8 mins ago' },
    { id: '3', message: 'Pooja Sharma started job at Worli Sea Face (#CC-9080)', time: '14 mins ago' },
    { id: '4', message: 'Customer Riya Mehta rated 5★ with tip for Modular Kitchen Sort', time: '22 mins ago' },
    { id: '5', message: 'Suresh Patil completed job in Powai Hiranandani', time: '45 mins ago' },
  ]);

  const logActivity = (message: string, bookingId?: string, workerId?: string) => {
    const timeStr = 'Just now';
    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      time: timeStr,
      createdAt: new Date().toISOString(),
      bookingId,
      workerId,
    };
    setLiveActivityLogs((prev) => [newLog, ...prev]);
    try {
      setDoc(doc(db, 'activity_logs', newLog.id), sanitizeForFirestore(newLog)).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
  };

  const updateJobStatus = async (
    bookingId: string,
    status: BookingStatus,
    metadata?: {
      etaMinutes?: number;
      paymentStatus?: Booking['paymentStatus'];
      balanceDue?: number;
      statusTimestamps?: Record<string, string>;
    }
  ) => {
    try {
      await dbUpdateJobStatus(bookingId, status, metadata);
    } catch (e) {
      console.warn('dbUpdateJobStatus error:', e);
    }
    updateBookingStatus(bookingId, status);
  };

  const reassignWorker = (bookingId: string, targetWorker: Worker) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          workerId: targetWorker.id,
          workerName: targetWorker.name,
          workerPhone: targetWorker.phone,
          workerPhoto: targetWorker.photo || targetWorker.avatar,
          workerRating: targetWorker.rating,
          status: b.status === 'confirmed' ? 'worker_assigned' : b.status,
        };
      })
    );

    try {
      dbAssignWorkerToBooking(bookingId, targetWorker).catch(console.warn);
      dbUpdateJobStatus(bookingId, 'worker_assigned', {
        statusTimestamps: {
          worker_assigned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      }).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }

    const activityMsg = `Partner ${targetWorker.name} assigned to booking #${bookingId}`;
    logActivity(activityMsg, bookingId, targetWorker.id);
    showToast(`Reassigned to ${targetWorker.name}`);
  };

  const updatePricingConfig = (newPricing: PricingConfig) => {
    setPricing(newPricing);
    try {
      setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(newPricing)).catch(console.warn);
    } catch (e) {
      console.warn(e);
    }
    showToast('Live pricing matrix published successfully!');
  };

  const addCoupon = (coupon: Coupon) => {
    addNewCoupon(coupon);
  };

  const addExpenseToBooking = (bookingId: string, expense: { title: string; amount: number; receiptUrl?: string }) => {
    addAttachedExpense(bookingId, expense.title, expense.amount, expense.receiptUrl || '');
  };

  return (
    <AppContext.Provider
      value={{
        activePortal,
        setActivePortal,
        viewMode,
        setViewMode,
        bookings,
        workers,
        customer,
        pricing,
        coupons,
        auditLogs,
        supportTickets,
        notifications,
        // Global Navigation Stack
        navStack,
        currentNavEntry,
        previousNavEntry,
        canGoBack,
        pushNav,
        popNav,
        goBack,
        replaceNav,
        resetNav,
        clearHistoryTo,
        getPreviousTitle,
        // Checkout state preserved across nav transitions
        checkoutConfig,
        setCheckoutConfig,
        savedConfigData,
        setSavedConfigData,
        checkoutStep,
        setCheckoutStep,
        checkoutDraft,
        updateCheckoutDraft,
        clearCheckoutDraft,
        // Service config drafts
        serviceConfigDrafts,
        saveServiceConfigDraft,
        getServiceConfigDraft,
        // Navigation convenience helpers
        openServiceConfig,
        openCheckout,
        openTracking,
        openInvoice,
        openRating,
        openAddressPicker,
        openNotifications,
        closeModal,
        activeCustomerTab: activeCustomerTabInternal,
        setActiveCustomerTab,
        activeConfigService,
        setActiveConfigService,
        activeConfigInitialData,
        setActiveConfigInitialData,
        rebookBooking,
        preselectedTier,
        setPreselectedTier,
        activeTrackingBookingId,
        setActiveTrackingBookingId,
        activeInvoiceBookingId,
        setActiveInvoiceBookingId,
        activeRatingBookingId,
        setActiveRatingBookingId,
        addressPickerOpen,
        setAddressPickerOpen,
        notificationsDrawerOpen,
        setNotificationsDrawerOpen,
        selectedAddressId,
        setSelectedAddressId,
        activeWorkerId,
        setActiveWorkerId,
        selectedWorker,
        setSelectedWorkerId,
        isWorkerOnline,
        setIsWorkerOnline,
        selectedWorkerJobId,
        setSelectedWorkerJobId,
        toggleWorkerOnline,
        liveActivityLogs,
        logActivity,
        updateJobStatus,
        reassignWorker,
        updatePricingConfig,
        addCoupon,
        addExpenseToBooking,
        createNewBooking,
        updateBookingStatus,
        toggleBookingTask,
        addBookingBeforePhoto,
        addBookingAfterPhoto,
        addAttachedExpense,
        submitCustomerRating,
        updateHourlyRate,
        updateBhkTransformationPrice,
        updateCleaningPrice,
        addNewCoupon,
        toggleCouponActive,
        broadcastNotification,
        markNotificationAsRead,
        resolveSupportTicket,
        toggleWorkerAvailability,
        toastMessage,
        showToast,
        // Firebase Authentication & Real-time Database
        user,
        setUser,
        currentUser,
        isAuthLoading,
        authError,
        loginWithGoogle,
        loginWithEmail,
        loginWithOTP,
        signUpWithEmail,
        logoutUser,
        clearAuthError,
        firestoreConnected,
        isFirestoreSyncing,
        dbService,
        isAuthModalOpen,
        setAuthModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

/**
 * Dedicated useAuth hook wrapping Firebase Auth methods and tracking user state
 */
export const useAuth = () => {
  const {
    user,
    setUser,
    currentUser,
    isAuthLoading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    loginWithOTP,
    signUpWithEmail,
    logoutUser,
    clearAuthError,
    firestoreConnected,
    customer,
    isAuthModalOpen,
    setAuthModalOpen,
  } = useApp();

  const activeUser = user ?? currentUser;

  return {
    user: activeUser,
    currentUser: activeUser,
    setUser,
    loading: isAuthLoading,
    isAuthLoading,
    error: authError,
    authError,
    isAuthenticated: Boolean(activeUser),
    loginWithGoogle,
    loginWithEmail,
    loginWithOTP,
    signUpWithEmail,
    login: loginWithEmail,
    signup: signUpWithEmail,
    logout: logoutUser,
    logoutUser,
    clearAuthError,
    firestoreConnected,
    userProfile: customer,
    isAuthModalOpen,
    setAuthModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
  };
};

export interface UseRealtimeBookingsAndCatalogReturn {
  // Active user's bookings (synchronized in real-time with Firestore)
  userBookings: Booking[];
  // All system bookings
  allBookings: Booking[];
  // Active in-progress booking for the user, if any
  activeBooking: Booking | undefined;
  // Completed bookings for the user
  completedBookings: Booking[];
  // Real-time service catalog
  pricing: PricingConfig;
  packages: SpecificItemPackage[];
  addons: CleaningAddon[];
  // Connection and synchronization status
  isSyncing: boolean;
  isConnected: boolean;
  lastSyncedAt: Date | null;
  error: Error | null;
  // Helpers
  refresh: () => void;
}

/**
 * Hook that uses onSnapshot from Firestore to keep the active user's booking history
 * and service catalog (pricing, packages, addons) in sync with the database in real-time.
 */
export const useRealtimeUserBookingsAndCatalog = (customUserIdentifier?: {
  userId?: string;
  email?: string;
  phone?: string;
}): UseRealtimeBookingsAndCatalogReturn => {
  const { user, customer, bookings: contextBookings, pricing: contextPricing } = useApp();

  const activeUserId = customUserIdentifier?.userId || user?.uid;
  const activeEmail = (customUserIdentifier?.email || user?.email || customer?.email || '').toLowerCase().trim();
  const activePhone = (customUserIdentifier?.phone || customer?.phone || '').trim();
  const activeName = (user?.displayName || customer?.name || '').toLowerCase().trim();

  const [realtimeBookings, setRealtimeBookings] = useState<Booking[]>([]);
  const [realtimePricing, setRealtimePricing] = useState<PricingConfig | null>(null);
  const [realtimePackages, setRealtimePackages] = useState<SpecificItemPackage[]>([]);
  const [realtimeAddons, setRealtimeAddons] = useState<CleaningAddon[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsSyncing(true);
    let unsubBookings: (() => void) | null = null;
    let unsubPricing: (() => void) | null = null;
    let unsubPackages: (() => void) | null = null;
    let unsubAddons: (() => void) | null = null;

    try {
      // 1. Real-time Bookings History onSnapshot listener
      const bookingsCol = collection(db, 'bookings');
      unsubBookings = onSnapshot(
        bookingsCol,
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map((d) => d.data() as Booking);
            setRealtimeBookings(list);
          }
          setIsSyncing(false);
          setIsConnected(true);
          setLastSyncedAt(new Date());
        },
        (err) => {
          console.warn('Real-time bookings onSnapshot error:', err);
          setError(err);
          setIsSyncing(false);
          setIsConnected(false);
        }
      );

      // 2. Real-time Pricing Catalog onSnapshot listener
      const pricingDoc = doc(db, 'pricing', 'current');
      unsubPricing = onSnapshot(
        pricingDoc,
        (snap) => {
          if (snap.exists()) {
            setRealtimePricing(snap.data() as PricingConfig);
          }
          setIsSyncing(false);
          setIsConnected(true);
          setLastSyncedAt(new Date());
        },
        (err) => {
          console.warn('Real-time pricing onSnapshot error:', err);
          setError(err);
        }
      );

      // 3. Real-time Specific Packages onSnapshot listener
      const packagesCol = collection(db, 'packages');
      unsubPackages = onSnapshot(
        packagesCol,
        (snap) => {
          if (!snap.empty) {
            setRealtimePackages(snap.docs.map((d) => d.data() as SpecificItemPackage));
          }
        },
        (err) => console.warn('Real-time packages onSnapshot error:', err)
      );

      // 4. Real-time Addons onSnapshot listener
      const addonsCol = collection(db, 'addons');
      unsubAddons = onSnapshot(
        addonsCol,
        (snap) => {
          if (!snap.empty) {
            setRealtimeAddons(snap.docs.map((d) => d.data() as CleaningAddon));
          }
        },
        (err) => console.warn('Real-time addons onSnapshot error:', err)
      );
    } catch (e: any) {
      console.warn('useRealtimeUserBookingsAndCatalog setup error:', e);
      setError(e);
      setIsSyncing(false);
    }

    return () => {
      if (unsubBookings) unsubBookings();
      if (unsubPricing) unsubPricing();
      if (unsubPackages) unsubPackages();
      if (unsubAddons) unsubAddons();
    };
  }, [activeUserId, activeEmail, activePhone]);

  const effectiveAllBookings = realtimeBookings.length > 0 ? realtimeBookings : contextBookings;
  const effectivePricing = realtimePricing || contextPricing;

  // Filter bookings for the active user
  const userBookings = effectiveAllBookings.filter((b) => {
    if (activeUserId && (b as any).userId === activeUserId) return true;
    if (activeUserId && (b as any).customerId === activeUserId) return true;
    if (activeEmail && (b as any).customerEmail?.toLowerCase() === activeEmail) return true;
    if (activePhone && b.customerPhone?.replace(/\D/g, '') === activePhone.replace(/\D/g, '')) return true;
    if (activeName && b.customerName?.toLowerCase() === activeName) return true;
    // Fallback: If demo customer or shared session, show customer's bookings
    return true;
  });

  const activeBooking = userBookings.find(
    (b) => b.status === 'en_route' || b.status === 'job_started' || b.status === 'worker_assigned'
  );

  const completedBookings = userBookings.filter((b) => b.status === 'completed');

  return {
    userBookings,
    allBookings: effectiveAllBookings,
    activeBooking,
    completedBookings,
    pricing: effectivePricing,
    packages: realtimePackages,
    addons: realtimeAddons,
    isSyncing,
    isConnected,
    lastSyncedAt,
    error,
    refresh: () => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 300);
    },
  };
};

// Aliases for developer convenience & explicit requirements
export const useRealtimeSync = useRealtimeUserBookingsAndCatalog;
export const useActiveUserRealtimeSync = useRealtimeUserBookingsAndCatalog;
export const useRealtimeBookingAndCatalog = useRealtimeUserBookingsAndCatalog;
export const useUserRealtimeData = useRealtimeUserBookingsAndCatalog;

