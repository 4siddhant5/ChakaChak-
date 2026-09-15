import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminBookingsTable } from './AdminBookingsTable';
import {
  TrendingUp,
  Briefcase,
  Users,
  Star,
  Activity,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, workers, liveActivityLogs } = useApp();

  // Compute live real-time statistics
  const totalRevenue = (bookings || []).reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const activeJobs = (bookings || []).filter(
    (b) => b.status === 'en_route' || b.status === 'job_started' || b.status === 'worker_assigned'
  ).length;
  const enRouteJobs = (bookings || []).filter((b) => b.status === 'en_route').length;

  const onlineWorkers = (workers || []).filter((w) => w.isOnline || w.status !== 'offline').length;
  const assignedWorkers = (workers || []).filter((w) =>
    (bookings || []).some(
      (b) =>
        b.workerId === w.id &&
        (b.status === 'en_route' || b.status === 'job_started')
    )
  ).length;
  const utilizationRate = onlineWorkers > 0 ? Math.round((assignedWorkers / onlineWorkers) * 100) : 85;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top 4 Real-time Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Today's Gross Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#12222E]">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Stat 2: Active Dispatches */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Live Active Dispatches
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#12222E]">
              {activeJobs} Active
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{enRouteJobs} on Mumbai roads right now</span>
            </div>
          </div>
        </div>

        {/* Stat 3: Partner Utilization */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Fleet Utilization
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#12222E]">
              {utilizationRate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {assignedWorkers} of {onlineWorkers} online pros dispatched
            </div>
          </div>
        </div>

        {/* Stat 4: CSAT Rating */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Customer Delight CSAT
            </span>
            <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-yellow-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#12222E]">
              4.88 ★
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Across 384 verified Mumbai reviews
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Live Mumbai Partner Map & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mumbai Live Operations Map (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="font-extrabold text-sm sm:text-base text-[#12222E]">
                Live Mumbai Operations Map
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              South Mumbai to Powai Corridor
            </span>
          </div>

          {/* Stylized SVG Map of Mumbai with live partner pins */}
          <div className="mt-3 h-64 sm:h-72 w-full bg-[#E5E9EC] rounded-2xl relative overflow-hidden">
            <svg
              viewBox="0 0 700 320"
              className="w-full h-full object-cover select-none"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="adminSea" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CBE2EC" />
                  <stop offset="100%" stopColor="#B3D5E5" />
                </linearGradient>
              </defs>

              {/* Arabian Sea */}
              <path d="M 0,0 L 220,0 Q 280,160 210,320 L 0,320 Z" fill="url(#adminSea)" />
              <text x="30" y="160" fill="#759BAE" fontSize="16" fontWeight="700" letterSpacing="4">
                ARABIAN SEA
              </text>

              {/* Landmass */}
              <rect x="210" y="0" width="490" height="320" fill="#EEF2F5" />

              {/* Arteries: Western Express Hwy, Sea Link, Eastern Fwy */}
              <path d="M 280,320 Q 320,180 340,0" fill="none" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M 280,320 Q 320,180 340,0" fill="none" stroke="#CBD5E1" strokeWidth="3" />

              <path d="M 230,240 Q 290,170 330,150" fill="none" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 330,150 L 520,110" fill="none" stroke="#FFFFFF" strokeWidth="8" />

              {/* Key Location Markers */}
              {/* Bandra West */}
              <g transform="translate(280, 160)">
                <circle r="18" fill="#FF5A5F" fillOpacity="0.2" className="animate-ping" />
                <circle r="9" fill="#FF5A5F" />
                <rect x="-35" y="-28" width="70" height="18" rx="9" fill="#12222E" />
                <text x="0" y="-16" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Bandra (6 Pros)
                </text>
              </g>

              {/* Worli / Lower Parel */}
              <g transform="translate(300, 240)">
                <circle r="14" fill="#3B82F6" fillOpacity="0.2" />
                <circle r="7" fill="#3B82F6" />
                <rect x="-35" y="-26" width="70" height="16" rx="8" fill="#12222E" />
                <text x="0" y="-15" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Worli (4 Pros)
                </text>
              </g>

              {/* Powai */}
              <g transform="translate(510, 105)">
                <circle r="16" fill="#10B981" fillOpacity="0.2" />
                <circle r="8" fill="#10B981" />
                <rect x="-35" y="-26" width="70" height="16" rx="8" fill="#12222E" />
                <text x="0" y="-15" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Powai (3 Pros)
                </text>
              </g>

              {/* Juhu */}
              <g transform="translate(320, 95)">
                <circle r="12" fill="#F59E0B" fillOpacity="0.2" />
                <circle r="6" fill="#F59E0B" />
                <rect x="-30" y="-24" width="60" height="16" rx="8" fill="#12222E" />
                <text x="0" y="-13" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Juhu (2 Pros)
                </text>
              </g>
            </svg>

            {/* Bottom floating map stats */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/90 backdrop-blur-md p-2 rounded-xl flex items-center justify-between text-xs font-bold text-gray-700 shadow-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF5A5F]" />
                <span>Active Hub: Bandra West Fulfillment Center</span>
              </span>
              <span className="text-emerald-700">Average ETA: 12 mins</span>
            </div>
          </div>
        </div>

        {/* Live Operations Feed (1 Col) */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-sm sm:text-base text-[#12222E] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF5A5F]" />
              <span>Real-Time Dispatch Feed</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">Live Sync</span>
          </div>

          <div className="mt-3 space-y-3 overflow-y-auto max-h-64 sm:max-h-72 pr-1 text-xs">
            {(liveActivityLogs || []).map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 pb-2.5 border-b border-gray-50 last:border-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                <div className="flex-1">
                  <p className="text-gray-800 leading-snug">{log.message}</p>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Master Bookings Dispatch Table */}
      <AdminBookingsTable />
    </div>
  );
};
