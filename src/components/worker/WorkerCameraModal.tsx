import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { uploadJobPhotoToFirebaseStorage, UploadPhotoResult } from '../../lib/firebaseStorage';
import { Booking } from '../../types';
import confetti from 'canvas-confetti';
import {
  Camera,
  X,
  RotateCw,
  RefreshCw,
  Check,
  Upload,
  CloudUpload,
  AlertCircle,
  Sparkles,
  Grid,
  Image as ImageIcon,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WorkerCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBookingId?: string;
  defaultCategory?: 'before' | 'after';
  onPhotoSaved?: (photoUrl: string, category: 'before' | 'after', bookingId: string) => void;
}

export const WorkerCameraModal: React.FC<WorkerCameraModalProps> = ({
  isOpen,
  onClose,
  defaultBookingId,
  defaultCategory = 'before',
  onPhotoSaved,
}) => {
  const {
    bookings,
    addBookingBeforePhoto,
    addBookingAfterPhoto,
    showToast,
    selectedWorker,
  } = useApp();

  // Find eligible assigned jobs (active jobs in worker queue)
  const eligibleJobs = bookings.filter(
    (b) => b.status !== 'cancelled'
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    defaultBookingId || eligibleJobs[0]?.id || ''
  );
  const [photoCategory, setPhotoCategory] = useState<'before' | 'after'>(defaultCategory);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Capture and Upload state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<UploadPhotoResult | null>(null);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);

  const currentBooking = bookings.find((b) => b.id === selectedBookingId) || eligibleJobs[0];

  // Synthesize tactile shutter sound
  const playShutterSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(850, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext muted or disallowed
    }
  };

  // Start Camera Stream
  const startCamera = async (facing: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play note:', e));
        }
        setHasCameraPermission(true);
        setIsInitializing(false);
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        // If back camera failed, try any available video camera
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          setHasCameraPermission(true);
          setIsInitializing(false);
        } catch (fallbackErr: any) {
          console.warn('Fallback camera stream error:', fallbackErr);
          setHasCameraPermission(false);
          setCameraError(
            fallbackErr.name === 'NotAllowedError'
              ? 'Camera permission was denied. You can select or take a photo using the file upload button below.'
              : 'Camera device is busy or unavailable. Use the photo upload option to upload inspection proof.'
          );
          setIsInitializing(false);
        }
      }
    } else {
      setHasCameraPermission(false);
      setCameraError('Camera API is not supported in this browser context. Please use the device file picker.');
      setIsInitializing(false);
    }
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultBookingId) {
        setSelectedBookingId(defaultBookingId);
      }
      setPhotoCategory(defaultCategory);
      setCapturedImage(null);
      setUploadResult(null);
      startCamera(cameraFacing);
    } else {
      // Clean up stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, cameraFacing]);

  // Flip between front and back cameras
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  // Capture frame from video feed and burn watermark stamp
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    playShutterSound();
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Apply high-craft ChakaChak verified watermark ribbon at bottom
    const ribbonHeight = Math.max(70, Math.round(height * 0.12));
    ctx.fillStyle = 'rgba(18, 34, 46, 0.82)';
    ctx.fillRect(0, height - ribbonHeight, width, ribbonHeight);

    // Accent line
    ctx.fillStyle = photoCategory === 'before' ? '#FF5A5F' : '#10B981';
    ctx.fillRect(0, height - ribbonHeight, width, 4);

    // Text details
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(ribbonHeight * 0.28)}px 'Plus Jakarta Sans', sans-serif`;
    const label = photoCategory === 'before' ? 'PRE-SERVICE INSPECTION PHOTO' : 'POST-SERVICE HANDOVER VERIFIED';
    ctx.fillText(`CHAKACHAK PRO · ${label}`, 24, height - ribbonHeight + Math.round(ribbonHeight * 0.42));

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `500 ${Math.round(ribbonHeight * 0.22)}px 'Plus Jakarta Sans', monospace`;
    const dateStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const locality = currentBooking?.customerAddress?.locality || 'Bandra West, Mumbai';
    ctx.fillText(
      `Job #${selectedBookingId} · Partner: ${selectedWorker?.name || 'Fleet'} · ${locality} · ${dateStr}`,
      24,
      height - ribbonHeight + Math.round(ribbonHeight * 0.78)
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
  };

  // Handle manual file selection / native device camera trigger
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // Watermark
          const ribbonHeight = Math.max(70, Math.round(img.height * 0.12));
          ctx.fillStyle = 'rgba(18, 34, 46, 0.82)';
          ctx.fillRect(0, img.height - ribbonHeight, img.width, ribbonHeight);

          ctx.fillStyle = photoCategory === 'before' ? '#FF5A5F' : '#10B981';
          ctx.fillRect(0, img.height - ribbonHeight, img.width, 4);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.round(ribbonHeight * 0.28)}px 'Plus Jakarta Sans', sans-serif`;
          const label = photoCategory === 'before' ? 'PRE-SERVICE INSPECTION PHOTO' : 'POST-SERVICE HANDOVER VERIFIED';
          ctx.fillText(`CHAKACHAK PRO · ${label}`, 24, img.height - ribbonHeight + Math.round(ribbonHeight * 0.42));

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = `500 ${Math.round(ribbonHeight * 0.22)}px 'Plus Jakarta Sans', monospace`;
          const dateStr = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const locality = currentBooking?.customerAddress?.locality || 'Bandra West, Mumbai';
          ctx.fillText(
            `Job #${selectedBookingId} · Partner: ${selectedWorker?.name || 'Fleet'} · ${locality} · ${dateStr}`,
            24,
            img.height - ribbonHeight + Math.round(ribbonHeight * 0.78)
          );

          setCapturedImage(canvas.toDataURL('image/jpeg', 0.88));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload to Firebase Storage and update job record
  const handleSaveToFirebase = async () => {
    if (!capturedImage || !selectedBookingId) return;

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 20 : p));
      }, 150);

      const result = await uploadJobPhotoToFirebaseStorage(
        selectedBookingId,
        photoCategory,
        capturedImage
      );

      clearInterval(progressTimer);
      setUploadProgress(100);
      setUploadResult(result);

      // Save into AppContext and Firestore document
      if (photoCategory === 'before') {
        addBookingBeforePhoto(selectedBookingId, result.downloadUrl);
      } else {
        addBookingAfterPhoto(selectedBookingId, result.downloadUrl);
      }

      if (onPhotoSaved) {
        onPhotoSaved(result.downloadUrl, photoCategory, selectedBookingId);
      }

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: photoCategory === 'before' ? ['#FF5A5F', '#12222E'] : ['#10B981', '#12222E'],
        });
      } catch (e) {}

      showToast(
        result.isCloudStored
          ? `Photo saved to Firebase Storage (${result.storagePath.split('/').pop()})!`
          : `Inspection photo saved & synced to job docket!`
      );
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      showToast('Error saving photo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setUploadResult(null);
    startCamera(cameraFacing);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0F172A] text-white rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh] border border-gray-800 relative"
      >
        {/* Shutter White Flash overlay */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white z-50 animate-fadeOut pointer-events-none" />
        )}

        {/* Modal Top Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#12222E]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${photoCategory === 'before' ? 'bg-[#FF5A5F]/20 text-[#FF5A5F]' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Partner Service Camera
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Firebase Storage
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {photoCategory === 'before'
                  ? 'Capture pre-service condition & client handoff'
                  : 'Capture completed transformation proof for handover'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition disabled:opacity-50"
            title="Close Camera"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Ribbon: Category Selector & Job Selector */}
        <div className="p-3 bg-gray-900/90 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Category Toggle: Before vs After */}
          <div className="flex bg-gray-800 p-0.5 rounded-xl border border-gray-700">
            <button
              type="button"
              onClick={() => {
                setPhotoCategory('before');
                if (capturedImage) handleRetake();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                photoCategory === 'before'
                  ? 'bg-[#FF5A5F] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Before Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPhotoCategory('after');
                if (capturedImage) handleRetake();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                photoCategory === 'after'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>After Photo</span>
            </button>
          </div>

          {/* Target Job Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium">Job:</span>
            <select
              value={selectedBookingId}
              onChange={(e) => {
                setSelectedBookingId(e.target.value);
                if (capturedImage) handleRetake();
              }}
              className="bg-gray-800 border border-gray-700 text-white text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-[#FF5A5F]"
            >
              {eligibleJobs.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} · {b.serviceTitle.split(' ')[0]} ({b.customerAddress.locality})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[380px] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Captured Photo Preview Mode */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Service Proof"
                className="w-full h-full max-h-[50vh] object-contain"
              />

              {/* Upload Success Badge */}
              {uploadResult && (
                <div className="absolute top-4 left-4 right-4 bg-emerald-950/90 border border-emerald-500/50 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md animate-slideDown shadow-xl">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-extrabold text-emerald-300">
                      Saved to Firebase Storage & Docket!
                    </p>
                    <p className="text-[11px] text-emerald-100/80 font-mono truncate max-w-xs">
                      {uploadResult.storagePath}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : hasCameraPermission === false || cameraError ? (
            /* Fallback UI when Camera is blocked or denied */
            <div className="p-6 text-center space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">Camera Access Notice</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {cameraError || 'Camera could not be activated. You can select a photo directly from your device.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF5A5F]/20"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Choose Photo from Device / Camera</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream Video */
            <div className="relative w-full h-full flex items-center justify-center">
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-20">
                  <RefreshCw className="w-6 h-6 text-[#FF5A5F] animate-spin" />
                  <span className="text-xs text-gray-400">Initializing camera sensor...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Grid Lines Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div></div>
                </div>
              )}

              {/* Real-time Viewfinder HUD Tag */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full animate-ping ${photoCategory === 'before' ? 'bg-[#FF5A5F]' : 'bg-emerald-400'}`}></span>
                <span className="text-gray-200">
                  {photoCategory === 'before' ? 'BEFORE MODE' : 'AFTER MODE'}
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">#{selectedBookingId}</span>
              </div>

              {/* Switch Camera and Grid Controls */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-xl backdrop-blur-md transition ${
                    showGrid ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-400'
                  }`}
                  title="Toggle Grid Guidelines"
                >
                  <Grid className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition border border-white/10"
                  title="Switch Camera (Front/Back)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Guidelines helper text */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-gray-300 font-medium text-center whitespace-nowrap">
                {photoCategory === 'before'
                  ? '📸 Frame closet, kitchen or room wear before beginning service'
                  : '✨ Frame the sparkling clean room or organized wardrobes for signoff'}
              </div>
            </div>
          )}

          {/* Hidden File Input for Gallery / Native Device Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-[#12222E] border-t border-gray-800 flex items-center justify-between gap-3 shrink-0">
          {capturedImage ? (
            /* Captured Action Buttons */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isUploading}
                className="py-3 px-4 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold flex items-center gap-2 transition border border-gray-700 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToFirebase}
                disabled={isUploading || !!uploadResult}
                className={`flex-1 py-3 px-5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                  uploadResult
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] hover:opacity-95 text-white shadow-[#FF5A5F]/20'
                } disabled:opacity-60`}
              >
                {isUploading ? (
                  <>
                    <CloudUpload className="w-4 h-4 animate-bounce" />
                    <span>Uploading ({uploadProgress}%)...</span>
                  </>
                ) : uploadResult ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to Firebase Storage!</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Save to Firebase Storage</span>
                  </>
                )}
              </button>

              {uploadResult && (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-2xl bg-white text-[#12222E] font-bold text-xs hover:bg-gray-100 transition"
                >
                  Done
                </button>
              )}
            </div>
          ) : (
            /* Live Camera Shutter & File Upload Buttons */
            <div className="w-full flex items-center justify-between gap-4">
              {/* Device Gallery / Native File Picker */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition border border-gray-700 flex items-center gap-1.5 text-xs font-semibold"
                title="Select from Photos"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Gallery</span>
              </button>

              {/* Large Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!hasCameraPermission}
                  className="group relative w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition active:scale-90 disabled:opacity-30 disabled:pointer-events-none hover:border-white"
                  title="Snap Inspection Photo"
                  aria-label="Capture Photo"
                >
                  <div
                    className={`w-full h-full rounded-full transition-all ${
                      photoCategory === 'before'
                        ? 'bg-[#FF5A5F] group-hover:bg-[#E8355C]'
                        : 'bg-emerald-500 group-hover:bg-emerald-600'
                    }`}
                  />
                  <Camera className="w-6 h-6 text-white absolute pointer-events-none drop-shadow-sm" />
                </button>
              </div>

              {/* Right Spacer or Info */}
              <div className="text-right text-[10px] text-gray-400 max-w-[80px] sm:max-w-none">
                <span className="font-mono text-white block">JPEG Auto-stamp</span>
                <span>Proof of work</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
