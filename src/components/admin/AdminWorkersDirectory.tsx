import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Worker } from '../../types';
import {
  Users,
  Search,
  Star,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Power,
  DollarSign,
  Briefcase,
} from 'lucide-react';

export const AdminWorkersDirectory: React.FC = () => {
  const { workers, toggleWorkerOnline, bookings, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  const filtered = (workers || []).filter((w) => {
    const loc = w.locality || w.currentLocation?.locality || w.zone || '';
    const role = w.role || w.specialties?.[0] || '';
    if (zoneFilter !== 'all' && !loc.includes(zoneFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (w.name || '').toLowerCase().includes(q) ||
        loc.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q) ||
        (w.phone || '').includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden font-sans">
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-base text-[#12222E]">
            Mumbai Fleet & Partner Operations Directory
          </h3>
          <p className="text-xs text-gray-500">
            Certified space organizers and deep cleaning specialists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search pro name or zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#FF5A5F]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
              <th className="py-3 px-4">Partner Profile</th>
              <th className="py-3 px-4">Role & Specialization</th>
              <th className="py-3 px-4">Base Zone</th>
              <th className="py-3 px-4">Rating & Jobs</th>
              <th className="py-3 px-4">Today's Earnings</th>
              <th className="py-3 px-4">Fleet Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {(filtered || []).map((w) => {
              const activeJob = (bookings || []).find(
                (b) =>
                  b.workerId === w.id &&
                  (b.status === 'en_route' || b.status === 'job_started')
              );
              const photo = w.photo || w.avatar;
              const locality = w.locality || w.currentLocation?.locality || w.zone || 'Mumbai';
              const role = w.role || w.specialties?.[0] || 'Senior Partner';
              const isOnline = w.isOnline !== undefined ? w.isOnline : w.status !== 'offline';
              const totalJobs = w.totalJobsCompleted || w.jobsCompleted || 0;

              return (
                <tr key={w.id} className="hover:bg-gray-50/70 transition">
                  {/* Profile */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={photo}
                          alt={w.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100 shadow-xs"
                        />
                        <span
                          className={`w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-white ${
                            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        ></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#12222E]">{w.name}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono">{w.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{role}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      {(w.specialties || []).join(', ')}
                    </div>
                  </td>

                  {/* Locality */}
                  <td className="py-3.5 px-4 font-semibold text-gray-800">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF5A5F]" />
                      <span>{locality}</span>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-extrabold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{w.rating}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{totalJobs} jobs</span>
                  </td>

                  {/* Earnings */}
                  <td className="py-3.5 px-4">
                    <span className="font-black text-[#12222E]">
                      ₹{(w.earnings?.today || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-emerald-600">
                      ₹{(w.earnings?.thisWeek || 0).toLocaleString('en-IN')} this wk
                    </span>
                  </td>

                  {/* Status & Active job */}
                  <td className="py-3.5 px-4">
                    {activeJob ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center gap-1 max-w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                        <span>Job #{activeJob.id}</span>
                      </span>
                    ) : isOnline ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Idle / Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold text-[10px]">
                        Offline
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleWorkerOnline(w.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        isOnline
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isOnline ? 'Set Offline' : 'Set Online'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
