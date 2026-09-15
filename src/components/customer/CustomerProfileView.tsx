import React, { useState } from 'react';
import { useApp, useAuth } from '../../context/AppContext';
import { HelpSupportChatModal } from '../common/HelpSupportChatModal';
import {
  User as UserIcon,
  MapPin,
  Shield,
  CreditCard,
  Phone,
  Mail,
  HelpCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  LogOut,
  LogIn,
  ArrowLeft,
  Database,
  RefreshCw,
  CheckCircle2,
  Radio,
  Lock,
  UserPlus,
  AlertCircle,
  Headphones,
} from 'lucide-react';

export const CustomerProfileView: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { customer, setAddressPickerOpen, setActiveCustomerTab, showToast, bookings, workers } =
    useApp();
  const {
    user: currentUser,
    loading: isAuthLoading,
    error: authError,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logout: logoutUser,
    firestoreConnected,
    clearAuthError,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_signup'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      showToast('Please provide both email and password.');
      return;
    }
    if (authMode === 'email_signup') {
      const res = await signUpWithEmail(emailInput, passwordInput, nameInput || customer.name);
      if (res) {
        setEmailInput('');
        setPasswordInput('');
        setNameInput('');
        setAuthMode('google');
      }
    } else {
      const res = await loginWithEmail(emailInput, passwordInput);
      if (res) {
        setEmailInput('');
        setPasswordInput('');
        setAuthMode('google');
      }
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 pb-28">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => setActiveCustomerTab('home')}
          className="w-9 h-9 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-center text-gray-700 hover:text-[#FF5A5F] hover:bg-gray-50 transition active:scale-95 shrink-0"
          title="Back to Home / Explore"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#12222E]">Account & Profile</h2>
          <p className="text-xs text-gray-500">Manage memberships, addresses, and benefits</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-center gap-4">
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-16 h-16 rounded-[16px] object-cover ring-2 ring-[#FF5A5F]/20 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black text-[#12222E] truncate">{customer.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-800 border border-amber-300 shrink-0">
              ChakaChak Club
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
          <p className="text-[11px] text-gray-400 truncate">{customer.email}</p>
        </div>
      </div>

      {/* Firebase Authentication & Live Real-Time Database Card */}
      <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Cloud Database & Auth
              </h3>
              <p className="text-[11px] text-gray-500">Firebase Auth + Firestore Real-Time Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span>{firestoreConnected ? 'Live Sync' : 'Connecting'}</span>
          </div>
        </div>

        {currentUser ? (
          /* Signed In State */
          <div className="p-3.5 rounded-[16px] bg-gradient-to-r from-emerald-50/60 to-teal-50/40 border border-emerald-100/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white p-0.5 shadow-xs border border-gray-100 overflow-hidden shrink-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#12222E] text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.displayName?.charAt(0) || 'G'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-gray-900">
                      {currentUser.displayName || 'Google Account'}
                    </span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
                      Google Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={logoutUser}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600 border border-gray-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition min-h-[44px]"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>

            <div className="pt-2 border-t border-emerald-100/80 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Syncs bookings live</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synced with UID</span>
              </div>
            </div>
          </div>
        ) : (
          /* Unauthenticated / Guest Mode */
          <div className="p-3.5 rounded-[16px] bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#12222E]">
                <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Live Real-Time Database Mode</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Connect your account to sync your bookings, addresses, and status changes across devices in real-time.
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex items-center bg-gray-200/70 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('google');
                  clearAuthError();
                }}
                className={`flex-1 py-1 rounded-lg transition text-center ${
                  authMode === 'google' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_login');
                  clearAuthError();
                }}
                className={`flex-1 py-1 rounded-lg transition text-center ${
                  authMode === 'email_login' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_signup');
                  clearAuthError();
                }}
                className={`flex-1 py-1 rounded-lg transition text-center ${
                  authMode === 'email_signup' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200/70 flex items-center gap-2 text-red-700 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{authError}</span>
              </div>
            )}

            {authMode === 'google' ? (
              <button
                onClick={loginWithGoogle}
                disabled={isAuthLoading}
                className="w-full min-h-[44px] rounded-[16px] bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-300 text-gray-800 text-xs font-bold shadow-xs flex items-center justify-center gap-2.5 transition"
              >
                {isAuthLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    {/* Google G Logo */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            ) : (
              <form onSubmit={handleEmailAuthSubmit} className="space-y-2.5">
                {authMode === 'email_signup' && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-hidden focus:border-[#FF5A5F]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-hidden focus:border-[#FF5A5F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-hidden focus:border-[#FF5A5F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full min-h-[44px] rounded-[16px] bg-[#12222E] hover:bg-black active:scale-[0.99] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition"
                >
                  {isAuthLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-300" />
                      <span>Processing...</span>
                    </>
                  ) : authMode === 'email_signup' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create ChakaChak Account</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Email</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Real-time Telemetry Snapshot */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-[14px] bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Live Bookings in Cloud</span>
            <span className="text-sm font-black text-[#12222E]">{bookings.length}</span>
          </div>
          <div className="p-2.5 rounded-[14px] bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Online Dispatchers</span>
            <span className="text-sm font-black text-emerald-600">
              {workers.filter((w) => w.isOnline).length} active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total Lifetime Spend</span>
          <div className="text-lg font-black text-[#12222E] mt-1">
            ₹{customer.totalSpend.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Tier: Diamond Select</span>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Completed Services</span>
          <div className="text-lg font-black text-[#12222E] mt-1">{customer.bookingsCount}</div>
          <span className="text-[10px] text-gray-400 font-semibold">Member since Aug '24</span>
        </div>
      </div>

      {/* Saved Addresses Section */}
      <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-gray-700">Saved Mumbai Addresses</h3>
          <button
            onClick={() => setAddressPickerOpen(true)}
            className="min-h-[44px] text-xs font-bold text-[#FF5A5F] hover:underline flex items-center"
          >
            Manage
          </button>
        </div>

        <div className="space-y-2.5">
          {customer.savedAddresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3 rounded-[16px] bg-gray-50 border border-gray-100 flex items-start gap-2.5"
            >
              <MapPin className="w-4 h-4 text-[#FF5A5F] shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded-sm font-semibold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5">{addr.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Guarantee */}
      <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase text-gray-700">Help & Trust Guarantees</h3>

        <div className="space-y-2 text-xs">
          <div
            onClick={() => setIsSupportOpen(true)}
            className="p-3.5 rounded-[16px] bg-red-50/60 hover:bg-red-50 border border-red-100/60 cursor-pointer flex items-center justify-between min-h-[44px] transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF5A5F] text-white flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-gray-900 group-hover:text-[#FF5A5F] transition block">
                  Live Help & Support Chat
                </span>
                <span className="text-[11px] text-gray-500">
                  Real-time Firestore connected · Avg reply &lt; 2 mins
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div
            onClick={() => showToast('Connecting to 24x7 Mumbai Dispatch Desk: +91 22 6820 0000')}
            className="p-3.5 rounded-[16px] bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-h-[44px] transition"
          >
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-gray-800">24x7 Mumbai Support Helpline</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div
            onClick={() => showToast('On-time or free guarantee: 100% money back if pro delays >20 mins.')}
            className="p-3.5 rounded-[16px] bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-h-[44px] transition"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-800">ChakaChak Damage & On-Time Cover</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Real-time Support Chat Modal */}
      <HelpSupportChatModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        role="customer"
        currentUserId={customer.id}
        currentUserName={customer.name}
      />
    </div>
  );
};
