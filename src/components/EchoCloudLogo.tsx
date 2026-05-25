import React from 'react';

type LogoProps = {
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
};

export default function EchoCloudLogo({ className = "w-10 h-10", showText = false, textSize = 'md' }: LogoProps) {
  // 17 vector bars forming the 3D perspective rotated soundwave diamond
  const bars = [
    { x: 12, y: 44.5, w: 1.3, h: 11 },
    { x: 15.5, y: 40.5, w: 1.6, h: 19 },
    { x: 19.5, y: 36.5, w: 1.9, h: 27 },
    { x: 24, y: 32.5, w: 2.2, h: 35 },
    { x: 29, y: 28.5, w: 2.5, h: 43 },
    { x: 34.5, y: 24.5, w: 2.8, h: 51 },
    { x: 40.5, y: 20.5, w: 3.1, h: 59 },
    { x: 47, y: 16.5, w: 3.3, h: 67 },
    { x: 54, y: 12.5, w: 3.5, h: 75 }, // Center tallest bar
    { x: 61, y: 16.5, w: 3.3, h: 67 },
    { x: 67.5, y: 20.5, w: 3.1, h: 59 },
    { x: 73.5, y: 24.5, w: 2.8, h: 51 },
    { x: 79, y: 28.5, w: 2.5, h: 43 },
    { x: 83.5, y: 32.5, w: 2.2, h: 35 },
    { x: 87.5, y: 36.5, w: 1.9, h: 27 },
    { x: 91, y: 40.5, w: 1.6, h: 19 },
    { x: 94, y: 44.5, w: 1.3, h: 11 },
  ];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* 3D Round Diamond Soundwave Vector Icon */}
      <svg
        className={className}
        viewBox="0 0 108 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Luminous stereoscopic cylindrical lighting gradient */}
          <linearGradient id="diamondCylinderGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a0700" />
            <stop offset="20%" stopColor="#7a2400" />
            <stop offset="55%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#ff8c1a" />
          </linearGradient>
          
          {/* Ambient glow backing filter */}
          <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g filter="url(#vectorGlow)">
          {bars.map((bar, index) => (
            <rect
              key={index}
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              rx={bar.w / 2}
              fill="url(#diamondCylinderGrad)"
            />
          ))}
        </g>
      </svg>

      {/* Elegant Typography Branding */}
      {showText && (
        <div className="flex flex-col select-none mt-1">
          <span 
            className={`font-sans font-bold tracking-tight text-white leading-tight ${
              textSize === 'sm' ? 'text-sm' : textSize === 'lg' ? 'text-2xl' : 'text-lg'
            }`}
          >
            Echo<span className="text-accent text-[#FF6B00]">Cloud</span>
          </span>
        </div>
      )}
    </div>
  );
}
