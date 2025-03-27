import { useState, useEffect, useRef, useCallback } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';

interface Frame {
  imageData: ImageData;
  delay: number;
}

interface AnimatedGifState {
  frames: Frame[];
  width: number;
  height: number;
  currentFrameIndex: number;
  isPlaying: boolean;
  originalDelays: number[];
  isLoading: boolean;
  error: string | null;
}

export const useAnimatedGif = () => {
  const [state, setState] = useState<AnimatedGifState>({
    frames: [],
    width: 0,
    height: 0,
    currentFrameIndex: 0,
    isPlaying: false,
    originalDelays: [],
    isLoading: false,
    error: null
  });
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTimeOffsetRef = useRef<number>(0);
  
  // Initialize a temp canvas for frame extraction if needed
  useEffect(() => {
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
    }
    
    return () => {
      // Clean up animation on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Load GIF and extract frames
  const loadGif = useCallback(async (gifUrl: string) => {
    console.log("useAnimatedGif: Starting to load GIF from URL:", gifUrl);
    
    // Reset animation state
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      frames: [],
      isPlaying: false,
      currentFrameIndex: 0
    }));
    
    try {
      // Clear previous GIF data
      frameTimeOffsetRef.current = 0;
      
      // Fetch the GIF file
      console.log("useAnimatedGif: Fetching GIF from:", gifUrl);
      let response;
      try {
        response = await fetch(gifUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        const fetchError = error as Error;
        console.error("useAnimatedGif: Fetch error:", fetchError);
        throw new Error(`Failed to fetch GIF: ${fetchError.message}`);
      }
      
      let arrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
        console.log("useAnimatedGif: GIF file fetched, size:", arrayBuffer.byteLength, "bytes");
      } catch (bufferError) {
        console.error("useAnimatedGif: Buffer error:", bufferError);
        throw new Error("Failed to read GIF data");
      }
      
      // Parse the GIF
      let gif, frames;
      try {
        gif = parseGIF(arrayBuffer);
        frames = decompressFrames(gif, true);
        
        if (!frames || frames.length === 0) {
          throw new Error('No frames found in GIF');
        }
        
        console.log(`useAnimatedGif: GIF parsed successfully. Found ${frames.length} frames.`);
      } catch (parseError) {
        console.error("useAnimatedGif: Parse error:", parseError);
        throw new Error("Failed to parse GIF format. Is this a valid GIF file?");
      }
      
      // Extract dimensions
      const { width, height } = frames[0].dims;
      console.log(`useAnimatedGif: GIF dimensions: ${width}x${height}`);
      
      // Create temp canvas if not already created
      if (!tempCanvasRef.current) {
        tempCanvasRef.current = document.createElement('canvas');
      }
      
      const canvas = tempCanvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        throw new Error('Could not get 2D context from canvas');
      }
      
      // Create ImageData for each frame
      const processedFrames: Frame[] = [];
      const originalDelays: number[] = [];
      
      // Create temporary offscreen canvas for patch rendering
      const patchCanvas = document.createElement('canvas');
      const patchCtx = patchCanvas.getContext('2d', { willReadFrequently: true });
      
      if (!patchCtx) {
        throw new Error('Could not get 2D context from patch canvas');
      }
      
      patchCanvas.width = width;
      patchCanvas.height = height;
      
      // Previous frame for GIF disposal
      let previousImageData: ImageData | null = null;
      
      console.log(`useAnimatedGif: Processing ${frames.length} frames...`);
      
      // Process each frame
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        
        // Handle disposal based on previous frame
        if (i > 0) {
          if (frames[i-1].disposalType === 2) { // Restore to background
            ctx.clearRect(0, 0, width, height);
          } else if (previousImageData && frames[i-1].disposalType !== 3) { // Not "restore to previous"
            ctx.putImageData(previousImageData, 0, 0);
          }
        } else {
          ctx.clearRect(0, 0, width, height);
        }
        
        // Convert patch data to ImageData
        const { width: patchWidth, height: patchHeight, left, top } = frame.dims;
        const patchData = new Uint8ClampedArray(patchWidth * patchHeight * 4);
        
        // Fill patchData with patch pixels
        for (let j = 0; j < frame.pixels.length; j++) {
          const pixel = frame.pixels[j];
          const colorIndex = pixel;
          
          // Handle transparency
          if (colorIndex === frame.transparentIndex) {
            patchData[j * 4 + 3] = 0; // Fully transparent
          } else {
            const color = frame.colorTable[colorIndex] || [0, 0, 0];
            patchData[j * 4] = color[0];     // R
            patchData[j * 4 + 1] = color[1]; // G
            patchData[j * 4 + 2] = color[2]; // B
            patchData[j * 4 + 3] = 255;      // A (fully opaque)
          }
        }
        
        // Create patch ImageData and draw it
        const patchImageData = new ImageData(patchData, patchWidth, patchHeight);
        patchCtx.putImageData(patchImageData, 0, 0);
        
        // Draw patch onto main canvas at the correct position
        ctx.drawImage(patchCanvas, left, top);
        
        // Save current state for next frame
        previousImageData = ctx.getImageData(0, 0, width, height);
        
        // Add to processed frames
        processedFrames.push({
          imageData: ctx.getImageData(0, 0, width, height),
          delay: frame.delay || 100 // Default to 100ms if delay is not specified
        });
        
        originalDelays.push(frame.delay || 100);
      }
      
      console.log(`useAnimatedGif: Finished processing ${processedFrames.length} frames.`);
      
      // Update state with processed frames
      setState({
        frames: processedFrames,
        width,
        height,
        currentFrameIndex: 0,
        isPlaying: false,
        originalDelays,
        isLoading: false,
        error: null
      });
      
      console.log(`useAnimatedGif: GIF loaded successfully. Ready to play.`);
      return true;
      
    } catch (err) {
      console.error('useAnimatedGif: Error loading GIF:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error loading GIF'
      }));
      return false;
    }
  }, []);
  
  // Function to render the current frame to a canvas
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, applyEffects?: (canvas: HTMLCanvasElement) => void) => {
    if (state.frames.length === 0 || state.currentFrameIndex >= state.frames.length) {
      return false;
    }
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return false;
    }
    
    try {
      // Ensure canvas has correct dimensions
      if (canvas.width !== state.width || canvas.height !== state.height) {
        canvas.width = state.width;
        canvas.height = state.height;
      }
      
      // Draw the current frame
      const currentFrame = state.frames[state.currentFrameIndex];
      ctx.putImageData(currentFrame.imageData, 0, 0);
      
      // Apply effects if provided
      if (applyEffects) {
        applyEffects(canvas);
      }
      
      return true;
    } catch (error) {
      console.error("Error rendering GIF frame to canvas:", error);
      return false;
    }
  }, [state.frames, state.currentFrameIndex, state.width, state.height]);
  
  // Start playback of the GIF
  const play = useCallback(() => {
    if (state.frames.length === 0 || state.isPlaying) {
      return;
    }
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setState(prev => ({ ...prev, isPlaying: true }));
    
    // Reset time tracking
    lastTimeRef.current = performance.now();
    frameTimeOffsetRef.current = 0;
    
    let localFrameIndex = state.currentFrameIndex;
    
    const animate = (timestamp: number) => {
      // Return early if we stopped playing
      if (!animationRef.current) return;
      
      const elapsed = timestamp - lastTimeRef.current;
      const currentFrame = state.frames[localFrameIndex];
      
      // Add the elapsed time to our offset tracker
      frameTimeOffsetRef.current += elapsed;
      
      // Check if it's time to advance to the next frame
      if (frameTimeOffsetRef.current >= currentFrame.delay) {
        // Reset the offset, keeping any remainder for smoother animation
        frameTimeOffsetRef.current -= currentFrame.delay;
        
        // Advance to next frame
        localFrameIndex = (localFrameIndex + 1) % state.frames.length;
        
        // Update state with the new frame index
        setState(prev => ({
          ...prev,
          currentFrameIndex: localFrameIndex
        }));
      }
      
      // Update last timestamp
      lastTimeRef.current = timestamp;
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
  }, [state.frames, state.currentFrameIndex, state.isPlaying]);
  
  // Pause playback
  const pause = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);
  
  // Reset to first frame
  const reset = useCallback(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset to first frame and stop
    setState(prev => ({
      ...prev,
      currentFrameIndex: 0,
      isPlaying: false
    }));
  }, []);
  
  // Generate a new animated GIF with effects applied
  const generateGif = useCallback((
    canvas: HTMLCanvasElement, 
    applyEffects: (canvas: HTMLCanvasElement) => void,
    options?: { quality?: number, workers?: number }
  ) => {
    return new Promise<Blob>((resolve, reject) => {
      if (state.frames.length === 0) {
        reject(new Error('No frames available'));
        return;
      }
      
      // We'll use gif.js for encoding
      import('gif.js').then(({ default: GIF }) => {
        const gif = new GIF({
          workers: options?.workers || 4,
          quality: options?.quality || 10,
          width: state.width,
          height: state.height,
          workerScript: '/gif.worker.js'
        });
        
        // Ensure the canvas is the right size
        if (canvas.width !== state.width || canvas.height !== state.height) {
          canvas.width = state.width;
          canvas.height = state.height;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Process each frame
        let frameCount = 0;
        
        const processNextFrame = () => {
          if (frameCount >= state.frames.length) {
            // All frames have been processed
            try {
              gif.on('finished', (blob: Blob) => {
                resolve(blob);
              });
              
              gif.render();
            } catch (err) {
              reject(err);
            }
            return;
          }
          
          // Draw frame to canvas
          ctx.putImageData(state.frames[frameCount].imageData, 0, 0);
          
          // Apply effects
          applyEffects(canvas);
          
          // Add to GIF with original delay
          gif.addFrame(canvas, { 
            delay: state.originalDelays[frameCount],
            copy: true
          });
          
          // Process next frame
          frameCount++;
          setTimeout(processNextFrame, 0); // Use setTimeout to avoid blocking UI
        };
        
        // Start processing frames
        processNextFrame();
      }).catch(err => {
        reject(err);
      });
    });
  }, [state.frames, state.originalDelays, state.width, state.height]);
  
  return {
    loadGif,
    renderToCanvas,
    play,
    pause,
    reset,
    generateGif,
    frames: state.frames,
    width: state.width,
    height: state.height,
    currentFrameIndex: state.currentFrameIndex,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
    frameCount: state.frames.length
  };
}; 