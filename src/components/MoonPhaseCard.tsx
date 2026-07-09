import React from 'react';
import { calculateMoonPhase } from '../utils/moonPhase';

interface MoonPhaseCardProps {
  date: Date;
}

export const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ date }) => {
  const moonData = calculateMoonPhase(date);
  const { phase, name, illumination, age, stage } = moonData;

  // Generate SVG path for the moon's shadow
  const getMoonShadowPath = (p: number): string => {
    const r = 45; // radius of moon
    if (p >= 0.46 && p <= 0.54) return ""; // Full moon, no shadow
    if (p < 0.01 || p > 0.99) {
      // New moon: shadow covers everything
      return `M 0,-${r} A ${r},${r} 0 1,0 0,${r} A ${r},${r} 0 1,0 0,-${r}`;
    }

    if (p < 0.5) {
      // Waxing phase (0 < p < 0.5). Light is on the right, shadow is on the left.
      // Terminator width rx varies from r to 0 to r.
      const rx = r * Math.abs(1 - 4 * p);
      const sweep = p < 0.25 ? 1 : 0;
      // Draw left semi-circle and then the elliptical terminator
      return `M 0,-${r} A ${r},${r} 0 0,0 0,${r} A ${rx},${r} 0 0,${sweep} 0,-${r}`;
    } else {
      // Waning phase (0.5 < p < 1.0). Light is on the left, shadow is on the right.
      const rx = r * Math.abs(1 - 4 * (p - 0.5));
      const sweep = p < 0.75 ? 0 : 1;
      // Draw right semi-circle and then the elliptical terminator
      return `M 0,-${r} A ${rx},${r} 0 0,${sweep} 0,${r} A ${r},${r} 0 0,0 0,-${r}`;
    }
  };

  const shadowPath = getMoonShadowPath(phase);

  return (
    <div id="moon-phase-card" className="bg-stone-900 border border-stone-800 rounded-3xl p-4 text-stone-100 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl relative overflow-hidden">
      {/* Absolute ambient light effect */}
      <div className="absolute -right-24 -bottom-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
      
      <div className="flex-1 space-y-3 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-widest text-amber-500 uppercase">Celestial Phase</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-serif text-stone-50 tracking-tight font-semibold">{name}</h2>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="border-l border-stone-800 pl-3">
            <span className="block text-[10px] font-mono text-stone-500 uppercase tracking-wider">Illumination</span>
            <span className="text-lg font-mono font-medium text-stone-200">{illumination}%</span>
          </div>
          <div className="border-l border-stone-800 pl-3">
            <span className="block text-[10px] font-mono text-stone-500 uppercase tracking-wider">Lunar Age</span>
            <span className="text-lg font-mono font-medium text-stone-200">{age} days</span>
          </div>
        </div>

        <p className="text-xs text-stone-400 font-sans italic leading-relaxed pt-1">
          {stage === 'new' && "The beginning of the lunar month. A time of renewal and fresh intentions."}
          {stage === 'waxing' && "The crescent is growing, reflecting increasing light. Anticipate the days ahead."}
          {stage === 'full' && "The moon is fully illuminated, casting serene light across the night sky."}
          {stage === 'waning' && "The crescent is decreasing, completing the cycle with quiet reflection."}
        </p>
      </div>

      <div className="relative flex items-center justify-center w-36 h-36 shrink-0 bg-stone-950/40 rounded-2xl p-4 border border-stone-800/50 z-10">
        <svg viewBox="-50 -50 100 100" className="w-28 h-28 transform -rotate-12 transition-transform duration-500 hover:rotate-0">
          <defs>
            {/* Soft celestial glow */}
            <radialGradient id="moonGlow" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#FFFDF4" />
              <stop offset="60%" stopColor="#FAF1C9" />
              <stop offset="100%" stopColor="#EADAA2" />
            </radialGradient>
            
            {/* Crater shadows mapping */}
            <radialGradient id="craterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(212, 194, 144, 0.25)" />
              <stop offset="100%" stopColor="rgba(212, 194, 144, 0)" />
            </radialGradient>
          </defs>

          {/* Glowing Base Moon */}
          <circle r="45" fill="url(#moonGlow)" />

          {/* Hand-crafted vector craters for visual depth */}
          <g fill="url(#craterGlow)">
            <circle cx="-15" cy="-20" r="6" />
            <circle cx="-25" cy="-5" r="4" />
            <circle cx="-8" cy="15" r="7" />
            <circle cx="18" cy="-12" r="8" />
            <circle cx="10" cy="22" r="5" />
            <circle cx="26" cy="12" r="4" />
            <circle cx="-2" cy="-28" r="3" />
            <circle cx="3" cy="-2" r="9" />
          </g>

          {/* The Astronomical Dynamic Shadow Overlay */}
          {shadowPath && (
            <path d={shadowPath} fill="rgba(12, 10, 9, 0.92)" />
          )}

          {/* Atmospheric Ring */}
          <circle r="45.5" fill="none" stroke="rgba(251, 191, 36, 0.15)" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
};
