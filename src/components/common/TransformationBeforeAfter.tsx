import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowRight, Sliders, CheckCircle2 } from 'lucide-react';

interface ShowcaseItem {
  id: string;
  title: string;
  location: string;
  category: 'wardrobe' | 'kitchen' | 'steam';
  beforeImage: string;
  afterImage: string;
  metrics: string;
  serviceType: 'transformation' | 'cleaning';
  tier?: 'diamond' | 'platinum';
}

const SHOWCASES: ShowcaseItem[] = [
  {
    id: 'wardrobe',
    title: 'Walk-In Wardrobe Declutter & Tier Zoning',
    location: 'Bandra West · 3BHK Apartment',
    category: 'wardrobe',
    beforeImage: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=900&q=80',
    metrics: '+45% usable wardrobe space saved',
    serviceType: 'transformation',
  },
  {
    id: 'kitchen',
    title: 'Modular Kitchen Pantry & Spice Organization',
    location: 'Pali Hill · 4BHK Penthouse',
    category: 'kitchen',
    beforeImage: 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80',
    metrics: 'Zero oil film · 100% airtight jar labeled',
    serviceType: 'transformation',
  },
  {
    id: 'steam',
    title: '140°C Deep Steam & Italian Marble Buffing',
    location: 'Juhu Tara Road · Villa',
    category: 'steam',
    beforeImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    metrics: '99.9% pathogens eliminated · Mirror shine',
    serviceType: 'cleaning',
    tier: 'diamond',
  },
];

export const TransformationBeforeAfter: React.FC = () => {
  const { setActiveConfigService, setPreselectedTier } = useApp();
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem>(SHOWCASES[0]);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || e.buttons === 1) {
      handleSliderMove(e.clientX);
    }
  };

  const handleBookCurrent = () => {
    if (selectedItem.serviceType === 'cleaning') {
      setActiveConfigService('cleaning');
      if (selectedItem.tier) {
        setPreselectedTier(selectedItem.tier);
      }
    } else {
      setActiveConfigService('transformation');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF5A5F] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Real Results</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#12222E]">
            Before & After Showcase
          </h2>
          <p className="text-xs text-gray-500">
            Slide horizontally to see genuine Mumbai home transformations
          </p>
        </div>
      </div>

      {/* Category selector pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {SHOWCASES.map((item) => {
          const isCurrent = selectedItem.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedItem(item);
                setSliderPosition(50);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                isCurrent
                  ? 'bg-[#12222E] text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200/90 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <span>{item.category === 'wardrobe' ? '👗 Wardrobe' : item.category === 'kitchen' ? '🍳 Kitchen' : '✨ Steam Clean'}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Slider Box */}
      <div className="bg-white rounded-[20px] p-3 sm:p-4 border border-gray-100 shadow-sm space-y-3">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative h-60 sm:h-72 w-full rounded-[16px] overflow-hidden select-none cursor-ew-resize bg-gray-900 touch-none"
        >
          {/* After image (Base layer, fully revealed on right) */}
          <img
            src={selectedItem.afterImage}
            alt={`${selectedItem.title} - After`}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Before image (Clipped layer on left) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={selectedItem.beforeImage}
              alt={`${selectedItem.title} - Before`}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none',
              }}
            />
            {/* Soft dark tint on before side for contrast */}
            <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>
          </div>

          {/* Before Label Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white border border-white/20 shadow-xs">
              BEFORE
            </span>
          </div>

          {/* After Label Badge */}
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF5A5F] text-white shadow-xs">
              AFTER CHAKACHAK
            </span>
          </div>

          {/* Split Handle Line and Thumb */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none shadow-[0_0_8px_rgba(0,0,0,0.6)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-[#12222E] shadow-xl flex items-center justify-center border-2 border-[#12222E]">
              <Sliders className="w-4 h-4 text-[#FF5A5F]" />
            </div>
          </div>

          {/* Location & Title pill on bottom-left */}
          <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 text-white border border-white/10 flex items-center justify-between gap-2">
              <div className="truncate">
                <p className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider truncate">
                  {selectedItem.location}
                </p>
                <p className="text-xs font-bold text-white truncate">
                  {selectedItem.title}
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {selectedItem.metrics}
              </span>
            </div>
          </div>
        </div>

        {/* Footer CTA & Guarantee */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-semibold text-gray-700">
              100% Satisfaction Guarantee or free re-clean
            </span>
          </div>

          <button
            type="button"
            onClick={handleBookCurrent}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FFF5F6] hover:bg-[#FF5A5F] text-[#FF5A5F] hover:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Book Similar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
