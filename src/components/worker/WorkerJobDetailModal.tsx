import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WorkerCameraModal } from './WorkerCameraModal';
import confetti from 'canvas-confetti';
import {
  X,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CheckSquare,
  Square,
  Camera,
  Plus,
  Receipt,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  QrCode,
  Sparkles,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  CloudUpload,
} from 'lucide-react';

interface WorkerJobDetailModalProps {
  bookingId: string;
  onClose: () => void;
}

export const WorkerJobDetailModal: React.FC<WorkerJobDetailModalProps> = ({
  bookingId,
  onClose,
}) => {
  const {
    bookings,
    updateBookingStatus,
    addExpenseToBooking,
    selectedWorker,
    showToast,
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;

  // Checklist items
  const [checklist, setChecklist] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: '1', label: 'Inspect area with client & photograph pre-existing wear', checked: true },
    { id: '2', label: 'Set up ChakaChak floor mats & specialized equipment', checked: true },
    { id: '3', label: 'Categorize contents into Keep, Archive & Donate piles', checked: booking.status === 'job_started' || booking.status === 'completed' },
    { id: '4', label: 'Apply eco-friendly descaling & wipe down all interior shelves', checked: booking.status === 'completed' },
    { id: '5', label: 'Fold with vertical ranger technique & label drawers', checked: booking.status === 'completed' },
    { id: '6', label: 'Final client walkthrough & satisfaction sign-off', checked: booking.status === 'completed' },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Add extra expense / material purchased state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Real-time Before & After Photos from booking or defaults
  const [beforePhotos, setBeforePhotos] = useState<string[]>(
    booking.beforePhotos && booking.beforePhotos.length > 0
      ? booking.beforePhotos
      : ['https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=400&q=80']
  );
  const [afterPhotos, setAfterPhotos] = useState<string[]>(
    booking.afterPhotos && booking.afterPhotos.length > 0
      ? booking.afterPhotos
      : booking.status === 'completed'
      ? ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80']
      : []
  );

  // Partner Camera Modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraCategory, setCameraCategory] = useState<'before' | 'after'>('before');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(expenseAmount, 10);
    if (!expenseTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter valid item name and amount');
      return;
    }

    addExpenseToBooking(booking.id, {
      title: expenseTitle,
      amount: parsedAmount,
      receiptPhotoUrl:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setShowAddExpense(false);
  };

  const handleAdvanceStatus = () => {
    if (booking.status === 'confirmed' || booking.status === 'worker_assigned') {
      updateBookingStatus(booking.id, 'en_route');
    } else if (booking.status === 'en_route') {
      updateBookingStatus(booking.id, 'job_started');
    } else if (booking.status === 'job_started') {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#10B981', '#FF5A5F', '#12222E'],
        });
      } catch (e) {}
      setAfterPhotos([
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
      ]);
      updateBookingStatus(booking.id, 'completed');
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#FF5A5F] transition flex items-center gap-1 shrink-0"
              title="Back to Jobs"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-500">
                  Job #{booking.id}
                </span>
                <StatusBadge status={booking.status} size="sm" />
                {booking.isUrgent && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    ⚡ 90-MIN RAPID
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#12222E] mt-0.5">
                {booking.serviceTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Job Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Customer Location & Quick Contact Card */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Client & Location
                </span>
                <h4 className="font-bold text-sm text-[#12222E] mt-0.5">
                  {booking.customerName}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {booking.customerAddress.flat}, {booking.customerAddress.building}
                </p>
                <p className="text-xs text-gray-500">
                  {booking.customerAddress.street}, {booking.customerAddress.locality} (
                  {booking.customerAddress.zone})
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => showToast(`Dialing client: ${booking.customerPhone}`)}
                  className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition shadow-sm"
                  title="Call Client"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    showToast(
                      `Opening GPS Navigation to ${booking.customerAddress.locality}, Mumbai`
                    )
                  }
                  className="p-2.5 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm"
                  title="Navigate GPS"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{booking.date} · {booking.timeSlot}</span>
              </span>
              <span className="font-semibold text-gray-800">
                {booking.configurationSummary}
              </span>
            </div>
          </div>

          {/* Payment & Settlement Summary */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="font-bold text-gray-700 uppercase text-[10px]">
                Payment Status
              </span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {booking.paymentStatus} ({booking.paymentMethod})
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Booking Value:</span>
              <span className="font-bold text-[#12222E]">
                ₹{booking.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Advance Collected:</span>
              <span className="font-bold text-emerald-600">
                ₹{booking.amountPaid.toLocaleString('en-IN')}
              </span>
            </div>
            {booking.balanceDue > 0 && (
              <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200 text-amber-800 font-extrabold">
                <span>To Collect Upon Handover:</span>
                <span className="text-sm font-black">
                  ₹{booking.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Quality & Execution Checklist */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase">
                Pro Service Checklist
              </span>
              <span className="text-[11px] text-gray-400 font-semibold">
                {checklist.filter((c) => c.checked).length} of {checklist.length} done
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition text-xs"
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`leading-tight ${
                      item.checked ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Before & After Transformation Photos (Firebase Storage Enabled) */}
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#FF5A5F]" />
                  <span>Inspection & Completion Photos</span>
                </span>
                <p className="text-[10px] text-gray-400 dark:text-slate-400">
                  Real-time photo verification saved to Firebase Storage
                </p>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-semibold">
                Cloud Sync Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Before Service Photos Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase">
                    Before Service ({beforePhotos.length})
                  </span>
                </div>

                {beforePhotos.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="relative h-28 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-2xs group">
                      <img
                        src={beforePhotos[beforePhotos.length - 1]}
                        alt="Before Service Proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Pre-Work Proof</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraCategory('before');
                        setIsCameraModalOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#FFF5F6] dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-[#FF5A5F] text-[11px] font-bold flex items-center justify-center gap-1.5 border border-gray-200 dark:border-slate-700 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#FF5A5F]" />
                      <span>Take Another Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCameraCategory('before');
                      setIsCameraModalOpen(true);
                    }}
                    className="h-28 w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-[#FF5A5F] dark:hover:border-[#FF5A5F] flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 hover:text-[#FF5A5F] transition text-center p-2 bg-gray-50/50 dark:bg-slate-800/40"
                  >
                    <Camera className="w-5 h-5 mb-1 text-[#FF5A5F]" />
                    <span className="text-[11px] font-bold">Snap Before Photo</span>
                    <span className="text-[9px] text-gray-400">Client check-in</span>
                  </button>
                )}
              </div>

              {/* After Handover Photos Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase">
                    After Handover ({afterPhotos.length})
                  </span>
                </div>

                {afterPhotos.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="relative h-28 rounded-xl overflow-hidden border border-emerald-400/80 dark:border-emerald-600 shadow-2xs group">
                      <img
                        src={afterPhotos[afterPhotos.length - 1]}
                        alt="After Service Proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span>Completed Handover</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraCategory('after');
                        setIsCameraModalOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Take Another Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCameraCategory('after');
                      setIsCameraModalOpen(true);
                    }}
                    className="h-28 w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 hover:text-emerald-600 transition text-center p-2 bg-gray-50/50 dark:bg-slate-800/40"
                  >
                    <Camera className="w-5 h-5 mb-1 text-emerald-500" />
                    <span className="text-[11px] font-bold">Snap After Photo</span>
                    <span className="text-[9px] text-gray-400">Save to Storage</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Extra Materials / Add-on Expense Section */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-700 uppercase">
                  Extra Materials & Organizers
                </span>
                <p className="text-[10px] text-gray-400">
                  Bought on client request (added directly to invoice)
                </p>
              </div>
              <button
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Existing expenses */}
            {booking.attachedExpenses.length > 0 ? (
              <div className="space-y-2">
                {booking.attachedExpenses.map((exp, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-900">{exp.title}</span>
                      <span className="block text-[10px] text-gray-500">
                        Added at {exp.addedAt} · Bill attached
                      </span>
                    </div>
                    <span className="font-extrabold text-amber-900">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">No extra supplies billed.</p>
            )}

            {/* Add Expense Form */}
            {showAddExpense && (
              <form
                onSubmit={handleAddExpense}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs"
              >
                <input
                  type="text"
                  placeholder="Item name (e.g. 4x Acrylic Shelf Bins)"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => showToast('Receipt image simulated & attached')}
                    className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="px-3 py-1.5 text-gray-500 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#12222E] text-white font-bold"
                  >
                    Save & Bill
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Step</span>
            <span className="font-extrabold text-xs sm:text-sm text-[#12222E] capitalize">
              {booking.status.replace('_', ' ')}
            </span>
          </div>

          {booking.status === 'completed' ? (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Job Completed & Handed Over</span>
            </div>
          ) : (
            <button
              onClick={handleAdvanceStatus}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg shadow-[#FF5A5F]/20 transition active:scale-98"
            >
              {booking.status === 'confirmed' || booking.status === 'worker_assigned'
                ? 'Swipe: Start En Route 🛵'
                : booking.status === 'en_route'
                ? 'Arrived: Start Service 🛠️'
                : 'Complete & Collect Balance ✅'}
            </button>
          )}
        </div>
      </div>

      {/* Embedded Partner Service Camera Modal with Firebase Storage */}
      <WorkerCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        defaultBookingId={booking.id}
        defaultCategory={cameraCategory}
        onPhotoSaved={(photoUrl, category) => {
          if (category === 'before') {
            setBeforePhotos((prev) => [...prev, photoUrl]);
          } else {
            setAfterPhotos((prev) => [...prev, photoUrl]);
          }
        }}
      />
    </div>
  );
};
