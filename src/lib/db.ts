import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  db,
  sanitizeForFirestore,
} from './firebase';
import {
  Booking,
  Worker,
  PricingConfig,
  SpecificItemPackage,
  CleaningAddon,
  BookingStatus,
  BookingTask,
} from '../types';
import {
  INITIAL_PRICING,
  SPECIFIC_PACKAGES,
  CLEANING_ADDONS,
  INITIAL_WORKERS,
} from '../data/mockData';

// ---------------------------------------------------------------------------
// 1. Service Catalogs (Pricing, Packages, Add-ons)
// ---------------------------------------------------------------------------

export interface ServiceCatalogData {
  pricing: PricingConfig;
  specificPackages: SpecificItemPackage[];
  addons: CleaningAddon[];
}

/**
 * Retrieve current pricing configuration from Firestore.
 * Falls back to INITIAL_PRICING if document does not exist yet.
 */
export async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const docRef = doc(db, 'pricing', 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PricingConfig;
    }
  } catch (error) {
    console.warn('Error fetching pricing config from Firestore:', error);
  }
  return INITIAL_PRICING;
}

/**
 * Update pricing configuration in Firestore.
 */
export async function updatePricingConfig(newPricing: PricingConfig): Promise<void> {
  const docRef = doc(db, 'pricing', 'current');
  await setDoc(docRef, sanitizeForFirestore(newPricing));
}

/**
 * Subscribe to live pricing configuration updates.
 */
export function subscribePricingConfig(
  callback: (pricing: PricingConfig) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, 'pricing', 'current');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as PricingConfig);
      } else {
        callback(INITIAL_PRICING);
      }
    },
    (err) => {
      console.warn('Live pricing subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Retrieve specific item packages from Firestore or default catalog.
 */
export async function getSpecificPackages(): Promise<SpecificItemPackage[]> {
  try {
    const colRef = collection(db, 'packages');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as SpecificItemPackage);
    }
  } catch (error) {
    console.warn('Error fetching packages from Firestore:', error);
  }
  return SPECIFIC_PACKAGES;
}

/**
 * Retrieve cleaning add-on services from Firestore or default catalog.
 */
export async function getCleaningAddons(): Promise<CleaningAddon[]> {
  try {
    const colRef = collection(db, 'addons');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as CleaningAddon);
    }
  } catch (error) {
    console.warn('Error fetching addons from Firestore:', error);
  }
  return CLEANING_ADDONS;
}

/**
 * Retrieve the full service catalogs bundle (pricing matrix, specific packages, and cleaning addons).
 */
export async function getServiceCatalogs(): Promise<ServiceCatalogData> {
  const [pricing, specificPackages, addons] = await Promise.all([
    getPricingConfig(),
    getSpecificPackages(),
    getCleaningAddons(),
  ]);

  return {
    pricing,
    specificPackages,
    addons,
  };
}

/**
 * Alias for getServiceCatalogs
 */
export const fetchServiceCatalogs = getServiceCatalogs;
export const getServiceCatalog = getServiceCatalogs;

/**
 * Real-time listener for service catalogs.
 */
export function subscribeServiceCatalogs(
  callback: (catalogs: ServiceCatalogData) => void,
  onError?: (error: Error) => void
): () => void {
  let currentPricing = INITIAL_PRICING;
  let currentPackages = SPECIFIC_PACKAGES;
  let currentAddons = CLEANING_ADDONS;

  const emit = () => {
    callback({
      pricing: currentPricing,
      specificPackages: currentPackages,
      addons: currentAddons,
    });
  };

  // Listen to pricing
  const unsubPricing = subscribePricingConfig(
    (p) => {
      currentPricing = p;
      emit();
    },
    onError
  );

  // Listen to packages if seeded in collection, else fallback
  const unsubPackages = onSnapshot(
    collection(db, 'packages'),
    (snap) => {
      if (!snap.empty) {
        currentPackages = snap.docs.map((d) => d.data() as SpecificItemPackage);
        emit();
      }
    },
    (err) => console.warn('Packages snapshot warning:', err)
  );

  // Listen to addons
  const unsubAddons = onSnapshot(
    collection(db, 'addons'),
    (snap) => {
      if (!snap.empty) {
        currentAddons = snap.docs.map((d) => d.data() as CleaningAddon);
        emit();
      }
    },
    (err) => console.warn('Addons snapshot warning:', err)
  );

  // Initial emission
  emit();

  return () => {
    unsubPricing();
    unsubPackages();
    unsubAddons();
  };
}

/**
 * Seed service catalogs into Firestore if not present.
 */
export async function seedServiceCatalogsIfEmpty(): Promise<void> {
  try {
    const pricingSnap = await getDoc(doc(db, 'pricing', 'current'));
    if (!pricingSnap.exists()) {
      await setDoc(doc(db, 'pricing', 'current'), sanitizeForFirestore(INITIAL_PRICING));
    }

    const packagesSnap = await getDocs(collection(db, 'packages'));
    if (packagesSnap.empty) {
      for (const pkg of SPECIFIC_PACKAGES) {
        await setDoc(doc(db, 'packages', pkg.id), sanitizeForFirestore(pkg));
      }
    }

    const addonsSnap = await getDocs(collection(db, 'addons'));
    if (addonsSnap.empty) {
      for (const addon of CLEANING_ADDONS) {
        await setDoc(doc(db, 'addons', addon.id), sanitizeForFirestore(addon));
      }
    }
  } catch (error) {
    console.warn('Error seeding service catalogs in Firestore:', error);
  }
}

// ---------------------------------------------------------------------------
// 2. Bookings Management
// ---------------------------------------------------------------------------

/**
 * Create a new booking in Firestore and return the full Booking record.
 */
export async function createBooking(
  bookingData: Booking | (Omit<Booking, 'id'> & { id?: string })
): Promise<Booking> {
  const bookingId =
    bookingData.id && bookingData.id.trim().length > 0
      ? bookingData.id
      : `CC-${Math.floor(100000 + Math.random() * 900000)}`;

  const fullBooking: Booking = {
    ...bookingData,
    id: bookingId,
  };

  const docRef = doc(db, 'bookings', bookingId);
  await setDoc(docRef, sanitizeForFirestore(fullBooking));
  return fullBooking;
}

/**
 * Alias for createBooking
 */
export const createNewBooking = createBooking;

/**
 * Retrieve a single booking by ID from Firestore.
 */
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Booking;
    }
  } catch (error) {
    console.warn(`Error fetching booking ${bookingId}:`, error);
  }
  return null;
}

/**
 * Retrieve all bookings, optionally filtered by status or assigned worker.
 */
export async function getBookings(filter?: {
  status?: BookingStatus;
  workerId?: string;
}): Promise<Booking[]> {
  try {
    const colRef = collection(db, 'bookings');
    let q = query(colRef);

    if (filter?.status) {
      q = query(colRef, where('status', '==', filter.status));
    }
    if (filter?.workerId) {
      q = query(colRef, where('workerId', '==', filter.workerId));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Booking);
  } catch (error) {
    console.warn('Error fetching bookings from Firestore:', error);
    return [];
  }
}

/**
 * Subscribe to real-time updates for all bookings.
 */
export function subscribeBookings(
  callback: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'bookings');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const bookings = snapshot.docs.map((d) => d.data() as Booking);
      callback(bookings);
    },
    (err) => {
      console.warn('Bookings live subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to real-time updates for a single booking.
 */
export function subscribeBookingById(
  bookingId: string,
  callback: (booking: Booking | null) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, 'bookings', bookingId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Booking);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn(`Live subscription error for booking ${bookingId}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update any partial fields of a booking in Firestore.
 */
export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, sanitizeForFirestore(updates));
}

/**
 * Update booking status and corresponding timestamps / ETA in real-time.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  metadata?: {
    etaMinutes?: number;
    paymentStatus?: Booking['paymentStatus'];
    balanceDue?: number;
    statusTimestamps?: Record<string, string>;
  }
): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const payload: Record<string, any> = {
    status,
    [`statusTimestamps.${status}`]: timeStr,
  };

  if (metadata?.statusTimestamps) {
    payload.statusTimestamps = metadata.statusTimestamps;
  }
  if (status === 'en_route') payload.etaMinutes = metadata?.etaMinutes ?? 12;
  if (status === 'job_started') payload.etaMinutes = 0;
  if (status === 'completed') {
    payload.etaMinutes = 0;
    payload.paymentStatus = 'Paid';
    payload.balanceDue = 0;
  }
  if (metadata?.paymentStatus) payload.paymentStatus = metadata.paymentStatus;
  if (metadata?.balanceDue !== undefined) payload.balanceDue = metadata.balanceDue;

  await updateDoc(docRef, sanitizeForFirestore(payload));
}

/**
 * Update real-time job status (alias for updateBookingStatus)
 */
export const updateJobStatus = updateBookingStatus;

/**
 * Update checklist tasks of a booking in Firestore.
 */
export async function updateBookingScopeTasks(
  bookingId: string,
  tasks: BookingTask[]
): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, sanitizeForFirestore({ scopeTasks: tasks }));
}

/**
 * Append a before photo to a booking in Firestore.
 */
export async function addBookingBeforePhoto(
  bookingId: string,
  photoUrl: string,
  existingPhotos: string[] = []
): Promise<string[]> {
  const updated = [...existingPhotos, photoUrl];
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, sanitizeForFirestore({ beforePhotos: updated }));
  return updated;
}

/**
 * Append an after photo to a booking in Firestore.
 */
export async function addBookingAfterPhoto(
  bookingId: string,
  photoUrl: string,
  existingPhotos: string[] = []
): Promise<string[]> {
  const updated = [...existingPhotos, photoUrl];
  const docRef = doc(db, 'bookings', bookingId);
  await updateDoc(docRef, sanitizeForFirestore({ afterPhotos: updated }));
  return updated;
}

// ---------------------------------------------------------------------------
// 3. Workers & Real-Time Worker Status Operations
// ---------------------------------------------------------------------------

/**
 * Update worker status and online flag in real-time.
 */
export async function updateWorkerStatus(
  workerId: string,
  status: 'available' | 'busy' | 'offline',
  isOnline?: boolean
): Promise<void> {
  const docRef = doc(db, 'workers', workerId);
  const onlineState = isOnline !== undefined ? isOnline : status !== 'offline';

  await updateDoc(
    docRef,
    sanitizeForFirestore({
      status,
      isOnline: onlineState,
    })
  );
}

/**
 * Update worker current GPS/locality coordinates in real-time.
 */
export async function updateWorkerLocation(
  workerId: string,
  location: { locality: string; lat: number; lng: number }
): Promise<void> {
  const docRef = doc(db, 'workers', workerId);
  await updateDoc(
    docRef,
    sanitizeForFirestore({
      currentLocation: location,
    })
  );
}

/**
 * Assign a worker to a booking in Firestore.
 */
export async function assignWorkerToBooking(bookingId: string, worker: Worker): Promise<void> {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const docRef = doc(db, 'bookings', bookingId);

  await updateDoc(
    docRef,
    sanitizeForFirestore({
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerPhoto: worker.photo || worker.avatar,
      workerRating: worker.rating,
      status: 'worker_assigned' as BookingStatus,
      'statusTimestamps.worker_assigned': timeStr,
    })
  );
}

/**
 * Retrieve all registered workers from Firestore or default list.
 */
export async function getWorkers(): Promise<Worker[]> {
  try {
    const colRef = collection(db, 'workers');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Worker);
    }
  } catch (error) {
    console.warn('Error fetching workers from Firestore:', error);
  }
  return INITIAL_WORKERS;
}

/**
 * Retrieve a specific worker by ID.
 */
export async function getWorkerById(workerId: string): Promise<Worker | null> {
  try {
    const docRef = doc(db, 'workers', workerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Worker;
    }
  } catch (error) {
    console.warn(`Error fetching worker ${workerId}:`, error);
  }
  return null;
}

/**
 * Subscribe to real-time updates for all workers (status, availability, location).
 */
export function subscribeWorkers(
  callback: (workers: Worker[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, 'workers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const workers = snapshot.docs.map((d) => d.data() as Worker);
      callback(workers);
    },
    (err) => {
      console.warn('Workers live subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to real-time updates for a single worker.
 */
export function subscribeWorkerById(
  workerId: string,
  callback: (worker: Worker | null) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, 'workers', workerId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Worker);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn(`Live worker subscription error for ${workerId}:`, err);
      if (onError) onError(err);
    }
  );
}

// ---------------------------------------------------------------------------
// Unified Service Object Export
// ---------------------------------------------------------------------------

export const dbService = {
  // Service Catalogs
  getPricingConfig,
  updatePricingConfig,
  subscribePricingConfig,
  getSpecificPackages,
  getCleaningAddons,
  getServiceCatalogs,
  getServiceCatalog,
  fetchServiceCatalogs,
  subscribeServiceCatalogs,
  seedServiceCatalogsIfEmpty,

  // Bookings
  createBooking,
  createNewBooking,
  getBookingById,
  getBookings,
  subscribeBookings,
  subscribeBookingById,
  updateBooking,
  updateBookingStatus,
  updateJobStatus,
  updateBookingScopeTasks,
  addBookingBeforePhoto,
  addBookingAfterPhoto,

  // Workers
  updateWorkerStatus,
  updateWorkerLocation,
  assignWorkerToBooking,
  getWorkers,
  getWorkerById,
  subscribeWorkers,
  subscribeWorkerById,
};

export default dbService;
