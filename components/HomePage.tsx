import React from 'react';
import { Camera, Upload, Eye } from 'lucide-react';
import { AppMode } from '../types';

interface HomePageProps {
  onSelectMode: (mode: AppMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full flex flex-col items-center animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="bg-yellow-400 p-4 rounded-full mb-6 shadow-xl shadow-yellow-400/20">
            <Eye size={48} className="text-slate-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Accessibility Lens AI
          </h1>
          <p className="text-xl text-slate-400 max-w-lg">
            Your real-time assistive companion. Choose how you want to interact with the world today.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          
          <button 
            onClick={() => onSelectMode('camera')}
            className="group relative flex flex-col items-center p-8 bg-slate-800 rounded-3xl border-2 border-slate-700 hover:border-yellow-400 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400"
            aria-label="Start Live Camera Mode"
          >
            <div className="bg-slate-700 p-6 rounded-2xl mb-6 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors duration-300">
              <Camera size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Live Camera</h2>
            <p className="text-slate-400 text-center group-hover:text-slate-300">
              Get real-time descriptions and safety alerts for your immediate surroundings.
            </p>
          </button>

          <button 
            onClick={() => onSelectMode('video')}
            className="group relative flex flex-col items-center p-8 bg-slate-800 rounded-3xl border-2 border-slate-700 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-400/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-400"
            aria-label="Upload Video Mode"
          >
            <div className="bg-slate-700 p-6 rounded-2xl mb-6 group-hover:bg-blue-400 group-hover:text-slate-900 transition-colors duration-300">
              <Upload size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Video</h2>
            <p className="text-slate-400 text-center group-hover:text-slate-300">
              Upload a video file for analysis and ask questions about its content.
            </p>
          </button>

        </div>

      </div>
      
      <footer className="mt-16 text-slate-600 text-sm">
        Powered by Gemini 2.5 Flash
      </footer>
    </div>
  );
};
