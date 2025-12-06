import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { VideoFileView } from './components/VideoFileView';
import { HomePage } from './components/HomePage';
import { AppMode } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');

  const hasKey = !!process.env.API_KEY;

  if (!hasKey) {
     return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
           <div className="max-w-md text-center">
              <h1 className="text-3xl font-bold text-yellow-400 mb-4">Accessibility Lens AI</h1>
              <p className="text-xl mb-6">API Key is missing.</p>
              <p className="text-slate-400">Please provide a valid API_KEY in the environment to start the assistant.</p>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {currentMode === 'home' && (
        <HomePage onSelectMode={setCurrentMode} />
      )}
      
      {currentMode === 'camera' && (
        <CameraView onBack={() => setCurrentMode('home')} />
      )}
      
      {currentMode === 'video' && (
        <VideoFileView onBack={() => setCurrentMode('home')} />
      )}
    </div>
  );
};

export default App;
