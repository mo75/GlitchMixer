import { useState, useRef, useCallback } from 'react';
import GIF from 'gif.js';

interface GIFRecorderOptions {
  workers?: number;
  quality?: number; // 1-10 lower is better
  delay?: number; // Delay between frames in ms
  maxFrames?: number; // Maximum number of frames to capture
}

interface GIFRecorderState {
  isRecording: boolean;
  progress: number;
  frameCount: number;
  isProcessing: boolean;
  error: string | null;
}

export const useGifRecorder = (defaultOptions: GIFRecorderOptions = {}) => {
  const [recorderState, setRecorderState] = useState<GIFRecorderState>({
    isRecording: false,
    progress: 0,
    frameCount: 0,
    isProcessing: false,
    error: null
  });
  
  const gifRef = useRef<GIF | null>(null);
  const framesRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const maxFramesRef = useRef<number>(defaultOptions.maxFrames || 100);
  const delayRef = useRef<number>(defaultOptions.delay || 100);
  
  // Start recording frames from a canvas
  const startRecording = useCallback((canvas: HTMLCanvasElement, options: GIFRecorderOptions = {}) => {
    try {
      if (recorderState.isRecording) {
        console.warn('Already recording a GIF');
        return;
      }
      
      const workerCount = options.workers || defaultOptions.workers || 2;
      const quality = options.quality || defaultOptions.quality || 10;
      const delay = options.delay || defaultOptions.delay || 100;
      const maxFrames = options.maxFrames || defaultOptions.maxFrames || 100;
      
      delayRef.current = delay;
      maxFramesRef.current = maxFrames;
      framesRef.current = 0;
      
      // Create a new GIF recorder
      gifRef.current = new GIF({
        workers: workerCount,
        quality: quality,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js', // This file needs to be served from the public directory
        debug: process.env.NODE_ENV === 'development'
      });
      
      // Setup event listeners
      gifRef.current.on('progress', (progress) => {
        setRecorderState(prev => ({ ...prev, progress }));
      });
      
      gifRef.current.on('finished', (blob) => {
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glitchmixer-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.gif`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        setRecorderState({
          isRecording: false,
          isProcessing: false,
          progress: 0,
          frameCount: 0,
          error: null
        });
      });
      
      // Start the recording state
      setRecorderState({
        isRecording: true,
        isProcessing: false,
        progress: 0,
        frameCount: 0,
        error: null
      });
      
      // Setup interval to capture frames
      intervalRef.current = window.setInterval(() => {
        if (framesRef.current >= maxFramesRef.current) {
          stopRecording();
          return;
        }
        
        try {
          gifRef.current?.addFrame(canvas, { delay: delayRef.current, copy: true });
          framesRef.current++;
          
          setRecorderState(prev => ({
            ...prev,
            frameCount: framesRef.current
          }));
        } catch (err) {
          console.error('Error adding frame:', err);
          stopRecording();
          setRecorderState(prev => ({
            ...prev, 
            error: 'Error capturing frame'
          }));
        }
      }, delayRef.current);
      
    } catch (err) {
      console.error('Error starting GIF recording:', err);
      setRecorderState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording'
      }));
    }
  }, [recorderState.isRecording, defaultOptions]);
  
  // Stop recording and render the GIF
  const stopRecording = useCallback(() => {
    if (!recorderState.isRecording) {
      console.warn('No active recording to stop');
      return;
    }
    
    // Clear the frame capture interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Render the GIF if we have frames
    if (framesRef.current > 0 && gifRef.current) {
      setRecorderState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: true,
      }));
      
      try {
        gifRef.current.render();
      } catch (err) {
        console.error('Error rendering GIF:', err);
        setRecorderState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'Failed to render GIF'
        }));
      }
    } else {
      setRecorderState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: framesRef.current === 0 ? 'No frames captured' : 'Recorder not initialized'
      }));
    }
  }, [recorderState.isRecording]);
  
  // Cancel recording without rendering
  const cancelRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (gifRef.current) {
      try {
        gifRef.current.abort();
      } catch (err) {
        console.error('Error aborting GIF:', err);
      }
    }
    
    setRecorderState({
      isRecording: false,
      isProcessing: false,
      progress: 0,
      frameCount: 0,
      error: null
    });
  }, []);
  
  return {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording: recorderState.isRecording,
    isProcessing: recorderState.isProcessing,
    progress: recorderState.progress,
    frameCount: recorderState.frameCount,
    error: recorderState.error
  };
}; 