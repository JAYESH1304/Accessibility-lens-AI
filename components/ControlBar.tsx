import React from 'react';
import { Mic, MicOff, Power, Video, VideoOff } from 'lucide-react';

interface ControlBarProps {
  isActive: boolean;
  onToggleActive: () => void;
  isConnecting: boolean;
  volume: { input: number; output: number };
}

export const ControlBar: React.FC<ControlBarProps> = ({ 
  isActive, 
  onToggleActive, 
  isConnecting,
  volume 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-4 border-yellow-400 p-6 flex flex-col items-center gap-4 z-50">
      
      {/* Audio Visualizer / Status Text */}
      <div className="w-full flex justify-between items-center px-4 mb-2">
         <div className="flex flex-col">
            <span className="text-yellow-400 font-bold text-xl uppercase tracking-wider">
               {isConnecting ? 'CONNECTING...' : isActive ? 'LISTENING' : 'PAUSED'}
            </span>
            {isActive && (
               <span className="text-slate-400 text-sm">
                  {volume.output > 0.01 ? 'Speaking...' : 'Watching...'}
               </span>
            )}
         </div>

         {/* Simple Visualizer */}
         {isActive && (
            <div className="flex gap-1 h-8 items-end">
               {[...Array(5)].map((_, i) => (
                  <div 
                     key={i} 
                     className="w-3 bg-yellow-400 rounded-t-sm transition-all duration-75"
                     style={{ 
                        height: `${Math.max(10, Math.min(100, (volume.input * 500) * (Math.random() + 0.5)))}%`,
                        opacity: volume.input > 0.01 ? 1 : 0.3
                     }}
                  />
               ))}
            </div>
         )}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={onToggleActive}
        disabled={isConnecting}
        className={`
          w-full max-w-md h-24 rounded-2xl font-black text-3xl tracking-widest uppercase shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-4
          ${isActive 
            ? 'bg-red-600 text-white border-4 border-red-400 hover:bg-red-700' 
            : 'bg-yellow-400 text-slate-900 border-4 border-yellow-200 hover:bg-yellow-300'
          }
          ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={isActive ? "Stop Assistant" : "Start Assistant"}
      >
        {isConnecting ? (
           <div className="animate-spin h-8 w-8 border-4 border-slate-900 rounded-full border-t-transparent" />
        ) : (
           <>
              <Power size={32} strokeWidth={3} />
              {isActive ? 'STOP' : 'START'}
           </>
        )}
      </button>

      <p className="text-slate-400 text-sm text-center">
         {isActive ? "Tap Stop to end session" : "Tap Start to begin guidance"}
      </p>
    </div>
  );
};
