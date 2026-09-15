import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  portalTag?: string;
  lightMode?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  portalTag,
  lightMode = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Circular gradient monogram icon */}
      <div
        className={`${iconSizes[size]} rounded-full bg-gradient-to-tr from-[#FF5A5F] via-[#FF4365] to-[#E8355C] flex items-center justify-center font-bold text-white shadow-sm shadow-[#FF5A5F]/30 ring-2 ring-white/80 shrink-0`}
      >
        <span className="translate-y-[-0.5px] font-black tracking-tighter">C</span>
      </div>

      <div className="flex flex-col leading-none">
        <div className={`font-extrabold tracking-tight ${textSizes[size]} flex items-baseline`}>
          <span className={lightMode ? 'text-white' : 'text-[#12222E]'}>Chaka</span>
          <span className="bg-gradient-to-r from-[#FF5A5F] to-[#E8355C] bg-clip-text text-transparent ml-[1px]">
            Chak
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A5F] ml-0.5 inline-block"></span>
        </div>
        {portalTag && (
          <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mt-0.5">
            {portalTag}
          </span>
        )}
      </div>
    </div>
  );
};
