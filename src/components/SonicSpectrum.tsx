import React, { useEffect, useState, useRef } from 'react';
import { audioEngine } from '../lib/audio';

interface SonicSpectrumProps {
  audioStarted: boolean;
}

export const SonicSpectrum = ({ audioStarted }: SonicSpectrumProps) => {
  const [spectrum, setSpectrum] = useState<number[]>(Array(16).fill(2));
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const update = () => {
      if (!active) return;
      if (audioStarted) {
        const data = audioEngine.getSpectrum();
        setSpectrum(data);
      } else {
        // Subtle ambient Idle animation for prime harmonics when audio has not started yet
        const time = Date.now() * 0.002;
        const idle = Array(16).fill(0).map((_, i) => {
          return 4 + Math.sin(time + i * 0.5) * 2;
        });
        setSpectrum(idle);
      }
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      active = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [audioStarted]);

  return (
    <div className="flex-1 flex items-end gap-1.5 px-3 mb-4 h-full min-h-[80px]" id="sonic-spectrum-container">
      {spectrum.map((h, i) => (
        <div 
          key={i} 
          id={`spectrum-bar-${i}`}
          className="flex-1 bg-cyan-500/20 rounded-t-sm transition-[height] duration-75"
          style={{ 
            height: `${Math.max(3, h)}%`,
            backgroundColor: h > 20 
              ? `rgba(6, 182, 212, ${0.25 + (h / 100) * 0.55})` 
              : 'rgba(6, 182, 212, 0.15)',
            boxShadow: h > 40 
              ? `0 0 12px rgba(6, 182, 212, ${(h / 100) * 0.5})` 
              : 'none'
          }}
        ></div>
      ))}
    </div>
  );
};
