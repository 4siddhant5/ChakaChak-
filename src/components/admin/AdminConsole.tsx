import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { AdminDashboard } from './AdminDashboard';
import { AdminBookingsTable } from './AdminBookingsTable';
import { AdminPricingManager } from './AdminPricingManager';
import { AdminWorkersDirectory } from './AdminWorkersDirectory';
import { AdminCouponsManager } from './AdminCouponsManager';
import {
  LayoutDashboard,
  CalendarCheck2,
  Tags,
  Users,
  Percent,
  MapPin,
  Bell,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'bookings' | 'pricing' | 'workers' | 'coupons'
  >('dashboard');

  const { bookings, workers, setActivePortal } = useApp();
  const { isDark } = useTheme();

  const activeCount = bookings.filter(
    (b) => b.status === 'en_route' || b.status === 'job_started' || b.status === 'worker_assigned'
  ).length;

  return (
    <div className="min-h-full w-full bg-[#F4F6F8] dark:bg-[#0B1320] text-[#12222E] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Console Navigation Bar */}
      <header className="bg-[#12222E] dark:bg-[#0A101D] text-white px-5 py-3.5 flex items-center justify-between shadow-md shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <BrandLogo size="md" light />
          <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-300">
              Mumbai Operations Hub · Bandra HQ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300">
            <span className="text-white">{activeCount}</span> Live Dispatches
          </div>

          <ThemeToggle showLabel size="sm" />

          <button
            onClick={() => setActivePortal('customer')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition"
          >
            <span>Preview Customer App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Main Stage */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside className="w-full md:w-60 bg-white dark:bg-[#0F172A] border-r border-gray-200/80 dark:border-slate-800 p-3 sm:p-4 shrink-0 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto transition-colors">
          <div className="space-y-1 w-full flex md:flex-col gap-1 md:gap-1.5">
            <span className="hidden md:block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500 px-3 py-1">
              Command Center
            </span>

            <button
              onClick={() => setActiveAdminTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                activeAdminTab === 'dashboard'
                  ? 'bg-[#12222E] dark:bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Map</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('bookings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                activeAdminTab === 'bookings'
                  ? 'bg-[#12222E] dark:bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Bookings Dispatch</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('pricing')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                activeAdminTab === 'pricing'
                  ? 'bg-[#12222E] dark:bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Tags className="w-4 h-4" />
              <span>Pricing & Catalogue</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('workers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                activeAdminTab === 'workers'
                  ? 'bg-[#12222E] dark:bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Fleet & Partners</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('coupons')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
                activeAdminTab === 'coupons'
                  ? 'bg-[#12222E] dark:bg-slate-800 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Promos & Coupons</span>
            </button>
          </div>

          <div className="hidden md:block pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>GST Compliance Ready</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                State: Maharashtra (27) · Auto 5% GST on residential services
              </p>
            </div>
          </div>
        </aside>

        {/* Stage Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeAdminTab === 'dashboard' && <AdminDashboard />}
          {activeAdminTab === 'bookings' && <AdminBookingsTable />}
          {activeAdminTab === 'pricing' && <AdminPricingManager />}
          {activeAdminTab === 'workers' && <AdminWorkersDirectory />}
          {activeAdminTab === 'coupons' && <AdminCouponsManager />}
        </main>
      </div>
    </div>
  );
};
