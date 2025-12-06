import React, { useRef, useState } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { ControlBar } from './ControlBar';
import { ActionCard } from './ActionCard';
import { AlertTriangle, Eye, EyeOff, ChevronLeft } from 'lucide-react';

interface CameraViewProps {
  onBack: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { connectionState, volume, currentAction, clearAction } = useGeminiLive({ 
    videoRef, 
    isActive,
    mode: 'camera' 
  });

  const toggleActive = () => setIsActive(!isActive);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col">
      
      {/* Back Button Overlay */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>

      {/* Camera Layer */}
      <div className="flex-1 relative">
         <video 
            ref={videoRef} 
            className={`w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-30 grayscale'}`}
            autoPlay 
            playsInline 
            muted 
         />
         
         {/* Overlay for inactive state */}
         {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="text-center p-6">
                  <EyeOff className="w-20 h-20 text-slate-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-300">Camera Paused</h2>
               </div>
            </div>
         )}

         {/* Error Display */}
         {connectionState.error && (
            <div className="absolute top-16 left-4 right-4 bg-red-600 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg z-50">
               <AlertTriangle className="flex-shrink-0" />
               <span className="font-bold">{connectionState.error}</span>
            </div>
         )}
         
         {/* Live Indicator */}
         {isActive && connectionState.isConnected && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse shadow-md z-40">
               LIVE
            </div>
         )}
         
         {/* Action Card Overlay */}
         <ActionCard action={currentAction} onDismiss={clearAction} />
      </div>

      {/* Spacer for sticky footer */}
      <div className="h-[200px] w-full bg-slate-900" />

      {/* Controls */}
      <ControlBar 
         isActive={isActive} 
         onToggleActive={toggleActive} 
         isConnecting={connectionState.isConnecting}
         volume={volume}
      />
    </div>
  );
};