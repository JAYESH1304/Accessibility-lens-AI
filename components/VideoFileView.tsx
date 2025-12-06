import React, { useRef, useState, useEffect } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { ControlBar } from './ControlBar';
import { ActionCard } from './ActionCard';
import { AlertTriangle, Upload, ChevronLeft, Play, Pause } from 'lucide-react';

interface VideoFileViewProps {
  onBack: () => void;
}

export const VideoFileView: React.FC<VideoFileViewProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Pass mode='video' to hook
  const { connectionState, volume, currentAction, clearAction } = useGeminiLive({ 
    videoRef, 
    isActive, 
    mode: 'video' 
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setIsActive(false); // Reset session if new file
      setIsVideoPlaying(false);
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Sync state with video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);
    const onEnded = () => setIsVideoPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoFile]);

  // Auto-play video when AI connects (optional convenience)
  useEffect(() => {
    if (isActive && connectionState.isConnected && videoRef.current && !isVideoPlaying) {
        videoRef.current.play().catch(e => console.warn("Auto-play blocked", e));
    }
  }, [isActive, connectionState.isConnected]);

  return (
    <div className="relative h-screen w-full bg-slate-900 overflow-hidden flex flex-col">
      
      {/* Header / Back Button */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 bg-slate-800/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold hover:bg-slate-700 transition-colors shadow-lg"
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-black">
        
        {!videoFile ? (
          // Upload State
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="border-4 border-dashed border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center max-w-xl w-full hover:border-blue-400 hover:bg-slate-800/50 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Upload a video file"
              />
              <div className="bg-slate-800 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Upload size={48} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a Video</h2>
              <p className="text-slate-400">Tap to upload a video for analysis</p>
            </div>
          </div>
        ) : (
          // Video Player State
          <div className="relative w-full h-full flex items-center justify-center bg-black group">
             <video 
                ref={videoRef} 
                src={videoFile}
                className={`max-w-full max-h-full object-contain ${isActive ? 'opacity-100' : 'opacity-80'}`}
                playsInline 
                controls
                loop
             />
             
             {/* Custom Play/Pause Overlay - Fades out when playing, shows when paused or hovered */}
             <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-300 ${isVideoPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <button 
                  onClick={toggleVideoPlayback}
                  className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold border border-slate-700 hover:bg-blue-600 hover:border-blue-400 hover:scale-105 transition-all shadow-xl"
                  aria-label={isVideoPlaying ? "Pause Video" : "Play Video"}
                >
                  {isVideoPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                  <span className="text-lg">{isVideoPlaying ? "Pause Video" : "Play Video"}</span>
                </button>
             </div>

             {/* Live Indicator */}
             {isActive && connectionState.isConnected && (
                <div className="absolute top-20 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse shadow-md z-40 pointer-events-none">
                   AI WATCHING
                </div>
             )}

             {/* Action Card Overlay */}
             <ActionCard action={currentAction} onDismiss={clearAction} />
          </div>
        )}

        {/* Error Display */}
        {connectionState.error && (
           <div className="absolute top-20 left-4 right-4 bg-red-600 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg z-50">
              <AlertTriangle className="flex-shrink-0" />
              <span className="font-bold">{connectionState.error}</span>
           </div>
        )}
      </div>

      {/* Spacer for sticky footer */}
      <div className="h-[200px] w-full bg-slate-900" />

      {/* Controls */}
      {videoFile && (
        <ControlBar 
           isActive={isActive} 
           onToggleActive={toggleActive} 
           isConnecting={connectionState.isConnecting}
           volume={volume}
        />
      )}
    </div>
  );
};