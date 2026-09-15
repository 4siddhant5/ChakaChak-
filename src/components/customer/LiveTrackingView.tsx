import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Navigation,
  FileText,
  Sparkles,
  Send,
  X,
  Share2,
} from 'lucide-react';

interface LiveTrackingViewProps {
  bookingId: string;
  onBack: () => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  bookingId,
  onBack,
}) => {
  const {
    bookings,
    updateBookingStatus,
    setActiveInvoiceBookingId,
    setActiveRatingBookingId,
    showToast,
    getPreviousTitle,
    pushNav,
    goBack,
  } = useApp();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'worker' | 'customer'; text: string; time: string }[]
  >([
    {
      sender: 'worker',
      text: 'Namaste Riya! I have my ChakaChak kit and high-pressure equipment. Reaching your Bandra residence soon.',
      time: '02:08 PM',
    },
  ]);

  // Animated ETA simulator
  const [eta, setEta] = useState(booking.etaMinutes || 14);
  const [pinProgress, setPinProgress] = useState(0.45); // 0 to 1 along path

  useEffect(() => {
    const handleCloseChat = () => {
      setChatOpen(false);
    };
    window.addEventListener('close-tracking-chat', handleCloseChat);
    return () => window.removeEventListener('close-tracking-chat', handleCloseChat);
  }, []);

  const handleOpenChat = () => {
    setChatOpen(true);
    pushNav('tracking_chat', 'modal', 'Live Chat');
  };

  const handleCloseChatModal = () => {
    goBack();
  };

  useEffect(() => {
    if (booking.status === 'en_route') {
      const interval = setInterval(() => {
        setPinProgress((prev) => {
          if (prev >= 0.95) return 0.95;
          return prev + 0.02;
        });
        setEta((prev) => (prev > 2 ? prev - 1 : 2));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [booking.status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (chatOpen) {
          handleCloseChatModal();
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen, onBack]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      { sender: 'customer', text: chatInput, time: timeStr },
    ]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'worker',
          text: 'Understood! I will ring the bell at flat 1203 directly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const timelineSteps = [
    { key: 'confirmed', label: 'Booking Confirmed', time: booking.statusTimestamps.confirmed || '12:45 PM' },
    { key: 'worker_assigned', label: 'Pro Assigned', time: booking.statusTimestamps.worker_assigned || '01:10 PM' },
    { key: 'en_route', label: 'En Route on Activa', time: booking.statusTimestamps.en_route || '02:05 PM' },
    { key: 'job_started', label: 'Job Started', time: booking.statusTimestamps.job_started || 'Pending' },
    { key: 'completed', label: 'Completed & Checked', time: booking.statusTimestamps.completed || 'Pending' },
  ];

  const getStepStatus = (key: string) => {
    const order = ['confirmed', 'worker_assigned', 'en_route', 'job_started', 'completed'];
    const currentIdx = order.indexOf(booking.status);
    const targetIdx = order.indexOf(key);
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FB] relative overflow-hidden">
      {/* Top Floating App Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto p-2.5 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-md hover:bg-white transition"
          title={getPreviousTitle()}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-800">
            Booking #{booking.id}
          </span>
          <StatusBadge status={booking.status} size="sm" />
        </div>

        <button
          onClick={() => showToast('Share live tracking link copied to clipboard')}
          className="pointer-events-auto p-2.5 rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-md hover:bg-white transition"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Map Visualizer (Styled like Uber / Zepto map) */}
      <div className="h-[46%] sm:h-[50%] w-full bg-[#E5E9EC] relative overflow-hidden shrink-0">
        {/* Stylized vector map background (Mumbai coastal road) */}
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full object-cover select-none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Water gradient (Arabian Sea) */}
            <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBE2EC" />
              <stop offset="100%" stopColor="#B3D5E5" />
            </linearGradient>

            {/* Land pattern */}
            <pattern id="landGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E0E5E8" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Arabian Sea Coast on Left */}
          <path
            d="M 0,0 L 160,0 Q 210,130 180,240 T 140,400 L 0,400 Z"
            fill="url(#seaGradient)"
          />
          <text x="35" y="220" fill="#759BAE" fontSize="14" fontWeight="700" letterSpacing="4">
            ARABIAN SEA
          </text>

          {/* Mumbai Land Area */}
          <rect x="150" y="0" width="450" height="400" fill="#EDF1F4" />
          <rect x="150" y="0" width="450" height="400" fill="url(#landGrid)" />

          {/* Bandra Landmass / Landmarks */}
          <path
            d="M 220,110 Q 320,80 480,90"
            fill="none"
            stroke="#DCE2E6"
            strokeWidth="24"
          />
          <path
            d="M 280,20 Q 310,180 340,380"
            fill="none"
            stroke="#DCE2E6"
            strokeWidth="28"
          />

          {/* Bandra-Worli Sea Link representation */}
          <path
            d="M 180,330 Q 140,240 180,160"
            fill="none"
            stroke="#98A7B0"
            strokeWidth="3"
            strokeDasharray="6,4"
          />
          <text x="110" y="270" fill="#647986" fontSize="9" fontWeight="600" transform="rotate(-70 110 270)">
            BANDRA-WORLI SEA LINK
          </text>

          {/* Carter Road & Linking Road Arterials */}
          <path
            d="M 200,90 Q 230,170 260,250 T 310,340"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 200,90 Q 230,170 260,250 T 310,340"
            fill="none"
            stroke="#FF5A5F"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="10,4"
            className="animate-pulse"
          />

          {/* Street labels */}
          <text x="210" y="140" fill="#8898A4" fontSize="10" fontWeight="600" transform="rotate(70 210 140)">
            Carter Road
          </text>
          <text x="285" y="210" fill="#8898A4" fontSize="10" fontWeight="600" transform="rotate(45 285 210)">
            Pali Hill Marg
          </text>
          <text x="350" y="160" fill="#8898A4" fontSize="10" fontWeight="600">
            Linking Road, Bandra West
          </text>

          {/* Customer Destination Pin (Sea Crest, Carter Rd) */}
          <g transform="translate(305, 335)">
            <circle r="22" fill="#FF5A5F" fillOpacity="0.2" className="animate-ping" />
            <circle r="12" fill="#12222E" />
            <circle r="5" fill="#FFFFFF" />
            <rect x="-60" y="-38" width="120" height="22" rx="11" fill="#12222E" />
            <text x="0" y="-23" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">
              1203, Sea Crest 🏠
            </text>
          </g>

          {/* Worker Moving Location Pin (Ramesh on Bike) */}
          {/* Interpolated pin position along path: start (205, 100) -> end (305, 335) */}
          {(() => {
            const currentX = 205 + (305 - 205) * pinProgress;
            const currentY = 100 + (335 - 100) * pinProgress;
            return (
              <g transform={`translate(${currentX}, ${currentY})`}>
                {/* Pulsing beacon radar */}
                <circle r="26" fill="#3B82F6" fillOpacity="0.25" className="animate-ping" />
                <circle r="16" fill="#3B82F6" fillOpacity="0.4" />
                {/* Bike badge icon */}
                <circle r="14" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                <text x="0" y="4" fontSize="13" textAnchor="middle">
                  🛵
                </text>
                {/* Live ETA Tag */}
                <rect x="-42" y="-36" width="84" height="20" rx="10" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="-22" fill="#FFFFFF" fontSize="9" fontWeight="800" textAnchor="middle">
                  {booking.status === 'en_route'
                    ? `${eta} mins away`
                    : booking.status === 'job_started'
                    ? 'Pro at location 🛠️'
                    : 'Job Completed ✅'}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Live ETA Floating Banner at bottom of map */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5A5F] to-[#E8355C] text-white flex items-center justify-center font-black text-sm shadow-sm">
              {booking.status === 'en_route' ? `${eta}m` : '0m'}
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">
                {booking.status === 'en_route'
                  ? 'Arriving at Carter Road'
                  : booking.status === 'job_started'
                  ? 'Active Restoration in Progress'
                  : 'Service Handover Completed'}
              </h4>
              <p className="text-[11px] text-gray-500">
                {booking.status === 'en_route'
                  ? 'On-time guarantee active · Live GPS on'
                  : booking.status === 'job_started'
                  ? 'Inspecting modular kitchen & wardrobes'
                  : 'Customer rated 5.0★'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                showToast(`Calling partner: ${booking.workerPhone}`);
              }}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition"
              title="Call Professional"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenChat}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition relative"
              title="Message Professional"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#FF5A5F] absolute top-1.5 right-1.5"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet: Worker Details & Live Status Progression */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl shadow-xl p-4 sm:p-5 space-y-4">
        {/* Worker Card */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={
                booking.workerPhoto ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
              }
              alt={booking.workerName || 'Partner'}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-white shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-sm text-[#12222E]">
                  {booking.workerName || 'Ramesh Sawant'}
                </h4>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-extrabold text-gray-800 flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{booking.workerRating || 4.92}</span>
                </span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[11px] text-gray-500 font-semibold">488 jobs</span>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Top 1% Pro
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Vehicle</span>
            <span className="text-xs font-mono font-bold text-gray-800">MH-02-EE-8820</span>
          </div>
        </div>

        {/* Live Milestone Progress Timeline */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          <h5 className="text-xs font-bold text-gray-700 uppercase mb-3">
            Live Service Progression
          </h5>
          <div className="relative pl-6 space-y-4">
            {/* Vertical timeline line */}
            <div className="absolute top-2 left-2.5 bottom-2 w-0.5 bg-gray-200"></div>

            {timelineSteps.map((step, idx) => {
              const status = getStepStatus(step.key);
              return (
                <div key={step.key} className="relative flex items-center justify-between text-xs">
                  {/* Dot */}
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center transition ${
                      status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : status === 'active'
                        ? 'bg-[#FF5A5F] text-white ring-4 ring-[#FF5A5F]/20'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`font-bold ${
                        status === 'active'
                          ? 'text-[#FF5A5F]'
                          : status === 'completed'
                          ? 'text-[#12222E]'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-400 font-mono">{step.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Invoice & Rating */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setActiveInvoiceBookingId(booking.id)}
            className="py-3 px-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span>Digital Invoice</span>
          </button>

          {booking.status === 'completed' ? (
            <button
              onClick={() => setActiveRatingBookingId(booking.id)}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>{booking.customerRating ? 'View Rating' : 'Rate Experience'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                // Quick shortcut for demo review
                updateBookingStatus(
                  booking.id,
                  booking.status === 'en_route' ? 'job_started' : 'completed'
                );
              }}
              className="py-3 px-3 rounded-2xl bg-[#12222E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {booking.status === 'en_route' ? 'Simulate Start' : 'Simulate Complete'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* In-App Live Chat Drawer */}
      {chatOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseChatModal();
            }
          }}
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl animate-slideUp"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    booking.workerPhoto ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={booking.workerName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{booking.workerName}</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold">Online · En Route</span>
                </div>
              </div>
              <button
                onClick={handleCloseChatModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === 'customer' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                      msg.sender === 'customer'
                        ? 'bg-[#FF5A5F] text-white rounded-br-xs'
                        : 'bg-gray-100 text-gray-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="Type instructions for pro..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F]"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#FF5A5F] text-white hover:bg-[#E8355C]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
