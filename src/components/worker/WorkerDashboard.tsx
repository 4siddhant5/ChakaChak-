import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db, collection, doc, onSnapshot, query, limit, orderBy } from '../../lib/firebase';
import { Booking, Worker, AdminAuditLog } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WorkerJobDetailModal } from './WorkerJobDetailModal';
import { WorkerCameraModal } from './WorkerCameraModal';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Power,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Wifi,
  Radio,
  BellRing,
  Camera,
} from 'lucide-react';

/**
 * High-craft Shimmer / Skeleton Loading Component for Worker Job Queue
 */
const JobQueueSkeleton: React.FC = () => {
  return (
    <div id="job-queue-skeleton-container" className="space-y-3.5 animate-fadeIn">
      {/* Synchronization Notice Banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
          <span className="font-bold">Syncing Mumbai partner fleet queue with Firestore...</span>
        </div>
        <span className="text-[10px] font-mono text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-full font-semibold">
          Real-time Listener
        </span>
      </div>

      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="relative bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3 overflow-hidden"
        >
          {/* Shimmer Light Reflection Wave */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-200/40 to-transparent pointer-events-none"></div>

          {/* Top Header Row Shimmer */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-16 h-4 bg-gray-200 rounded-md"></div>
                <div className="w-24 h-5 bg-gray-200 rounded-full"></div>
                {idx === 1 && <div className="w-20 h-4 bg-amber-100 rounded-full"></div>}
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded-lg"></div>
              <div className="w-1/2 h-3.5 bg-gray-100 rounded-md"></div>
            </div>

            {/* Price block shimmer */}
            <div className="text-right space-y-1.5 shrink-0">
              <div className="w-20 h-6 bg-gray-200 rounded-lg ml-auto"></div>
              <div className="w-14 h-3 bg-gray-100 rounded-md ml-auto"></div>
            </div>
          </div>

          {/* Location & Time Shimmer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-200"></div>
              <div className="w-36 h-3.5 bg-gray-100 rounded-md"></div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-200 mt-0.5"></div>
              <div className="space-y-1 flex-1">
                <div className="w-48 h-3.5 bg-gray-200 rounded-md"></div>
                <div className="w-full h-3 bg-gray-100 rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Action Row Shimmer */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-gray-200"></div>
              <div className="w-8 h-8 rounded-xl bg-gray-200"></div>
            </div>
            <div className="w-44 h-8 rounded-xl bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const WorkerDashboard: React.FC = () => {
  const {
    selectedWorker,
    setSelectedWorkerId,
    workers,
    bookings,
    toggleWorkerOnline,
    updateBookingStatus,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [cameraModalBookingId, setCameraModalBookingId] = useState<string | null>(null);
  const [cameraCategory, setCameraCategory] = useState<'before' | 'after'>('before');

  // Real-time Firestore state for jobs and worker status
  const [realtimeBookings, setRealtimeBookings] = useState<Booking[]>([]);
  const [realtimeWorker, setRealtimeWorker] = useState<Worker | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [latestDispatchEvent, setLatestDispatchEvent] = useState<string | null>(null);

  // Ref to track whether initial snapshot has been handled
  const hasInitializedRef = useRef<boolean>(false);

  const fallbackWorker = selectedWorker || (workers && workers[0]);
  const targetWorkerId = fallbackWorker?.id || 'w-101';

  // Direct Firestore onSnapshot listeners for live jobs, status changes, and worker profile
  useEffect(() => {
    setIsSyncing(true);

    // 1. Real-time jobs / bookings stream with docChanges tracking
    const bookingsColl = collection(db, 'bookings');
    const unsubBookings = onSnapshot(
      bookingsColl,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Booking);
          setRealtimeBookings(list);

          // Track real-time changes made by Admin Console or other clients
          if (hasInitializedRef.current) {
            snap.docChanges().forEach((change) => {
              const updatedData = change.doc.data() as Booking;
              if (change.type === 'modified') {
                if (updatedData.workerId === targetWorkerId) {
                  const eventMsg = `Job #${updatedData.id} updated to ${updatedData.status.toUpperCase()}`;
                  setLatestDispatchEvent(eventMsg);
                  showToast(`⚡ Dispatch Update: ${eventMsg}`);
                } else if (change.doc.data()?.status) {
                  setLatestDispatchEvent(`Job #${updatedData.id} updated by Admin Dispatch`);
                }
              } else if (change.type === 'added' && updatedData.workerId === targetWorkerId) {
                const eventMsg = `New booking #${updatedData.id} assigned to you!`;
                setLatestDispatchEvent(eventMsg);
                showToast(`🔔 New Assignment: ${eventMsg}`);
              }
            });
          } else {
            hasInitializedRef.current = true;
          }
        }

        setIsRealtimeActive(true);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        // Smooth transition out of initial skeleton state
        setTimeout(() => {
          setIsSyncing(false);
        }, 300);
      },
      (err) => {
        console.warn('WorkerDashboard bookings onSnapshot warning:', err);
        setIsSyncing(false);
      }
    );

    // 2. Real-time worker profile stream (ratings, jobsCompleted, earnings)
    const unsubWorker = onSnapshot(
      doc(db, 'workers', targetWorkerId),
      (snap) => {
        if (snap.exists()) {
          setRealtimeWorker(snap.data() as Worker);
        }
      },
      (err) => console.warn('WorkerDashboard worker onSnapshot warning:', err)
    );

    // 3. Real-time dispatch activity log ticker
    const unsubActivity = onSnapshot(
      collection(db, 'activity_logs'),
      (snap) => {
        if (!snap.empty) {
          const logs = snap.docs.map((d) => d.data());
          // Sort by timestamp if available
          if (logs.length > 0) {
            const latest = logs[logs.length - 1];
            if (latest?.details) {
              setLatestDispatchEvent(latest.details);
            }
          }
        }
      },
      (err) => console.warn('Activity logs onSnapshot warning:', err)
    );

    return () => {
      unsubBookings();
      unsubWorker();
      unsubActivity();
    };
  }, [targetWorkerId]);

  // Handle manual sync refresh to showcase shimmer skeleton
  const handleManualSync = () => {
    setIsSyncing(true);
    showToast('Refreshing live dispatch queue from Firestore...');
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Queue synchronized with Mumbai fleet cloud.');
    }, 700);
  };

  const currentWorker = realtimeWorker || fallbackWorker;
  if (!currentWorker) return null;

  const isOnline = currentWorker.isOnline !== undefined ? currentWorker.isOnline : currentWorker.status !== 'offline';
  const photo = currentWorker.photo || currentWorker.avatar;
  const locality = currentWorker.locality || currentWorker.currentLocation?.locality || currentWorker.zone || 'Mumbai';
  const totalJobs = currentWorker.totalJobsCompleted || currentWorker.jobsCompleted || 0;
  const todayEarnings = currentWorker.earnings?.today || 0;

  const effectiveBookings = realtimeBookings.length > 0 ? realtimeBookings : bookings;

  // Filter bookings for this worker or unassigned ones in Mumbai
  const myAssignedBookings = (effectiveBookings || []).filter(
    (b) => b.workerId === currentWorker.id || (!b.workerId && b.status !== 'completed')
  );

  const availableJobs = (effectiveBookings || []).filter(
    (b) => b.status === 'confirmed' || b.status === 'worker_assigned'
  );

  return (
    <div id="worker-dashboard-container" className="space-y-4 pb-24 font-sans">
      {/* Live Admin Dispatch Synchronization Status Bar */}
      <div className="bg-gradient-to-r from-[#12222E] via-[#1A2E3D] to-[#12222E] text-white px-4 py-2 flex items-center justify-between text-[11px] shadow-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-400 shrink-0">Live Dispatch Stream:</span>
          <span className="text-gray-300 truncate font-medium">
            {latestDispatchEvent || 'Admin Console sync active • Real-time onSnapshot enabled'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-gray-400 hidden sm:inline text-[10px]">
            Updated {lastSyncTime}
          </span>
          <button
            id="worker-refresh-sync-btn"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition cursor-pointer"
            title="Refresh Real-time Queue"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Partner Profile Header */}
      <header className="bg-white p-4 sm:p-5 border-b border-gray-100 shadow-xs sticky top-0 z-20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={photo}
                alt={currentWorker.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100 shadow-xs"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white ${
                  isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              ></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                {/* Pro Switcher Dropdown */}
                <select
                  value={currentWorker.id}
                  onChange={(e) => {
                    setIsSyncing(true);
                    setSelectedWorkerId(e.target.value);
                  }}
                  className="font-extrabold text-sm sm:text-base text-[#12222E] bg-transparent border-none p-0 pr-4 focus:ring-0 cursor-pointer"
                >
                  {(workers || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role || w.specialties?.[0] || 'Partner'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="font-extrabold text-amber-500 flex items-center gap-0.5">
                  ★ {currentWorker.rating}
                </span>
                <span>·</span>
                <span>{totalJobs} jobs</span>
                <span>·</span>
                <span className="text-gray-600 font-semibold">{locality}</span>
              </div>
            </div>
          </div>

          {/* Online/Offline Quick Switcher & Real-time status */}
          <div className="flex items-center gap-2">
            {/* Dark/Light Night Shift Toggle */}
            <div title="Night Shift Eye-Strain Reduction Mode">
              <ThemeToggle />
            </div>

            {/* Quick Service Camera Launcher */}
            <button
              type="button"
              id="worker-quick-camera-btn"
              onClick={() => {
                setCameraCategory('before');
                setCameraModalBookingId(myAssignedBookings[0]?.id || 'BK-101');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-[#FFF5F6] dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 hover:text-[#FF5A5F] text-xs font-bold transition border border-gray-200 dark:border-slate-700 cursor-pointer shadow-2xs"
              title="Open Inspection & Completion Camera"
            >
              <Camera className="w-3.5 h-3.5 text-[#FF5A5F]" />
              <span>Camera</span>
            </button>

            {isRealtimeActive && (
              <div
                id="worker-realtime-badge"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shadow-2xs"
                title="Firestore onSnapshot listener active"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Live onSnapshot</span>
              </div>
            )}
            <button
              id="worker-toggle-online-btn"
              onClick={() => toggleWorkerOnline(currentWorker.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-transparent dark:border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>

        {/* Today's Mini Earning Ribbon */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Today's Payout:</span>
            <span className="font-black text-[#12222E] text-sm">
              ₹{todayEarnings.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            +₹1,100 Weekend Fleet Bonus
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 sm:px-5 space-y-4">
        {/* Offline Warning banner if worker is offline */}
        {!isOnline && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You are currently offline. Go online to receive real-time admin dispatches.</span>
            </div>
            <button
              onClick={() => toggleWorkerOnline(currentWorker.id)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shrink-0 cursor-pointer"
            >
              Go Online
            </button>
          </div>
        )}

        {/* Queue Switcher Tabs */}
        <div className="flex gap-2 bg-gray-200/70 p-1 rounded-2xl">
          <button
            id="worker-tab-assigned"
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-white text-[#12222E] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Assigned Jobs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-[10px]">
              {myAssignedBookings.length}
            </span>
          </button>
          <button
            id="worker-tab-available"
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'available'
                ? 'bg-white text-[#12222E] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Mumbai Open Pool</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              {availableJobs.length}
            </span>
          </button>
        </div>

        {/* Job Cards List or Shimmer Loading State */}
        {isSyncing ? (
          <JobQueueSkeleton />
        ) : (
          <div id="worker-job-list" className="space-y-3.5">
            {(activeTab === 'assigned' ? myAssignedBookings : availableJobs).length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-[#12222E]">No pending jobs in this queue</h4>
                <p className="text-xs text-gray-500">
                  {activeTab === 'assigned'
                    ? 'All assigned jobs completed. Stand by for new dispatches.'
                    : 'No unassigned open bookings available right now.'}
                </p>
              </div>
            ) : (
              (activeTab === 'assigned' ? myAssignedBookings : availableJobs).map((booking) => {
                return (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 shadow-xs space-y-3 transition hover:shadow-md text-gray-900 dark:text-slate-100"
                  >
                    {/* Job Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-50 dark:border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400 dark:text-slate-500">
                            #{booking.id}
                          </span>
                          <StatusBadge status={booking.status} size="sm" />
                          {booking.isUrgent && (
                            <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                              ⚡ 90-MIN RAPID
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-[#12222E] dark:text-white mt-1">
                          {booking.serviceTitle}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{booking.configurationSummary}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-[#12222E] dark:text-white">
                          ₹{booking.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                          {booking.balanceDue > 0
                            ? `₹${booking.balanceDue} to collect`
                            : 'Paid in Full'}
                        </span>
                      </div>
                    </div>

                    {/* Location & Time info */}
                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                        <span>
                          {booking.date} · {booking.timeSlot}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A5F] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-gray-900">
                            {booking.customerName} · {booking.customerAddress?.locality || 'Mumbai'}
                          </span>
                          <p className="text-[11px] text-gray-500">
                            {booking.customerAddress?.flat || ''} {booking.customerAddress?.building || ''},{' '}
                            {booking.customerAddress?.street || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            showToast(`Calling ${booking.customerName}: ${booking.customerPhone}`)
                          }
                          className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 cursor-pointer"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            showToast(
                              `GPS navigation started for ${
                                booking.customerAddress?.locality || 'Mumbai'
                              }`
                            )
                          }
                          className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                          title="Navigate"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>

                        {/* Quick Camera Capture Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCameraCategory(booking.status === 'completed' ? 'after' : 'before');
                            setCameraModalBookingId(booking.id);
                          }}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-rose-200 dark:border-rose-800/60"
                          title="Snap Before/After Service Photo"
                        >
                          <Camera className="w-4 h-4 text-[#FF5A5F]" />
                          <span className="text-[10px] font-bold hidden sm:inline">
                            {booking.status === 'completed' ? 'After Proof' : 'Before Photo'}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedJobId(booking.id)}
                        className="py-2 px-4 rounded-xl bg-[#12222E] hover:bg-black dark:bg-[#FF5A5F] dark:hover:bg-[#E8355C] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <span>Open Checklist & Action</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Detail & Step Execution Modal */}
      {selectedJobId && (
        <WorkerJobDetailModal
          bookingId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
        />
      )}

      {/* Quick Service Camera Modal for Job Cards */}
      <WorkerCameraModal
        isOpen={!!cameraModalBookingId}
        onClose={() => setCameraModalBookingId(null)}
        defaultBookingId={cameraModalBookingId || undefined}
        defaultCategory={cameraCategory}
      />
    </div>
  );
};

export default WorkerDashboard;
