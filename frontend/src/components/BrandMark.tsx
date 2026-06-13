import React from 'react';
import { Heart } from 'lucide-react';

interface BrandMarkProps {
  size?: 'sm' | 'md';
}

export default function BrandMark({ size = 'md' }: BrandMarkProps) {
  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <div className="inline-flex items-center gap-0.5 font-black tracking-tight text-[#1D4ED8]">
      <span className={textSize}>i</span>
      <Heart className={`${iconSize} -mt-0.5 fill-[#FF2D55] text-[#FF2D55]`} />
      <span className={textSize}>quote</span>
      <span className={`${textSize} text-[#1D4ED8]`}>.com</span>
    </div>
  );
}
