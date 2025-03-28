import { useState, useRef, useCallback } from 'react';

interface VideoRecorderOptions {
  mimeType?: string;
  bitRate?: number;
  frameRate?: number;
  maxDuration?: number; // Maximum duration in seconds
}

interface VideoRecorderState {
  isRecording: boolean;
  duration: number;
  isProcessing: boolean;
  error: string | null;
}

export const useVideoExport = (defaultOptions: VideoRecorderOptions = {}) => {
  const [recorderState, setRecorderState] = useState<VideoRecorderState>({
    isRecording: false,
    duration: 0,
    isProcessing: false,
    error: null
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const maxDurationRef = useRef<number>(defaultOptions.maxDuration || 30); // 30 seconds default
  
  // Determine supported mime types
  const getSupportedMimeType = useCallback(() => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    throw new Error('No supported video mime types found');
  }, []);

  // Start recording from a canvas
  const startRecording = useCallback((canvas: HTMLCanvasElement, options: VideoRecorderOptions = {}) => {
    try {
      if (recorderState.isRecording) {
        console.warn('Already recording video');
        return;
      }
      
      // Setup configuration
      const mimeType = options.mimeType || defaultOptions.mimeType || getSupportedMimeType();
      const bitRate = options.bitRate || defaultOptions.bitRate || 2500000; // 2.5 Mbps default
      const frameRate = options.frameRate || defaultOptions.frameRate || 30;
      maxDurationRef.current = options.maxDuration || defaultOptions.maxDuration || 30;
      
      // Create a stream from the canvas
      const stream = canvas.captureStream(frameRate);
      streamRef.current = stream;
      
      // Initialize the media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitRate
      });
      
      // Clear previous data
      chunksRef.current = [];
      
      // Setup event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setRecorderState(prev => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
            error: 'No video data captured'
          }));
          return;
        }
        
        setRecorderState(prev => ({
          ...prev,
          isProcessing: true
        }));
        
        try {
          // Create a blob from the chunks
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          
          // Create a download link
          const link = document.createElement('a');
          link.href = url;
          link.download = `glitchmixer-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          link.click();
          
          // Clean up
          URL.revokeObjectURL(url);
          
          setRecorderState({
            isRecording: false,
            isProcessing: false,
            duration: 0,
            error: null
          });
        } catch (err) {
          console.error('Error processing video:', err);
          setRecorderState(prev => ({
            ...prev,
            isProcessing: false,
            error: 'Failed to process video'
          }));
        }
      };
      
      // Start recording
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capture data every second
      startTimeRef.current = Date.now();
      
      // Start a timer to update the duration and enforce max duration
      timerRef.current = window.setInterval(() => {
        const currentDuration = (Date.now() - startTimeRef.current) / 1000;
        
        setRecorderState(prev => ({
          ...prev,
          duration: currentDuration
        }));
        
        if (currentDuration >= maxDurationRef.current) {
          stopRecording();
        }
      }, 100);
      
      setRecorderState({
        isRecording: true,
        duration: 0,
        isProcessing: false,
        error: null
      });
      
    } catch (err) {
      console.error('Error starting video recording:', err);
      setRecorderState(prev => ({
        ...prev,
        isRecording: false,
        error: err instanceof Error ? err.message : 'Failed to start recording'
      }));
    }
  }, [recorderState.isRecording, defaultOptions, getSupportedMimeType]);
  
  // Stop recording and process the video
  const stopRecording = useCallback(() => {
    if (!recorderState.isRecording || !mediaRecorderRef.current) {
      console.warn('No active recording to stop');
      return;
    }
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the media recorder
    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error('Error stopping recorder:', err);
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
  }, [recorderState.isRecording]);
  
  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && recorderState.isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear data
    chunksRef.current = [];
    
    setRecorderState({
      isRecording: false,
      duration: 0,
      isProcessing: false,
      error: null
    });
  }, [recorderState.isRecording]);
  
  // Format duration as MM:SS
  const formattedDuration = useCallback(() => {
    const totalSeconds = Math.floor(recorderState.duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [recorderState.duration]);
  
  return {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording: recorderState.isRecording,
    isProcessing: recorderState.isProcessing,
    duration: recorderState.duration,
    formattedDuration: formattedDuration(),
    error: recorderState.error,
    maxDuration: maxDurationRef.current
  };
}; 