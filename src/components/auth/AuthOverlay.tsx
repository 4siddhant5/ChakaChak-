import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AppContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Phone,
  KeyRound,
  RotateCcw,
  Check,
} from 'lucide-react';

interface AuthOverlayProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
}) => {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    loginWithOTP,
    signUpWithEmail,
    clearAuthError,
    isAuthModalOpen,
    closeAuthModal,
  } = useAuth();

  // Mode: Sign In vs Sign Up
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // Sign In Method: OTP vs Password
  const [signInMethod, setSignInMethod] = useState<'otp' | 'password'>('otp');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Flow Fields
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Local Validation & Feedback State
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    otp?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const activeIsOpen = isOpen !== undefined ? isOpen : isAuthModalOpen;

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep === 'verify' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpStep, otpTimer]);

  const handleClose = () => {
    clearAuthError();
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    if (onClose) {
      onClose();
    } else {
      closeAuthModal();
    }
  };

  useEffect(() => {
    if (activeIsOpen) {
      clearAuthError();
      setFieldErrors({});
      setGeneralError(null);
      setSuccessMessage(null);
    }
  }, [activeIsOpen, mode, signInMethod]);

  if (!activeIsOpen) return null;

  // Clear specific field error on change
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    setGeneralError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    setGeneralError(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: undefined }));
    }
    setGeneralError(null);
  };

  const handlePhoneChange = (val: string) => {
    // Only accept numeric characters, max 10 digits
    const numeric = val.replace(/\D/g, '').slice(0, 10);
    setPhone(numeric);
    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
    }
    setGeneralError(null);
  };

  // OTP 6-box input management
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (fieldErrors.otp) {
      setFieldErrors((prev) => ({ ...prev, otp: undefined }));
    }
    setGeneralError(null);

    // Auto-advance to next box
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  // 1. Password or Sign-up submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    clearAuthError();

    const errors: typeof fieldErrors = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address (e.g. name@mumbai.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (mode === 'signup' && !name.trim()) {
      errors.name = 'Please enter your full name.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLocalSubmitting(true);
      if (mode === 'signin') {
        const loggedUser = await loginWithEmail(trimmedEmail, password);
        if (loggedUser) {
          setSuccessMessage('Successfully signed in!');
          setTimeout(() => {
            handleClose();
            if (onSuccess) onSuccess();
          }, 600);
        } else {
          setGeneralError('Incorrect email or password. Please verify credentials or switch to Instant OTP.');
        }
      } else {
        const newUser = await signUpWithEmail(trimmedEmail, password, name.trim());
        if (newUser) {
          setSuccessMessage('Account created successfully!');
          setTimeout(() => {
            handleClose();
            if (onSuccess) onSuccess();
          }, 600);
        } else {
          setGeneralError('Could not complete registration. Please check if this email already exists.');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      setGeneralError(msg);
    } finally {
      setLocalSubmitting(false);
    }
  };

  // 2. Request OTP Submission (Step 1)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    clearAuthError();

    const clean = phone.trim();
    if (!clean) {
      setFieldErrors({ phone: 'Mobile number is required for OTP sign-in.' });
      return;
    }

    if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setFieldErrors({
        phone: 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).',
      });
      return;
    }

    setOtpStep('verify');
    setOtpTimer(30);
    setOtpDigits(['', '', '', '', '', '']);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // 3. Verify OTP Submission (Step 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    clearAuthError();

    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      setFieldErrors({ otp: 'Please enter all 6 digits of the verification code.' });
      return;
    }

    try {
      setLocalSubmitting(true);
      const success = await loginWithOTP?.(phone, code);
      if (success) {
        setSuccessMessage('Mobile number verified! Signed in successfully.');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setFieldErrors({
          otp: 'Invalid OTP entered. Please enter demo code 942108 or click Resend.',
        });
        setGeneralError('Verification failed. Use demo code 942108 for instant sign-in.');
      }
    } catch (err: any) {
      setFieldErrors({
        otp: err?.message || 'Verification error occurred.',
      });
      setGeneralError(err?.message || 'Verification failed.');
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLocalSubmitting(true);
      clearAuthError();
      setFieldErrors({});
      setGeneralError(null);
      await loginWithGoogle();
      setSuccessMessage('Successfully connected with Google!');
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: any) {
      setGeneralError('Google Sign-in was cancelled or encountered an error.');
    } finally {
      setLocalSubmitting(false);
    }
  };

  // Demo Helpers
  const handleFillDemoPassword = () => {
    setEmail('customer.mumbai@chakachak.com');
    setPassword('Chakachak@2026');
    setName('Priya Sharma');
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleFillDemoPhone = () => {
    setPhone('9820198201');
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleFillDemoOtp = () => {
    setOtpDigits(['9', '4', '2', '1', '0', '8']);
    setFieldErrors({});
    setGeneralError(null);
  };

  const activeError = generalError || authError;

  return (
    <div
      id="auth-overlay-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        id="auth-overlay-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative animate-scaleUp max-h-[92vh] flex flex-col"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#12222E] via-[#1F3347] to-[#12222E] p-6 text-white relative shrink-0">
          <button
            id="auth-close-btn"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-xl bg-[#FF5A5F] flex items-center justify-center text-white font-black text-sm shadow-xs">
              ⚡
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A5F] bg-white/10 px-2.5 py-0.5 rounded-full">
              ChakaChak Mumbai
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {title || (mode === 'signin' ? 'Sign in to ChakaChak' : 'Create Customer Account')}
          </h2>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            {subtitle ||
              'Access real-time GPS tracking, before/after job checklists, and instant GST digital invoices.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1.5 shrink-0">
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => {
              setMode('signin');
              clearAuthError();
              setFieldErrors({});
              setGeneralError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'signin'
                ? 'bg-white text-[#12222E] shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => {
              setMode('signup');
              clearAuthError();
              setFieldErrors({});
              setGeneralError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'signup'
                ? 'bg-white text-[#12222E] shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Top Error Alert Banner */}
          {activeError && (
            <div
              id="auth-error-banner"
              className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-shake shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-semibold leading-relaxed">{activeError}</div>
              <button
                type="button"
                onClick={() => {
                  setGeneralError(null);
                  clearAuthError();
                }}
                className="text-red-400 hover:text-red-700 p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              id="auth-success-banner"
              className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Google Sign-in One-Click Option */}
          <button
            id="auth-google-btn"
            type="button"
            disabled={localSubmitting || isAuthLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-2.5 shadow-2xs transition disabled:opacity-60 cursor-pointer"
          >
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
          </button>

          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {mode === 'signin' ? 'Or choose login method' : 'Or fill registration details'}
            </span>
          </div>

          {/* If Mode is SIGN IN: Toggle between OTP and Password */}
          {mode === 'signin' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setSignInMethod('otp');
                  setFieldErrors({});
                  setGeneralError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  signInMethod === 'otp'
                    ? 'bg-white text-[#FF5A5F] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Instant Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSignInMethod('password');
                  setFieldErrors({});
                  setGeneralError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  signInMethod === 'password'
                    ? 'bg-white text-[#12222E] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
            </div>
          )}

          {/* METHOD A: INSTANT MOBILE OTP FLOW */}
          {mode === 'signin' && signInMethod === 'otp' && (
            <div className="space-y-3.5">
              {otpStep === 'phone' ? (
                /* Step 1: Phone input */
                <form onSubmit={handleRequestOtp} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Indian Mobile Number
                      </label>
                      <button
                        type="button"
                        onClick={handleFillDemoPhone}
                        className="text-[10px] font-bold text-[#FF5A5F] hover:underline"
                      >
                        Demo: 98201 98201
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-gray-500 text-xs font-bold pointer-events-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                        <span className="text-gray-300">|</span>
                      </div>
                      <input
                        id="auth-input-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="98201 23456"
                        className={`w-full pl-20 pr-10 py-2.5 bg-gray-50 border rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden transition ${
                          fieldErrors.phone
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                            : phone.length === 10
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                            : 'border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                        }`}
                      />
                      {phone.length === 10 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5" />
                      )}
                    </div>

                    {/* Field-level validation error */}
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      We'll send a 6-digit verification code to verify your Mumbai account.
                    </p>
                  </div>

                  <button
                    id="auth-request-otp-btn"
                    type="submit"
                    disabled={localSubmitting || phone.length < 10}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FF5A5F] hover:bg-[#E8355C] text-white text-xs font-extrabold shadow-md shadow-[#FF5A5F]/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Step 2: 6-Digit Verification Code input */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">
                        OTP Sent to
                      </span>
                      <span className="text-xs font-mono font-black text-gray-900">
                        +91 {phone.slice(0, 5)} •••••
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      className="text-xs font-bold text-[#FF5A5F] hover:underline"
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={handleFillDemoOtp}
                        className="text-[10px] font-bold text-[#FF5A5F] bg-[#FF5A5F]/10 px-2 py-0.5 rounded-full hover:bg-[#FF5A5F]/20 transition"
                      >
                        Auto-fill Demo OTP (942108)
                      </button>
                    </div>

                    {/* 6 Discrete Digit Boxes */}
                    <div className="flex items-center justify-between gap-1.5" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={`w-11 h-12 text-center text-lg font-mono font-black rounded-xl border transition focus:outline-hidden ${
                            fieldErrors.otp
                              ? 'border-red-400 bg-red-50/40 text-red-700 focus:ring-2 focus:ring-red-200'
                              : digit
                              ? 'border-gray-900 bg-gray-50 text-gray-900 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                              : 'border-gray-200 bg-white focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Field-level validation feedback for OTP */}
                    {fieldErrors.otp && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.otp}</span>
                      </p>
                    )}
                  </div>

                  {/* Resend Timer or Trigger */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-500">Didn't receive SMS?</span>
                    {otpTimer > 0 ? (
                      <span className="text-gray-400 font-medium">
                        Resend in <span className="font-mono font-bold text-gray-700">{otpTimer}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOtpTimer(30);
                          setFieldErrors({});
                          setGeneralError(null);
                        }}
                        className="text-[#FF5A5F] font-bold hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <button
                    id="auth-verify-otp-btn"
                    type="submit"
                    disabled={localSubmitting || otpDigits.some((d) => !d)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FF5A5F] hover:bg-[#E8355C] text-white text-xs font-extrabold shadow-md shadow-[#FF5A5F]/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {localSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Proceed</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* METHOD B: PASSWORD-BASED SIGN IN OR SIGN UP */}
          {(mode === 'signup' || (mode === 'signin' && signInMethod === 'password')) && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-input-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden transition ${
                        fieldErrors.name
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleFillDemoPassword}
                      className="text-[10px] font-bold text-[#FF5A5F] hover:underline"
                    >
                      Fill Demo Credentials
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-input-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden transition ${
                      fieldErrors.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                        : 'border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-2xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden transition ${
                      fieldErrors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                        : 'border-gray-200 focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#FF5A5F]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={localSubmitting || isAuthLoading}
                className="w-full py-3 px-4 rounded-2xl bg-[#FF5A5F] hover:bg-[#E8355C] text-white text-xs font-extrabold shadow-md shadow-[#FF5A5F]/20 hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {localSubmitting || isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Footer Notice */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>256-bit Encrypted Mumbai Session</span>
            </div>

            <span className="text-[10px] text-gray-400 font-mono">ChakaChak v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
