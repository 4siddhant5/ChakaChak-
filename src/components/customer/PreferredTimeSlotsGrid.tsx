import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import {
  Clock,
  Calendar,
  Zap,
  Check,
  Flame,
  AlertCircle,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface TimeSlotOption {
  id: string;
  title: string;
  timeRange: string;
  period: 'morning' | 'afternoon' | 'evening';
  badge?: string;
  description: string;
  crewType: string;
  baseCapacity: number;
}

export const STANDARD_TIME_SLOTS: TimeSlotOption[] = [
  {
    id: '08:30 AM - 12:30 PM',
    title: 'Morning Prime',
    timeRange: '08:30 AM - 12:30 PM',
    period: 'morning',
    badge: 'Best for Day Airing',
    description: 'Natural daylight for inspection & fast natural surface drying.',
    crewType: '2-3 Senior Pros · HEPA Scrubbers',
    baseCapacity: 3,
  },
  {
    id: '11:30 AM - 03:30 PM',
    title: 'Mid-Day Window',
    timeRange: '11:30 AM - 03:30 PM',
    period: 'afternoon',
    badge: 'Handover Choice',
    description: 'Optimized for unoccupied homes & comprehensive kitchen restoration.',
    crewType: '2-4 Verified Pros · Italian Buffing',
    baseCapacity: 3,
  },
  {
    id: '02:30 PM - 06:30 PM',
    title: 'Afternoon Peak',
    timeRange: '02:30 PM - 06:30 PM',
    period: 'afternoon',
    badge: 'Most Popular',
    description: 'Top requested window across Bandra, Worli, Powai & Juhu apartments.',
    crewType: '3-4 Certified Pros · Steam Wash',
    baseCapacity: 4,
  },
  {
    id: '05:00 PM - 08:30 PM',
    title: 'Twilight Express',
    timeRange: '05:00 PM - 08:30 PM',
    period: 'evening',
    badge: 'Post-Work Turnaround',
    description: 'Whisper-quiet low-noise machinery, completed before family dinner.',
    crewType: '2-3 Rapid Partners · Microfiber Care',
    baseCapacity: 3,
  },
];

export interface PreferredTimeSlotsGridProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  isUrgent?: boolean;
  onToggleUrgent?: (urgent: boolean) => void;
  urgentSurcharge?: number;
  className?: string;
  showUrgentOption?: boolean;
}

export function isBookingMatchingDate(bookingDate: string | undefined, targetDate: string): boolean {
  if (!bookingDate || !targetDate) return false;
  const b = bookingDate.toLowerCase().trim();
  const t = targetDate.toLowerCase().trim();

  if (b === t) return true;

  if (t.startsWith('today') && b.includes('today')) return true;
  if (t.startsWith('tomorrow') && b.includes('tomorrow')) return true;

  // Days of week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const day of days) {
    if (t.includes(day) && b.includes(day)) return true;
  }

  // Month date like "15 sep"
  const dateMatch = t.match(/\d{1,2}\s+[a-z]{3}/);
  if (dateMatch && b.includes(dateMatch[0])) return true;

  return false;
}

export function isBookingMatchingSlot(bookingSlot: string | undefined, slotId: string): boolean {
  if (!bookingSlot || !slotId) return false;
  const b = bookingSlot.toLowerCase().trim();
  const s = slotId.toLowerCase().trim();

  if (b === s) return true;

  const slotStart = s.split('-')[0].trim();
  if (b.includes(slotStart)) return true;

  // Mock overlap compatibility
  if (b.includes('10:00 am') && (s.includes('08:30 am') || s.includes('11:30 am'))) return true;
  if (b.includes('11:00 am') && s.includes('11:30 am')) return true;

  return false;
}

export const PreferredTimeSlotsGrid: React.FC<PreferredTimeSlotsGridProps> = ({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  isUrgent = false,
  onToggleUrgent,
  urgentSurcharge = 299,
  className = '',
  showUrgentOption = true,
}) => {
  const { bookings, workers } = useApp();

  // Generate dynamic date tabs
  const dateOptions = useMemo(() => {
    const today = new Date();
    const result = [];

    // Today
    const todayName = today.toLocaleDateString('en-IN', { weekday: 'short' });
    const todayDate = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    result.push({
      key: 'Today',
      label: 'Today',
      sublabel: `${todayName}, ${todayDate}`,
      fullDisplay: `Today (${todayName})`,
    });

    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomName = tomorrow.toLocaleDateString('en-IN', { weekday: 'short' });
    const tomDate = tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    result.push({
      key: 'Tomorrow',
      label: 'Tomorrow',
      sublabel: `${tomName}, ${tomDate}`,
      fullDisplay: `Tomorrow (${tomName})`,
    });

    // Day 3
    const day3 = new Date(today);
    day3.setDate(today.getDate() + 2);
    const day3Name = day3.toLocaleDateString('en-IN', { weekday: 'short' });
    const day3Date = day3.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    result.push({
      key: `${day3Name}, ${day3Date}`,
      label: day3Name,
      sublabel: day3Date,
      fullDisplay: `${day3Name}, ${day3Date}`,
    });

    // Day 4
    const day4 = new Date(today);
    day4.setDate(today.getDate() + 3);
    const day4Name = day4.toLocaleDateString('en-IN', { weekday: 'short' });
    const day4Date = day4.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    result.push({
      key: `${day4Name}, ${day4Date}`,
      label: day4Name,
      sublabel: day4Date,
      fullDisplay: `${day4Name}, ${day4Date}`,
    });

    return result;
  }, []);

  // Compute live availability per slot against current Firestore bookings in real-time
  const slotAvailabilityMap = useMemo(() => {
    const map: Record<
      string,
      {
        bookedCount: number;
        totalCapacity: number;
        remaining: number;
        isSoldOut: boolean;
        isFillingFast: boolean;
        isAvailable: boolean;
        activeBookings: Booking[];
      }
    > = {};

    STANDARD_TIME_SLOTS.forEach((slot) => {
      const activeForSlot = bookings.filter((b) => {
        if (b.status === 'cancelled') return false;
        const dateMatches = isBookingMatchingDate(b.date, selectedDate);
        if (!dateMatches) return false;
        return isBookingMatchingSlot(b.timeSlot, slot.id);
      });

      const bookedCount = activeForSlot.length;
      const totalCapacity = slot.baseCapacity;
      const remaining = Math.max(0, totalCapacity - bookedCount);

      map[slot.id] = {
        bookedCount,
        totalCapacity,
        remaining,
        isSoldOut: remaining === 0,
        isFillingFast: remaining === 1,
        isAvailable: remaining > 1,
        activeBookings: activeForSlot,
      };
    });

    return map;
  }, [bookings, selectedDate]);

  // Overall active bookings count for the selected date
  const totalBookedOnDate = useMemo(() => {
    return bookings.filter(
      (b) => b.status !== 'cancelled' && isBookingMatchingDate(b.date, selectedDate)
    ).length;
  }, [bookings, selectedDate]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header with Live Firestore Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF5F6] dark:bg-rose-950/40 border border-[#FF5A5F]/20 flex items-center justify-center text-[#FF5A5F]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#12222E] dark:text-white">
              Preferred Arrival Time Slot
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Cross-referenced in real-time with Mumbai active pro dispatch
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Firestore Sync</span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-gray-400 dark:text-slate-500 font-medium">
            {totalBookedOnDate} active jobs on {selectedDate}
          </span>
        </div>
      </div>

      {/* Urgent 90-Min Dispatch Option Banner */}
      {showUrgentOption && onToggleUrgent && (
        <div
          onClick={() => onToggleUrgent(!isUrgent)}
          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
            isUrgent
              ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 shadow-xs'
              : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                isUrgent ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-slate-100">
                  Urgent 90-Min Rapid Pro Dispatch
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
                  +₹{urgentSurcharge}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {isUrgent
                  ? 'Active: Nearest verified senior partner departs within 15 minutes.'
                  : 'Need immediate crew? Bypass window schedule for emergency clean.'}
              </p>
            </div>
          </div>

          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
              isUrgent ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300 dark:border-slate-600'
            }`}
          >
            {isUrgent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      )}

      {/* When Urgent is active, slot selection is bypassed */}
      {isUrgent ? (
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Priority Rapid Dispatch Confirmed:</span> An available
            senior partner within your Mumbai zone will be assigned immediately upon checkout. You
            can tap the banner above anytime to switch back to scheduled time slots.
          </div>
        </div>
      ) : (
        <>
          {/* Preferred Date Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                <span>Select Service Date</span>
              </label>
              <span className="text-[11px] text-gray-400 dark:text-slate-500">Next available dates</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dateOptions.map((d) => {
                const isSelected =
                  selectedDate === d.key ||
                  (d.key === 'Today' && selectedDate.toLowerCase().includes('today')) ||
                  (d.key === 'Tomorrow' && selectedDate.toLowerCase().includes('tomorrow'));

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => onSelectDate(d.key)}
                    className={`py-2.5 px-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-[#FF5A5F] bg-[#FFF5F6] dark:bg-rose-950/40 text-[#12222E] dark:text-white shadow-xs'
                        : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{d.label}</span>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#FF5A5F]" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">{d.sublabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid with Real-Time Availability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                <span>Available Arrival Windows ({selectedDate})</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Fleet Capacity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STANDARD_TIME_SLOTS.map((slot) => {
                const avail = slotAvailabilityMap[slot.id] || {
                  bookedCount: 0,
                  totalCapacity: slot.baseCapacity,
                  remaining: slot.baseCapacity,
                  isSoldOut: false,
                  isFillingFast: false,
                  isAvailable: true,
                  activeBookings: [],
                };

                const isSelected = selectedSlot === slot.id;

                return (
                  <div
                    key={slot.id}
                    onClick={() => {
                      if (!avail.isSoldOut) {
                        onSelectSlot(slot.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                      avail.isSoldOut
                        ? 'bg-gray-50/80 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 opacity-70 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#FFF5F6] dark:bg-rose-950/30 border-2 border-[#FF5A5F] shadow-xs cursor-pointer'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    {/* Top row: Title, Time & Live Availability Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#12222E] dark:text-white">
                              {slot.timeRange}
                            </span>
                            {slot.badge && !avail.isSoldOut && (
                              <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                                {slot.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
                            {slot.title}
                          </span>
                        </div>

                        {/* Real-time Availability Pill */}
                        <div className="shrink-0">
                          {avail.isSoldOut ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Fully Booked
                            </span>
                          ) : avail.isFillingFast ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Flame className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              1 Team Left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              {avail.remaining} Teams Free
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                        {slot.description}
                      </p>
                    </div>

                    {/* Bottom row: Crew allocation + Selection check */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                        <Users className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                        <span>{slot.crewType}</span>
                      </div>

                      {avail.isSoldOut ? (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                          Unavailable
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? 'border-[#FF5A5F] bg-[#FF5A5F] text-white shadow-xs'
                              : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      )}
                    </div>

                    {/* Live Bookings Active Indicator Note */}
                    {avail.bookedCount > 0 && (
                      <div className="mt-2 text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md flex items-center justify-between">
                        <span>Firestore Bookings Today:</span>
                        <span className="font-bold text-gray-600 dark:text-slate-300">
                          {avail.bookedCount} reserved / {avail.totalCapacity} total
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint / Helper text */}
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5A5F]"></span>
              All arrival windows include guaranteed arrival within 30 minutes of scheduled start.
              Live updates reflect instant reservations made across Mumbai.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
