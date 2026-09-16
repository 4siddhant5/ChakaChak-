import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { PortalSwitcher } from './components/common/PortalSwitcher';
import { CustomerApp } from './components/customer/CustomerApp';
import { WorkerApp } from './components/worker/WorkerApp';
import { AdminConsole } from './components/admin/AdminConsole';
import { Smartphone, Monitor, CheckCircle2, Wifi, Battery, Signal } from 'lucide-react';

const PrototypeRoot: React.FC = () => {
  const { activePortal, toastMessage, viewMode, setViewMode } = useApp();
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen w-full flex flex-col relative font-sans transition-colors duration-200 selection:bg-[#FF5A5F] selection:text-white ${
        isDark ? 'bg-[#0B1320] text-slate-100' : 'bg-[#EAEFF5] text-[#12222E]'
      }`}
    >
      {/* Global Interactive Portal Switcher Floating Bar */}
      <PortalSwitcher />

      {/* Main App Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {activePortal === 'admin' ? (
          /* Admin Portal: Full desktop width */
          <div className="w-full flex-1 min-h-screen">
            <AdminConsole />
          </div>
        ) : (
          /* Mobile Portals (Customer or Partner): Rendered in mobile-first responsive viewport */
          <div className="w-full flex-1 flex flex-col items-center justify-center p-0 sm:py-6 sm:px-4">
            {/* Quick viewport mode toggle on larger screens */}
            <div
              className={`hidden sm:flex items-center gap-2 mb-3 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs border text-xs transition-colors ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-white/90 border-gray-200/90 text-gray-600'
              }`}
            >
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}
              >
                Preview:
              </span>
              <button
                onClick={() => setViewMode('frame')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'frame'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-[#12222E] text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Shell</span>
              </button>
              <button
                onClick={() => setViewMode('responsive')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'responsive'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-[#12222E] text-white shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Fluid Container</span>
              </button>
            </div>

            {/* Phone Shell / Fluid Stage */}
            <div
              className={`w-full transition-all duration-300 ${
                viewMode === 'frame'
                  ? isDark
                    ? 'max-w-[420px] min-h-screen sm:min-h-[854px] sm:max-h-[890px] sm:rounded-[48px] sm:border-[10px] sm:border-[#1E293B] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden relative flex flex-col bg-[#0F172A] sm:ring-1 sm:ring-white/10'
                    : 'max-w-[420px] min-h-screen sm:min-h-[854px] sm:max-h-[890px] sm:rounded-[48px] sm:border-[10px] sm:border-[#1E293B] sm:shadow-[0_25px_60px_-15px_rgba(18,34,46,0.35)] overflow-hidden relative flex flex-col bg-[#F8F9FB] sm:ring-1 sm:ring-black/10'
                  : isDark
                  ? 'max-w-2xl min-h-screen sm:min-h-[820px] sm:rounded-3xl sm:shadow-2xl overflow-hidden relative flex flex-col bg-[#0F172A] border border-slate-800'
                  : 'max-w-2xl min-h-screen sm:min-h-[820px] sm:rounded-3xl sm:shadow-xl overflow-hidden relative flex flex-col bg-[#F8F9FB] border border-gray-200'
              }`}
            >
              {/* Realistic iOS-style Status Bar on Mobile Frame Mode */}
              {viewMode === 'frame' && (
                <div
                  className={`hidden sm:flex items-center justify-between px-6 pt-2 pb-1 shrink-0 z-40 border-b select-none transition-colors ${
                    isDark
                      ? 'bg-[#0F172A] border-slate-800/80 text-slate-200'
                      : 'bg-white border-gray-100 text-[#12222E]'
                  }`}
                >
                  {/* Status Bar Left: Time */}
                  <span className="text-[12px] font-extrabold tracking-tight">
                    9:41
                  </span>

                  {/* Dynamic Island Pill with Camera & Sensor */}
                  <div className="w-24 h-4.5 bg-black rounded-full flex items-center justify-end pr-2 gap-1.5 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-[#1E293B]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] border border-blue-900/40"></span>
                  </div>

                  {/* Status Bar Right: Telemetry & Battery */}
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3 stroke-[2.5]" />
                    <Wifi className="w-3 h-3 stroke-[2.5]" />
                    <div className="flex items-center gap-0.5 font-bold text-[10px]">
                      <span>98%</span>
                      <Battery className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport Scroll Area */}
              <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                {activePortal === 'customer' ? <CustomerApp /> : <WorkerApp />}
              </div>

              {/* Bottom Home Indicator Bar (Mobile Frame) */}
              {viewMode === 'frame' && (
                <div
                  className={`hidden sm:flex justify-center pb-1.5 pt-1 shrink-0 z-40 select-none transition-colors ${
                    isDark ? 'bg-[#0F172A]' : 'bg-white'
                  }`}
                >
                  <div className="w-28 h-1 bg-gray-500/60 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#12222E] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 text-xs font-semibold flex items-center gap-2 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <PrototypeRoot />
      </AppProvider>
    </ThemeProvider>
  );
}
