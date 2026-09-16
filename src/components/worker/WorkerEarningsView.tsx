import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkerRevenueGrowthChart } from './WorkerRevenueGrowthChart';
import {
  Wallet,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Download,
  AlertCircle,
} from 'lucide-react';

export const WorkerEarningsView: React.FC = () => {
  const { selectedWorker, showToast } = useApp();
  const { isDark } = useTheme();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawnAmount, setWithdrawnAmount] = useState(0);

  const earnings = selectedWorker?.earnings || {
    today: 4850,
    thisWeek: 24600,
    thisMonth: 94800,
    pendingPayout: 18200,
  };

  const currentAvailableBalance = Math.max(0, earnings.pendingPayout - withdrawnAmount);

  const handleWithdraw = () => {
    if (currentAvailableBalance <= 0) {
      showToast('No pending balance to withdraw');
      return;
    }
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawnAmount((prev) => prev + currentAvailableBalance);
      setWithdrawing(false);
      showToast(
        `₹${currentAvailableBalance.toLocaleString('en-IN')} transferred via IMPS to HDFC Bank (A/C **4892)!`
      );
    }, 1200);
  };

  const payoutHistory = [
    { date: 'Today, 02:30 PM', desc: 'Bandra West Diamond Clean Completion', amount: '₹1,950', status: 'Credited' },
    { date: 'Today, 11:15 AM', desc: 'Pali Hill Modular Kitchen Organizing', amount: '₹1,800', status: 'Credited' },
    { date: 'Today, 09:00 AM', desc: 'Saturday Peak Mumbai Surge Bonus', amount: '₹1,100', status: 'Credited' },
    { date: 'Yesterday', desc: 'Daily settlement to Bank A/C', amount: '₹6,400', status: 'Settled' },
    { date: '11 Sep 2024', desc: '5-Star Customer Tip from Flat 1203', amount: '₹500', status: 'Settled' },
  ];

  return (
    <div className="p-4 sm:p-5 space-y-5 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-tr from-[#12222E] via-[#1C364A] to-[#2B5270] text-white p-5 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Available Partner Payout</span>
          </span>
          <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
            Auto-Settled Daily
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black tracking-tight">
            ₹{currentAvailableBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-gray-300 font-medium">Ready for IMPS</span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-400 uppercase">Linked Bank</span>
            <div className="text-xs font-bold">HDFC Bank · A/C **4892</div>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={withdrawing || currentAvailableBalance === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] text-white text-xs font-black shadow-md hover:opacity-95 disabled:opacity-40 transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{withdrawing ? 'Transferring...' : 'Instant Payout'}</span>
          </button>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#152331] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Today's Earnings</span>
          <div className="text-lg font-black text-[#12222E] dark:text-white mt-1">
            ₹{earnings.today.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">+₹1,100 peak surge</span>
        </div>

        <div className="bg-white dark:bg-[#152331] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">This Week</span>
          <div className="text-lg font-black text-[#12222E] dark:text-white mt-1">
            ₹{earnings.thisWeek.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">18 completed jobs</span>
        </div>

        <div className="bg-white dark:bg-[#152331] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase">This Month</span>
          <div className="text-lg font-black text-[#12222E] dark:text-white mt-1">
            ₹{earnings.thisMonth.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Top 5% Mumbai Earner</span>
        </div>
      </div>

      {/* Recharts Visual Revenue Growth Chart (Past 7 Days from Firestore) */}
      <WorkerRevenueGrowthChart worker={selectedWorker} />

      {/* Partner Quality & Incentive Metrics */}
      <div className="bg-white dark:bg-[#152331] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Quality & Bonus Tier</h3>
          <span className="text-xs font-black text-[#FF5A5F]">Diamond Elite Club</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-base font-black text-gray-900 dark:text-white">4.92 ★</span>
            <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Rating</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-base font-black text-gray-900 dark:text-white">99.4%</span>
            <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">On-Time</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-base font-black text-gray-900 dark:text-white">98%</span>
            <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Acceptance</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-300">Weekend Mumbai Surge Bonus</span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Complete 4 more jobs before Sunday 10 PM to unlock +₹2,000 cash bonus!
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-black flex items-center justify-center shrink-0">
            4/8
          </div>
        </div>
      </div>

      {/* Settlement History */}
      <div className="bg-white dark:bg-[#152331] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Recent Transactions</h3>
          <span className="text-[11px] text-gray-400">Past 48 Hours</span>
        </div>

        <div className="space-y-2.5">
          {payoutHistory.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/60 last:border-0 text-xs"
            >
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{item.desc}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">{item.date}</span>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 dark:text-emerald-400">{item.amount}</span>
                <span className="block text-[9px] text-gray-400 font-semibold">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

