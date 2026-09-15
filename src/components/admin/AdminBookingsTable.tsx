import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
import { updateJobStatus } from '../../lib/db';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Zap,
  Radio,
} from 'lucide-react';

export const AdminBookingsTable: React.FC = () => {
  const { bookings, updateBookingStatus, reassignWorker, workers, showToast, logActivity } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const filtered = (bookings || []).filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (zoneFilter !== 'all' && b.customerAddress?.zone !== zoneFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = (b.id || '').toLowerCase().includes(q);
      const matchCust = (b.customerName || '').toLowerCase().includes(q);
      const matchLoc = (b.customerAddress?.locality || '').toLowerCase().includes(q);
      const matchWorker = (b.workerName || '').toLowerCase().includes(q);
      const matchService = (b.serviceTitle || '').toLowerCase().includes(q);
      return matchId || matchCust || matchLoc || matchWorker || matchService;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-base text-[#12222E]">Master Bookings Dispatch</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
            {filtered.length} Bookings
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Real-Time Sync
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, customer, locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F] w-48 sm:w-60"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="worker_assigned">Worker Assigned</option>
            <option value="en_route">En Route</option>
            <option value="job_started">Job Started</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
          >
            <option value="all">All Mumbai Zones</option>
            <option value="Bandra-Khar">Bandra-Khar</option>
            <option value="South Mumbai">South Mumbai</option>
            <option value="Western Suburbs">Western Suburbs</option>
            <option value="Powai-Central">Powai-Central</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Booking ID</th>
              <th className="py-3.5 px-4">Client</th>
              <th className="py-3.5 px-4">Service & Spec</th>
              <th className="py-3.5 px-4">Slot & Locality</th>
              <th className="py-3.5 px-4">Assigned Partner</th>
              <th className="py-3.5 px-4">Value & Status</th>
              <th className="py-3.5 px-4">Dispatch Progress</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50/70 transition">
                {/* ID */}
                <td className="py-3.5 px-4 font-mono font-bold text-[#12222E]">
                  <div className="flex items-center gap-1">
                    <span>#{b.id}</span>
                    {b.isUrgent && (
                      <span className="text-amber-500" title="Urgent 90-min dispatch">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Customer */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-gray-900">{b.customerName}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{b.customerPhone}</div>
                </td>

                {/* Service */}
                <td className="py-3.5 px-4 max-w-[200px]">
                  <div className="font-bold text-[#12222E] truncate">{b.serviceTitle}</div>
                  <div className="text-[11px] text-gray-500 truncate">{b.configurationSummary}</div>
                </td>

                {/* Slot & Location */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-gray-900">
                    {b.customerAddress.locality} ({b.customerAddress.zone})
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {b.date} · {b.timeSlot}
                  </div>
                </td>

                {/* Assigned Partner (with instant reassign dropdown) */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    {b.workerPhoto ? (
                      <img
                        src={b.workerPhoto}
                        alt="Worker"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
                        ?
                      </div>
                    )}

                    <select
                      value={b.workerId || ''}
                      onChange={async (e) => {
                        const targetWorker = workers.find((w) => w.id === e.target.value);
                        if (targetWorker) {
                          // 1. Reassign in context and database
                          reassignWorker(b.id, targetWorker);

                          // 2. Call updateJobStatus helper for real-time status tracking in Firestore
                          const newStatus: BookingStatus = b.status === 'confirmed' ? 'worker_assigned' : b.status;
                          try {
                            await updateJobStatus(b.id, newStatus, {
                              statusTimestamps: {
                                ...b.statusTimestamps,
                                worker_assigned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              },
                            });
                          } catch (err) {
                            console.warn('Error updating job status for partner assignment:', err);
                          }

                          // 3. Auto-update the activity log
                          logActivity(
                            `Partner ${targetWorker.name} assigned to ${b.serviceTitle} (#${b.id}) at ${b.customerAddress?.locality || 'Mumbai Hub'}`,
                            b.id,
                            targetWorker.id
                          );
                          showToast(`Partner ${targetWorker.name} assigned to Job #${b.id}`);
                        }
                      }}
                      className="text-xs font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer max-w-[120px] truncate"
                    >
                      <option value="">Unassigned</option>
                      {(workers || []).map((w) => {
                        const loc = w.locality || w.currentLocation?.locality || w.zone || 'Mumbai';
                        return (
                          <option key={w.id} value={w.id}>
                            {w.name} ({loc.split(' ')[0]})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </td>

                {/* Total & Payment */}
                <td className="py-3.5 px-4">
                  <div className="font-black text-[#12222E]">
                    ₹{b.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {b.paymentStatus}
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={b.status} size="sm" />
                </td>

                {/* Action Buttons */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {b.status !== 'completed' && b.status !== 'cancelled' ? (
                      <>
                        <button
                          onClick={async () => {
                            const nextMap: Record<BookingStatus, BookingStatus> = {
                              confirmed: 'worker_assigned',
                              worker_assigned: 'en_route',
                              en_route: 'job_started',
                              job_started: 'completed',
                              completed: 'completed',
                              cancelled: 'cancelled',
                            };
                            const nextStatus = nextMap[b.status];
                            try {
                              // Use Firestore updateJobStatus helper to allow real-time status tracking
                              await updateJobStatus(b.id, nextStatus, {
                                etaMinutes: nextStatus === 'en_route' ? 12 : 0,
                                statusTimestamps: {
                                  ...b.statusTimestamps,
                                  [nextStatus]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                },
                              });
                            } catch (err) {
                              console.warn('Error calling updateJobStatus:', err);
                            }
                            updateBookingStatus(b.id, nextStatus);
                            logActivity(
                              `Job #${b.id} transitioned to "${nextStatus.replace(/_/g, ' ').toUpperCase()}" · Real-time tracking updated`,
                              b.id,
                              b.workerId
                            );
                            showToast(`Job #${b.id} transitioned to ${nextStatus.replace(/_/g, ' ')}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#12222E] hover:text-white font-bold text-[11px] transition"
                        >
                          Next Step
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateJobStatus(b.id, 'cancelled');
                            } catch (err) {
                              console.warn('Error calling updateJobStatus on cancel:', err);
                            }
                            updateBookingStatus(b.id, 'cancelled');
                            logActivity(`Booking #${b.id} cancelled by Admin Console Dispatch`, b.id);
                            showToast(`Booking #${b.id} cancelled`);
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-400">Archived</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
