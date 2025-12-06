export interface StreamConfig {
  frameRate: number;
  jpegQuality: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface AudioVolumeState {
  input: number;
  output: number;
}

export type AppMode = 'home' | 'camera' | 'video';

export interface AppAction {
  id: string;
  type: 'food' | 'ride' | 'grocery';
  platform: 'swiggy' | 'zomato' | 'blinkit' | 'uber' | 'ola' | 'generic';
  query: string; // Food item or Destination
  url: string;
  description: string;
}