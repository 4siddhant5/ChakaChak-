import React, { useState } from 'react';
import { WorkerDashboard } from './WorkerDashboard';
import { WorkerEarningsView } from './WorkerEarningsView';
import { WorkerPerformanceSummary } from './WorkerPerformanceSummary';
import { HelpSupportChatModal } from '../common/HelpSupportChatModal';
import { useApp } from '../../context/AppContext';
import { Briefcase, Wallet, ShieldCheck, User, Headphones, MessageSquare, ChevronRight, Phone } from 'lucide-react';

export const WorkerApp: React.FC = () => {
  const [workerTab, setWorkerTab] = useState<'jobs' | 'earnings' | 'profile'>('jobs');
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const { selectedWorker } = useApp();

  return (
    <div className="min-h-full w-full bg-[#F8F9FB] flex flex-col relative font-sans">
      <main className="flex-1">
        {workerTab === 'jobs' && <WorkerDashboard />}
        {workerTab === 'earnings' && <WorkerEarningsView />}
        {workerTab === 'profile' && (
          <div className="p-4 sm:p-5 space-y-4 max-w-4xl mx-auto pb-24 animate-fadeIn">
            {/* Partner Header Card */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedWorker?.photo || selectedWorker?.avatar}
                  alt={selectedWorker?.name || 'Partner'}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#FF5A5F]/20"
                />
                <div>
                  <h3 className="font-extrabold text-base text-[#12222E]">
                    {selectedWorker?.name || 'ChakaChak Partner'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedWorker?.role || selectedWorker?.specialties?.[0] || 'Senior Partner'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Police Verified · Aadhar KYC Approved</span>
                  </div>
                </div>
              </div>

              {/* Quick Support Desk Trigger */}
              <button
                type="button"
                onClick={() => setIsSupportChatOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-[#FFF5F6] text-gray-700 hover:text-[#FF5A5F] rounded-2xl text-xs font-bold transition border border-gray-200"
              >
                <Headphones className="w-4 h-4 text-[#FF5A5F]" />
                <span>Fleet Support</span>
              </button>
            </div>

            {/* 30-Day Performance Summary View (Calculated from Firestore) */}
            <WorkerPerformanceSummary worker={selectedWorker} />

            {/* Specialization Badges */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-700">Specialization Badges</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedWorker?.specialties || []).map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Partner Details & Vehicle Information */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2 text-xs text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Fleet Mobile:</span>
                <span className="font-mono font-bold text-gray-900">{selectedWorker?.phone || '+91 98200 00000'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Operating Territory:</span>
                <span className="font-bold text-gray-900">
                  {selectedWorker?.locality || selectedWorker?.currentLocation?.locality || selectedWorker?.zone || 'Mumbai'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Vehicle Registered:</span>
                <span className="font-mono font-bold text-gray-900">Honda Activa 6G (MH-02-EE-8820)</span>
              </div>
            </div>

            {/* Fleet Dispatch Help & Support Action Row */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
              <button
                type="button"
                onClick={() => setIsSupportChatOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#FF5A5F] flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#12222E] group-hover:text-[#FF5A5F] transition">
                      Live Fleet Dispatch Support
                    </h4>
                    <p className="text-xs text-gray-500">
                      Report gate clearance, traffic delays or kit refills
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Fleet Support Trigger Button */}
      <button
        type="button"
        onClick={() => setIsSupportChatOpen(true)}
        className="fixed bottom-16 right-4 z-40 p-3 bg-gradient-to-tr from-[#12222E] to-[#1C3345] text-white rounded-2xl shadow-xl hover:shadow-2xl border border-gray-700/60 flex items-center gap-2 group transition active:scale-95"
        title="Fleet Dispatch Desk"
        aria-label="Fleet Dispatch Support Chat"
      >
        <div className="relative">
          <Headphones className="w-5 h-5 text-[#FF5A5F] group-hover:scale-110 transition-transform" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
        </div>
        <span className="text-xs font-extrabold pr-1 hidden sm:inline text-white">
          Dispatch Support
        </span>
      </button>

      {/* Real-Time Firestore Help & Support Chat Overlay */}
      <HelpSupportChatModal
        isOpen={isSupportChatOpen}
        onClose={() => setIsSupportChatOpen(false)}
        role="worker"
        currentUserId={selectedWorker?.id || 'w-101'}
        currentUserName={selectedWorker?.name || 'Ramesh Sawant'}
      />

      {/* Partner Mobile Bottom Navigation Bar */}
      <nav className="sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-2 shadow-lg flex items-center justify-around select-none mt-auto">
        <button
          onClick={() => setWorkerTab('jobs')}
          className={`flex flex-col items-center gap-1 ${
            workerTab === 'jobs' ? 'text-[#FF5A5F]' : 'text-gray-500'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-bold">Job Queue</span>
        </button>

        <button
          onClick={() => setWorkerTab('earnings')}
          className={`flex flex-col items-center gap-1 ${
            workerTab === 'earnings' ? 'text-[#FF5A5F]' : 'text-gray-500'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold">Earnings</span>
        </button>

        <button
          onClick={() => setWorkerTab('profile')}
          className={`flex flex-col items-center gap-1 ${
            workerTab === 'profile' ? 'text-[#FF5A5F]' : 'text-gray-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Partner ID</span>
        </button>
      </nav>
    </div>
  );
};
