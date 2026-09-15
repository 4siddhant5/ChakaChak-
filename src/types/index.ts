export type ServiceLineId = 'transformation' | 'cleaning';

export type TransformationMode = 'hourly' | 'bhk' | 'specific';
export type CleaningTier = 'silver' | 'gold' | 'platinum' | 'diamond';
export type PropertyFurnishing = 'furnished' | 'unfurnished';
export type BHKSize = '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK';

export interface SpecificItemPackage {
  id: string;
  name: string;
  category: string;
  estimatedHours: string;
  price: number;
  originalPrice: number;
  description: string;
  image: string;
  popular?: boolean;
}

export interface CleaningAddon {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  iconName: string;
  selected?: boolean;
}

export interface PricingConfig {
  hourlyRates: { hours: number; price: number; originalPrice: number; label: string }[];
  bhkTransformation: Record<BHKSize, { price: number; originalPrice: number }>;
  cleaningTiers: Record<
    CleaningTier,
    {
      name: string;
      tagline: string;
      badge: string;
      basePrice: Record<PropertyFurnishing, Record<BHKSize, number>>;
      originalPriceMultiplier: number;
      highlights: string[];
      scopeChecklist: string[];
      recommendedFor: string;
    }
  >;
  urgentSurcharge: number;
}

export type BookingStatus =
  | 'confirmed'
  | 'worker_assigned'
  | 'en_route'
  | 'job_started'
  | 'completed'
  | 'cancelled';

export interface BookingTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AttachedExpense {
  title: string;
  amount: number;
  receiptUrl: string;
  addedAt: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    label: string;
    flat: string;
    building: string;
    street: string;
    locality: string;
    zone: 'South Mumbai' | 'Western Line' | 'Central Line' | 'Navi Mumbai';
    pincode: string;
  };
  serviceType: ServiceLineId;
  serviceTitle: string;
  configurationSummary: string;
  serviceTier?: CleaningTier;
  furnishing?: PropertyFurnishing;
  bhkSize?: BHKSize;
  transformationMode?: TransformationMode;
  selectedAddons: CleaningAddon[];
  date: string;
  timeSlot: string;
  isUrgent: boolean;
  baseAmount: number;
  discountAmount: number;
  urgentFee: number;
  taxes: number;
  totalAmount: number;
  paymentType: 'full' | 'advance_10' | 'advance_20';
  amountPaid: number;
  balanceDue: number;
  paymentMethod: 'UPI' | 'Credit Card' | 'Netbanking' | 'Cash on completion';
  paymentStatus: 'Paid' | 'Advance Paid' | 'Pending';
  status: BookingStatus;
  statusTimestamps: {
    confirmed: string;
    worker_assigned?: string;
    en_route?: string;
    job_started?: string;
    completed?: string;
  };
  workerId?: string;
  workerName?: string;
  workerPhoto?: string;
  workerPhone?: string;
  workerRating?: number;
  etaMinutes?: number;
  scopeTasks: BookingTask[];
  beforePhotos: string[];
  afterPhotos: string[];
  attachedExpenses: AttachedExpense[];
  customerRating?: {
    stars: number;
    tags: string[];
    comment: string;
    photoUrl?: string;
    ratedAt: string;
  };
  invoiceNumber: string;
}

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  photo?: string;
  phone: string;
  zone: 'South Mumbai' | 'Western Line' | 'Central Line' | 'Navi Mumbai';
  locality?: string;
  role?: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  totalJobsCompleted?: number;
  onTimeRate: number; // percentage e.g. 98.6
  status: 'available' | 'busy' | 'offline';
  isOnline?: boolean;
  specialties: string[];
  joinedDate: string;
  verificationStatus: {
    aadhaarVerified: boolean;
    policeCleared: boolean;
    trainedCertified: boolean;
  };
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pendingPayout: number;
  };
  currentLocation: {
    locality: string;
    lat: number;
    lng: number;
  };
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  flatDiscount?: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
  validTill: string;
  active: boolean;
  category: 'all' | 'cleaning' | 'transformation';
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  category: 'pricing' | 'allocation' | 'coupon' | 'support' | 'worker';
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  savedAddresses: {
    id: string;
    label: string;
    address: string;
    locality: string;
    zone: 'South Mumbai' | 'Western Line' | 'Central Line' | 'Navi Mumbai';
    pincode: string;
    isDefault: boolean;
  }[];
  totalSpend: number;
  bookingsCount: number;
  memberSince: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  bookingId: string;
  issue: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  zone: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  target: 'customer' | 'worker' | 'admin' | 'all';
  read: boolean;
  type: 'booking' | 'payment' | 'promo' | 'alert';
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'worker' | 'agent' | 'system';
  targetPortal?: 'customer' | 'worker' | 'all';
  text: string;
  timestamp: string;
  createdAt: string;
  bookingId?: string;
  status?: 'sent' | 'delivered' | 'read';
}
