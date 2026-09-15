import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Info,
} from 'lucide-react';

interface PhotoZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceTitle: string;
  beforePhotos: string[];
  afterPhotos: string[];
  initialMode?: 'before' | 'after' | 'split';
  serviceDate?: string;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceTitle,
  beforePhotos,
  afterPhotos,
  initialMode = 'after',
  serviceDate = 'Verified Inspection',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Active view: before photo, after photo, or side-by-side split comparison
  const [activeMode, setActiveMode] = useState<'before' | 'after' | 'split'>(initialMode);
  
  // High-res photo selection
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Zoom & Pan transformation state
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch pinch tracking refs
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Split view slider percentage (0 to 100)
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [isSplitDragging, setIsSplitDragging] = useState(false);

  const activeBeforePhoto =
    beforePhotos[selectedPhotoIndex] ||
    beforePhotos[0] ||
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=90';

  const activeAfterPhoto =
    afterPhotos[selectedPhotoIndex] ||
    afterPhotos[0] ||
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=90';

  // Reset zoom & pan
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // When active mode or photo changes, smoothly reset zoom
  useEffect(() => {
    resetZoom();
  }, [activeMode, selectedPhotoIndex, resetZoom]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (scale > 1) {
          resetZoom();
        } else {
          onClose();
        }
      }
      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      }
      if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      }
      if (e.key === '0') {
        resetZoom();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, resetZoom, onClose]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.5).toFixed(2)), 4.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(2)), 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleSetPresetScale = (targetScale: number) => {
    setScale(targetScale);
    if (targetScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Double tap / double click to toggle 1x and 2.5x
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      // Center zoom towards tap point if possible
      if (imageWrapperRef.current) {
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const offsetX = (rect.width / 2 - (clientX - rect.left)) * 1.2;
        const offsetY = (rect.height / 2 - (clientY - rect.top)) * 1.2;
        setPosition({ x: Math.max(Math.min(offsetX, 200), -200), y: Math.max(Math.min(offsetY, 200), -200) });
      }
    }
  };

  // Wheel zoom handling with passive: false to prevent background scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.002;
    setScale((prev) => {
      const next = Math.min(Math.max(Number((prev + zoomDelta).toFixed(2)), 1), 4.5);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const maxBound = 300 * (scale - 1);
    setPosition({
      x: Math.max(Math.min(posStartRef.current.x + dx, maxBound), -maxBound),
      y: Math.max(Math.min(posStartRef.current.y + dy, maxBound), -maxBound),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Pinch-to-Zoom & Drag Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers = Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Check for double-tap
      const now = Date.now();
      const touch = e.touches[0];
      if (now - lastTapTimeRef.current < 300) {
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      // 1 finger = Drag / pan if zoomed
      if (scale > 1) {
        lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
        posStartRef.current = { ...position };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Perform pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const ratio = currentDist / touchStartDistRef.current;
      const newScale = Math.min(Math.max(Number((touchStartScaleRef.current * ratio).toFixed(2)), 1), 4.5);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && scale > 1 && lastTouchPosRef.current) {
      // Pan when zoomed
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchPosRef.current.x;
      const dy = touch.clientY - lastTouchPosRef.current.y;
      const maxBound = 300 * (scale - 1);
      setPosition({
        x: Math.max(Math.min(posStartRef.current.x + dx, maxBound), -maxBound),
        y: Math.max(Math.min(posStartRef.current.y + dy, maxBound), -maxBound),
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    lastTouchPosRef.current = null;
  };

  // Split-screen comparison slider drag
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSplitDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPosition((x / rect.width) * 100);
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    setSplitPosition((x / rect.width) * 100);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      id="photo-zoom-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col text-white select-none animate-fadeIn"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Controls Bar */}
      <header className="p-3 sm:p-4 bg-black/70 border-b border-gray-800 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF5A5F] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Pinch-to-Zoom Inspection</span>
              </span>
              <span className="text-xs font-mono text-gray-400">#{bookingId}</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[220px] sm:max-w-md">
              {serviceTitle}
            </h2>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-gray-900 border border-gray-700/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMode('before')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'before'
                ? 'bg-[#FF5A5F] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-300" />
            <span>Before</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('after')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'after'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>After</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeMode === 'split'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Split Compare</span>
            <span className="sm:hidden">Split</span>
          </button>
        </div>

        {/* Right: Fullscreen & Close */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-red-600/80 text-gray-300 hover:text-white transition"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Interactive Stage Area */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-default touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeMode === 'split' ? (
          /* Interactive Split-Screen Slider Comparison */
          <div
            className="relative w-full h-full max-w-5xl max-h-[80vh] m-auto rounded-2xl overflow-hidden border border-gray-800 shadow-2xl cursor-ew-resize select-none"
            onMouseMove={handleSplitMouseMove}
            onTouchMove={handleSplitTouchMove}
            onMouseDown={() => setIsSplitDragging(true)}
            onMouseUp={() => setIsSplitDragging(false)}
          >
            {/* After Image (Background layer) */}
            <img
              src={activeAfterPhoto}
              alt="After Restoration"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-xs px-3 py-1 rounded-xl text-xs font-bold tracking-wide z-10 flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AFTER RESTORATION</span>
            </div>

            {/* Before Image (Clipped layer) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${splitPosition}%` }}
            >
              <img
                src={activeBeforePhoto}
                alt="Before Service"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                  width: `${containerRef.current ? containerRef.current.clientWidth : 1000}px`,
                  maxWidth: 'none',
                }}
              />
              <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-xs px-3 py-1 rounded-xl text-xs font-bold tracking-wide z-10 shadow-md">
                BEFORE CONDITION
              </div>
            </div>

            {/* Split Divider Handle */}
            <div
              className="absolute inset-y-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-2xl"
              style={{ left: `${splitPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg border border-gray-300 transform -translate-x-1/2">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        ) : (
          /* High-Resolution Pinch-to-Zoom & Pan Canvas */
          <div
            ref={imageWrapperRef}
            className="w-full h-full flex items-center justify-center overflow-hidden transition-transform duration-75"
            onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
            style={{
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
          >
            <div
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                transformOrigin: 'center center',
              }}
              className="relative max-w-[90vw] max-h-[80vh] rounded-2xl flex items-center justify-center"
            >
              <img
                src={activeMode === 'before' ? activeBeforePhoto : activeAfterPhoto}
                alt={activeMode === 'before' ? 'Before condition high resolution' : 'After restoration high resolution'}
                className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl pointer-events-none"
                draggable={false}
              />

              {/* Status Watermark */}
              <div
                className={`absolute top-4 left-4 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 shadow-lg ${
                  activeMode === 'before'
                    ? 'bg-red-600/85 text-white border border-red-400/40'
                    : 'bg-emerald-600/85 text-white border border-emerald-400/40'
                }`}
              >
                {activeMode === 'before' ? (
                  <span>PRE-SERVICE AUDIT</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>CHAKACHAK TRANSFORMED</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Zoom Guidance Pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-700/80 text-[11px] font-medium text-gray-300 flex items-center gap-2 pointer-events-none shadow-lg">
          <Info className="w-3.5 h-3.5 text-[#FF5A5F]" />
          <span>Pinch or scroll to zoom · Double-tap for 2.5x · Drag to pan</span>
        </div>
      </div>

      {/* Floating Bottom Control Bar with Zoom Buttons & Gallery */}
      <footer className="p-3 sm:p-4 bg-black/80 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Quality Verification Guarantee */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>4K High-Resolution Service Evidence · Tamper-proof GPS timestamp</span>
        </div>

        {/* Center: Zoom Level & Presets Toolbar */}
        <div className="flex items-center gap-1.5 bg-gray-900/90 border border-gray-700 p-1.5 rounded-2xl shadow-xl">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-1.5 rounded-xl hover:bg-gray-800 disabled:opacity-30 text-gray-300 hover:text-white transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Current Zoom Percentage Badge */}
          <span className="px-2 text-xs font-mono font-bold text-white min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4.5}
            className="p-1.5 rounded-xl hover:bg-gray-800 disabled:opacity-30 text-gray-300 hover:text-white transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-700 mx-1" />

          {/* Quick Presets */}
          <button
            type="button"
            onClick={() => handleSetPresetScale(1)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
              scale === 1 ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            1x Fit
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetScale(2)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
              scale === 2 ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            2x
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetScale(3)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
              scale === 3 ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            3x
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className="p-1.5 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition"
            title="Reset Zoom & Pan (0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Exit View Button */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#FF5A5F] hover:bg-[#E8355C] text-white font-extrabold text-xs transition active:scale-95 shadow-md shadow-[#FF5A5F]/20"
        >
          Done Inspecting
        </button>
      </footer>
    </div>
  );
};
