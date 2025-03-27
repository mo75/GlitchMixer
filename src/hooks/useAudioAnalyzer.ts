import { useState, useEffect, useRef } from 'react';

export interface AudioData {
  volume: number; // Overall volume level (0-1)
  frequencyData: Uint8Array; // Raw frequency data
  bass: number; // Low frequencies (0-1)
  mid: number; // Mid frequencies (0-1)
  treble: number; // High frequencies (0-1)
  isActive: boolean; // Whether microphone is active
}

export const useAudioAnalyzer = (): [AudioData, () => void, () => void] => {
  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0,
    frequencyData: new Uint8Array(0),
    bass: 0,
    mid: 0,
    treble: 0,
    isActive: false
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const startAnalyzing = async () => {
    try {
      // Stop any existing analysis
      stopAnalyzing();
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Get microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create source and analyzer
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      
      // Configure analyzer
      analyzerRef.current.fftSize = 256;
      analyzerRef.current.smoothingTimeConstant = 0.8;
      
      // Connect source to analyzer
      sourceRef.current.connect(analyzerRef.current);
      
      // Create buffer for frequency data
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      
      // Start analyzing
      const analyze = () => {
        if (!analyzerRef.current) return;
        
        // Get frequency data
        analyzerRef.current.getByteFrequencyData(frequencyData);
        
        // Calculate volume (average of all frequencies)
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
          sum += frequencyData[i];
        }
        const volume = sum / (frequencyData.length * 255); // Normalize to 0-1
        
        // Calculate bass, mid, and treble
        // Note: Frequency ranges are approximate
        // Bass: 0-7 (roughly 0-200Hz)
        // Mid: 8-25 (roughly 200-800Hz)
        // Treble: 26-127 (roughly 800Hz-22kHz)
        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;
        
        for (let i = 0; i < 8; i++) {
          bassSum += frequencyData[i];
        }
        
        for (let i = 8; i < 26; i++) {
          midSum += frequencyData[i];
        }
        
        for (let i = 26; i < frequencyData.length; i++) {
          trebleSum += frequencyData[i];
        }
        
        const bass = bassSum / (8 * 255); // Normalize to 0-1
        const mid = midSum / (18 * 255); // Normalize to 0-1
        const treble = trebleSum / ((frequencyData.length - 26) * 255); // Normalize to 0-1
        
        // Update state
        setAudioData({
          volume,
          frequencyData: new Uint8Array(frequencyData),
          bass,
          mid,
          treble,
          isActive: true
        });
        
        // Schedule next frame
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      
      // Start animation frame loop
      animationFrameRef.current = requestAnimationFrame(analyze);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAudioData(prev => ({ ...prev, isActive: false }));
    }
  };
  
  const stopAnalyzing = () => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Disconnect source and analyzer
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Update state
    setAudioData(prev => ({
      ...prev,
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      isActive: false
    }));
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, []);
  
  return [audioData, startAnalyzing, stopAnalyzing];
}; 