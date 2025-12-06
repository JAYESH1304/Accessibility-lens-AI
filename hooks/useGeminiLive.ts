import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData, calculateVolume } from '../utils/audioUtils';
import { blobToBase64 } from '../utils/imageUtils';
import { ConnectionState, AudioVolumeState, AppAction } from '../types';

const SYSTEM_INSTRUCTION = `
You are Accessibility Lens AI, a real-time assistive companion.

**CORE FUNCTIONS:**
1.  **Scene Description**: Immediately describe surroundings, obstacles, and safety hazards.
2.  **Navigation**: Provide spatial details (front, left, right).
3.  **Actions**: Help the user order food, groceries, or book rides by using the \`trigger_external_app\` tool.

**TOOLS & ACTIONS:**
- **Navigation**: If user asks "Where am I?", use \`get_current_location\`.
- **Time**: If user asks "What time is it?", use \`get_current_time\`.
- **Ordering/Booking**:
  - If user wants to order food (Pizza, Burger, etc.), use \`trigger_external_app\` with \`service_type="food_delivery"\`.
  - If user wants groceries (Milk, Bread, Veggies), use \`trigger_external_app\` with \`service_type="grocery"\`.
  - If user wants a taxi/cab, use \`trigger_external_app\` with \`service_type="ride"\`.
  - **Platforms**: Recognize specific app names like "Swiggy", "Swiggy Instamart", "Zomato", "Blinkit", "Uber", "Ola". If none specified, pick the most appropriate one.

**BEHAVIOR:**
- When you use a tool like \`trigger_external_app\`, inform the user: "I have prepared a button on your screen to open [Platform] for [Item/Destination]."
- **Safety First**: Always prioritize warning about immediate physical hazards over other tasks.
- **Tone**: Calm, direct, and helpful.
`;

// Tool Declarations
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_current_location',
        description: 'Get the user\'s current GPS location.',
      },
      {
        name: 'get_current_time',
        description: 'Get the current local time.',
      },
      {
        name: 'trigger_external_app',
        description: 'Open an external app for food, grocery, or ride services.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            service_type: {
              type: Type.STRING,
              description: 'Type of service: "food_delivery", "grocery", "ride"',
              enum: ['food_delivery', 'grocery', 'ride']
            },
            platform: {
              type: Type.STRING,
              description: 'Platform name: "swiggy", "swiggy instamart", "zomato", "blinkit", "uber", "ola"',
            },
            query: {
              type: Type.STRING,
              description: 'The search item (e.g. "Pizza") or destination address (e.g. "Airport").'
            }
          },
          required: ['service_type', 'query']
        }
      }
    ] as FunctionDeclaration[],
  },
];

interface UseGeminiLiveProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  mode?: 'camera' | 'video';
}

export const useGeminiLive = ({ videoRef, isActive, mode = 'camera' }: UseGeminiLiveProps) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });
  const [volume, setVolume] = useState<AudioVolumeState>({ input: 0, output: 0 });
  const [currentAction, setCurrentAction] = useState<AppAction | null>(null);

  // Refs for cleanup
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try {
          session.close();
        } catch (e) {
          console.warn("Error closing session", e);
        }
      });
      sessionPromiseRef.current = null;
    }

    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    setConnectionState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
    setVolume({ input: 0, output: 0 });
    setCurrentAction(null);
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      setConnectionState({ isConnected: false, isConnecting: false, error: "API Key not found" });
      return;
    }

    setConnectionState({ isConnected: false, isConnecting: true, error: null });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const outputGain = outputCtx.createGain();
      outputGain.connect(outputCtx.destination);

      let stream: MediaStream;
      
      if (mode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setConnectionState({ isConnected: true, isConnecting: false, error: null });

            const source = inputCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const vol = calculateVolume(inputData);
              setVolume(prev => ({ ...prev, input: vol }));
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const videoEl = videoRef.current;
            
            if (videoEl && ctx) {
              videoIntervalRef.current = window.setInterval(() => {
                if (videoEl.readyState < 2) return;
                
                canvas.width = videoEl.videoWidth || 640;
                canvas.height = videoEl.videoHeight || 480;
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    const base64 = await blobToBase64(blob);
                    sessionPromise.then(session => 
                      session.sendRealtimeInput({ 
                        media: { 
                          mimeType: 'image/jpeg', 
                          data: base64 
                        } 
                      })
                    );
                  }
                }, 'image/jpeg', 0.6);
              }, 500);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              const responses = [];
              for (const fc of message.toolCall.functionCalls) {
                let result = {};
                
                if (fc.name === 'get_current_location') {
                  try {
                     const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                           enableHighAccuracy: true,
                           timeout: 5000,
                           maximumAge: 0
                        });
                     });
                     result = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy + " meters"
                     };
                  } catch (e) {
                     result = { error: "Location permission denied" };
                  }
                } else if (fc.name === 'get_current_time') {
                  result = { time: new Date().toLocaleString() };
                } else if (fc.name === 'trigger_external_app') {
                  // Construct Deep Links
                  const args = fc.args as any;
                  const platform = (args.platform || 'generic').toLowerCase();
                  const query = encodeURIComponent(args.query);
                  let url = '';
                  let description = '';

                  if (args.service_type === 'ride') {
                     // Ride Booking
                     if (platform.includes('ola')) {
                        url = `https://book.olacabs.com/`;
                        description = `Book Ola to ${args.query}`;
                     } else {
                        // Default to Uber Universal Link
                        url = `https://m.uber.com/ul/?action=setPickup&client_id=uber&pickup=my_location&dropoff[formatted_address]=${query}`;
                        description = `Book Uber to ${args.query}`;
                     }
                  } else {
                     // Food & Grocery
                     if (platform.includes('swiggy')) {
                        // Check if it's explicitly grocery OR if the user asked for Swiggy Instamart
                        if (args.service_type === 'grocery' || platform.includes('instamart')) {
                           url = `https://www.swiggy.com/instamart/search?query=${query}`;
                           description = `Order ${args.query} on Swiggy Instamart`;
                        } else {
                           url = `https://www.swiggy.com/search?query=${query}`;
                           description = `Search ${args.query} on Swiggy`;
                        }
                     } else if (platform.includes('zomato')) {
                        url = `https://www.zomato.com/search?q=${query}`;
                        description = `Search ${args.query} on Zomato`;
                     } else if (platform.includes('blinkit')) {
                        url = `https://blinkit.com/s/?q=${query}`;
                        description = `Get ${args.query} on Blinkit`;
                     } else {
                        // Fallback generic search
                        url = `https://www.google.com/search?q=${query}+delivery`;
                        description = `Search for ${args.query}`;
                     }
                  }

                  const newAction: AppAction = {
                     id: fc.id,
                     type: args.service_type,
                     platform: platform as any,
                     query: args.query,
                     url,
                     description
                  };
                  
                  setCurrentAction(newAction);
                  result = { status: "success", message: `Action card displayed to user for ${platform} - ${args.query}` };
                }

                responses.push({
                   id: fc.id,
                   name: fc.name,
                   response: result
                });
              }

              sessionPromise.then(session => 
                 session.sendToolResponse({ functionResponses: responses })
              );
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                24000,
                1
              );
              
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGain);
              
              setVolume(prev => ({ ...prev, output: 0.5 })); 
              source.addEventListener('ended', () => {
                 outputSourcesRef.current.delete(source);
                 setVolume(prev => ({ ...prev, output: 0 }));
              });

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              outputSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              outputSourcesRef.current.forEach(src => src.stop());
              outputSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Session closed');
            setConnectionState({ isConnected: false, isConnecting: false, error: null });
          },
          onerror: (e) => {
            console.error('Session error', e);
            setConnectionState({ isConnected: false, isConnecting: false, error: "Connection error" });
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: tools,
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setConnectionState({ isConnected: false, isConnecting: false, error: "Failed to initialize" });
    }
  }, [videoRef, mode]);

  useEffect(() => {
    if (isActive && !connectionState.isConnected && !connectionState.isConnecting) {
      connect();
    } else if (!isActive && (connectionState.isConnected || connectionState.isConnecting)) {
      disconnect();
    }
  }, [isActive, connect, disconnect, connectionState.isConnected, connectionState.isConnecting]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connectionState, volume, currentAction, clearAction: () => setCurrentAction(null) };
};