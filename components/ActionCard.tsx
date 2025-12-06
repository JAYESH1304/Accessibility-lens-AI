import React from 'react';
import { AppAction } from '../types';
import { ExternalLink, X, Car, ShoppingBag, Utensils } from 'lucide-react';

interface ActionCardProps {
  action: AppAction | null;
  onDismiss: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onDismiss }) => {
  if (!action) return null;

  const getIcon = () => {
    switch (action.type) {
      case 'ride': return <Car size={48} className="text-slate-900" />;
      case 'grocery': return <ShoppingBag size={48} className="text-slate-900" />;
      case 'food': return <Utensils size={48} className="text-slate-900" />;
      default: return <ExternalLink size={48} className="text-slate-900" />;
    }
  };

  const getColor = () => {
    switch (action.platform) {
      case 'uber': return 'bg-black text-white border-slate-700';
      case 'ola': return 'bg-lime-400 text-slate-900 border-lime-600';
      case 'swiggy': return 'bg-orange-500 text-white border-orange-700';
      case 'zomato': return 'bg-red-600 text-white border-red-800';
      case 'blinkit': return 'bg-yellow-400 text-slate-900 border-yellow-600';
      default: return 'bg-blue-600 text-white border-blue-800';
    }
  };

  return (
    // Changed to fixed z-[100] and raised bottom position to clear the ControlBar
    <div className="fixed inset-x-4 bottom-40 z-[100] animate-slide-up md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-md">
      <div className={`rounded-3xl shadow-2xl border-4 overflow-hidden ${getColor()} flex flex-col`}>
        
        {/* Header */}
        <div className="flex justify-between items-start p-4 bg-black/10">
          <div className="flex items-center gap-3">
             <div className="bg-white/90 p-3 rounded-xl">
               {getIcon()}
             </div>
             <div>
               <h3 className="font-bold text-lg opacity-90 uppercase tracking-wider">{action.platform}</h3>
               <p className="font-bold text-2xl leading-none">{action.type === 'ride' ? 'Book Ride' : 'Order Now'}</p>
             </div>
          </div>
          <button 
            onClick={onDismiss}
            className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors"
            aria-label="Close action"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-xl font-medium mb-6 opacity-90">
             {action.description}
          </p>
          
          {/* Changed to Anchor tag for reliable Deep Linking / App Opening */}
          <a 
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 decoration-0"
          >
            <span>Open {action.platform}</span>
            <ExternalLink size={24} />
          </a>
        </div>

      </div>
    </div>
  );
};