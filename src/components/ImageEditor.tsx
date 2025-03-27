import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Slider,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import { GlitchOptions, useGlitchEffect } from '../hooks/useGlitchEffect';
import EffectControls from './EffectControls';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { useAnimatedEffects } from '../hooks/useAnimatedEffects';
import { useGifRecorder } from '../hooks/useGifRecorder';
import { useAnimatedGif } from '../hooks/useAnimatedGif';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface ImageEditorProps {
  imageUrl: string | null;
}

// Define the resolution presets
interface ResolutionPreset {
  name: string;
  width: number;
  height: number;
}

// Expand resolution presets with more options
const resolutionPresets: ResolutionPreset[] = [
  { name: 'Original', width: 0, height: 0 }, // 0 means use original image dimensions
  
  // Standard resolutions
  { name: '480p', width: 854, height: 480 },
  { name: '720p', width: 1280, height: 720 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: '1440p', width: 2560, height: 1440 },
  { name: '4K', width: 3840, height: 2160 },
  
  // Square formats
  { name: 'Square (256)', width: 256, height: 256 },
  { name: 'Square (512)', width: 512, height: 512 },
  { name: 'Square (1024)', width: 1024, height: 1024 },
  
  // Social media formats
  { name: 'Instagram', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Twitter', width: 1200, height: 675 },
  { name: 'Facebook', width: 1200, height: 630 },
  
  // Print formats (for artistic prints)
  { name: 'A4 Print', width: 2480, height: 3508 },
  { name: 'A5 Print', width: 1748, height: 2480 },
  
  // Custom option last
  { name: 'Custom', width: 800, height: 600 },
];

const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEffects, setUserEffects] = useState<GlitchOptions>({});
  const { applyEffects } = useGlitchEffect();
  
  // Audio analyzer hook
  const [audioData, startAudioAnalysis, stopAudioAnalysis] = useAudioAnalyzer();
  
  // Animation options state
  const [animationOptions, setAnimationOptions] = useState({
    enabled: false,
    speed: 0.5,
    intensity: 0.5,
    audioReactive: false,
    chaotic: false
  });
  
  // Animated effects hook
  const [effectsToApply, updateAnimationOptions, currentAnimationOptions] = useAnimatedEffects(
    userEffects, 
    audioData
  );

  // First, let's add a state to hold the image data
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Add a state to store the original image data
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

  // New state for resolution control
  const [selectedResolution, setSelectedResolution] = useState<ResolutionPreset>(resolutionPresets[0]);
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1.33); // Default 4:3
  
  // GIF recorder hook
  const gifRecorder = useGifRecorder({
    delay: 100, // 10 fps
    maxFrames: 50, // 5 seconds at 10 fps
    quality: 10,
    workers: 4
  });

  // Add cropping and resize parameters
  const [cropMode, setCropMode] = useState<'fill' | 'fit' | 'crop'>('fit');
  const [cropPosition, setCropPosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  
  // Add a state for chaotic mode
  const [chaoticMode, setChaoticMode] = useState(false);
  
  // Add state for tracking if the loaded image is an animated GIF
  const [isAnimatedGif, setIsAnimatedGif] = useState(false);

  // Initialize the animated GIF hook
  const animatedGif = useAnimatedGif();

  // Add state persistence between image changes
  // Move the cleanup of image-specific state out of the image loading effect
  useEffect(() => {
    if (!imageUrl) {
      console.log("No image URL provided");
      setError('No image URL provided');
      setIsLoading(false);
      return;
    }
    
    console.log("ImageEditor: Loading image from URL:", imageUrl);
    
    // Clean up previous state but KEEP effect settings
    if (isAnimatedGif) {
      console.log("ImageEditor: Cleaning up previous animated GIF");
      animatedGif.pause();
    }
    
    // Reset only image-specific states
    setImageElement(null);
    setOriginalImageData(null);
    setIsLoading(true);
    setError(null);
    setIsAnimatedGif(false);
    
    // Keep current effect settings (userEffects) intact!
    // Keep current animation settings intact!
    // Keep current resolution and crop settings intact!
    
    // Check if the URL is potentially a GIF by extension
    const isGif = typeof imageUrl === 'string' && (
      imageUrl.toLowerCase().endsWith('.gif') || 
      imageUrl.toLowerCase().includes('data:image/gif')
    );
    
    if (isGif) {
      console.log("ImageEditor: Detected potential GIF file, attempting to load");
      // Try to load it as an animated GIF first
      animatedGif.loadGif(imageUrl)
        .then((success) => {
          if (!success) {
            throw new Error("Failed to load as animated GIF");
          }
          
          console.log("ImageEditor: Animated GIF loaded successfully with dimensions:", 
            animatedGif.width, "x", animatedGif.height);
          
          setIsAnimatedGif(true);
          setIsLoading(false);
          
          // Set initial aspect ratio and update canvas dimensions
          if (animatedGif.width && animatedGif.height) {
            setAspectRatio(animatedGif.width / animatedGif.height);
            
            // If using original resolution, set custom dimensions to match GIF
            if (selectedResolution.name === 'Original') {
              setCustomWidth(animatedGif.width);
              setCustomHeight(animatedGif.height);
            }
            
            // Schedule canvas update after state changes have been applied
            setTimeout(() => {
              console.log("ImageEditor: Updating canvas dimensions for GIF");
              updateCanvasDimensions();
              
              // After loading, automatically start playing the GIF
              setTimeout(() => {
                console.log("ImageEditor: Starting GIF playback");
                animatedGif.play();
              }, 100);
            }, 50);
          }
        })
        .catch((err) => {
          console.warn("ImageEditor: Failed to load as animated GIF, falling back to static image:", err);
          // Fall back to loading as a static image
          setIsAnimatedGif(false);
          loadStaticImage(imageUrl);
        });
    } else {
      console.log("ImageEditor: Not a GIF, loading as static image");
      // Load as a static image directly
      setIsAnimatedGif(false);
      loadStaticImage(imageUrl);
    }
    
    // Clean up function
    return () => {
      console.log("ImageEditor: Cleaning up image loading effect");
      // Stop any GIF animations
      if (isAnimatedGif) {
        animatedGif.pause();
      }
    };
  }, [imageUrl]);

  // Add local storage for effect settings persistence
  // This will run once on component mount to load saved settings from localStorage
  useEffect(() => {
    try {
      // Load saved settings from localStorage if available
      const savedEffects = localStorage.getItem('glitchMixer_effects');
      const savedAnimationSettings = localStorage.getItem('glitchMixer_animation');
      const savedResolutionSettings = localStorage.getItem('glitchMixer_resolution');
      
      if (savedEffects) {
        const parsedEffects = JSON.parse(savedEffects);
        console.log("ImageEditor: Loaded saved effects from localStorage");
        setUserEffects(parsedEffects);
      }
      
      if (savedAnimationSettings) {
        const parsedAnimationSettings = JSON.parse(savedAnimationSettings);
        console.log("ImageEditor: Loaded saved animation settings from localStorage");
        setAnimationOptions(parsedAnimationSettings);
        
        // Apply animation settings to the hook
        updateAnimationOptions(parsedAnimationSettings);
        
        // If audio reactive was on, restart audio analysis
        if (parsedAnimationSettings.audioReactive) {
          startAudioAnalysis();
        }
        
        // Set chaotic mode separately since it has its own state
        setChaoticMode(parsedAnimationSettings.chaotic || false);
      }
      
      if (savedResolutionSettings) {
        const parsedResolutionSettings = JSON.parse(savedResolutionSettings);
        console.log("ImageEditor: Loaded saved resolution settings from localStorage");
        
        // Restore resolution settings
        if (parsedResolutionSettings.selectedResolution) {
          const foundPreset = resolutionPresets.find(
            preset => preset.name === parsedResolutionSettings.selectedResolution.name
          );
          
          if (foundPreset) {
            setSelectedResolution(foundPreset);
          }
        }
        
        // Restore custom dimensions
        if (parsedResolutionSettings.customWidth) {
          setCustomWidth(parsedResolutionSettings.customWidth);
        }
        
        if (parsedResolutionSettings.customHeight) {
          setCustomHeight(parsedResolutionSettings.customHeight);
        }
        
        // Restore crop settings
        if (parsedResolutionSettings.cropMode) {
          setCropMode(parsedResolutionSettings.cropMode);
        }
        
        if (parsedResolutionSettings.cropPosition) {
          setCropPosition(parsedResolutionSettings.cropPosition);
        }
        
        // Restore aspect ratio settings
        if (parsedResolutionSettings.maintainAspectRatio !== undefined) {
          setMaintainAspectRatio(parsedResolutionSettings.maintainAspectRatio);
        }
        
        if (parsedResolutionSettings.aspectRatio) {
          setAspectRatio(parsedResolutionSettings.aspectRatio);
        }
      }
    } catch (err) {
      console.error("ImageEditor: Error loading saved settings:", err);
    }
  }, []);

  // Save effect settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('glitchMixer_effects', JSON.stringify(userEffects));
    } catch (err) {
      console.error("ImageEditor: Error saving effect settings to localStorage:", err);
    }
  }, [userEffects]);

  // Save animation settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('glitchMixer_animation', JSON.stringify(animationOptions));
    } catch (err) {
      console.error("ImageEditor: Error saving animation settings to localStorage:", err);
    }
  }, [animationOptions]);

  // Save resolution settings to localStorage whenever they change
  useEffect(() => {
    try {
      const resolutionSettings = {
        selectedResolution,
        customWidth,
        customHeight,
        cropMode,
        cropPosition,
        maintainAspectRatio,
        aspectRatio
      };
      
      localStorage.setItem('glitchMixer_resolution', JSON.stringify(resolutionSettings));
    } catch (err) {
      console.error("ImageEditor: Error saving resolution settings to localStorage:", err);
    }
  }, [selectedResolution, customWidth, customHeight, cropMode, cropPosition, maintainAspectRatio, aspectRatio]);

  // Improve the static image loading function
  const loadStaticImage = (url: string) => {
    console.log("ImageEditor: Loading static image:", url);
    
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    
    image.onload = () => {
      console.log("ImageEditor: Static image loaded successfully:", image.width, "x", image.height);
      setImageElement(image);
      setIsAnimatedGif(false);
      setIsLoading(false);
      
      // Set initial aspect ratio
      setAspectRatio(image.width / image.height);
      
      // If using original resolution, set custom dimensions to match image
      if (selectedResolution.name === 'Original') {
        setCustomWidth(image.width);
        setCustomHeight(image.height);
      }
      
      // Schedule canvas update after state changes have been applied
      setTimeout(() => {
        console.log("ImageEditor: Updating canvas dimensions for static image");
        updateCanvasDimensions();
      }, 50);
    };
    
    image.onerror = (err) => {
      console.error("ImageEditor: Error loading image:", err);
      setError('Failed to load the image. Check the URL or file format.');
      setIsLoading(false);
      setImageElement(null);
    };
    
    try {
      // For data URLs or regular URLs
      image.src = url;
    } catch (err) {
      console.error("ImageEditor: Error setting image source:", err);
      setError('Invalid image URL or format.');
      setIsLoading(false);
    }
  };

  // Update the GIF rendering effect to be more robust
  useEffect(() => {
    if (!isAnimatedGif || isLoading || !canvasRef.current) {
      return;
    }
    
    console.log("ImageEditor: Setting up animated GIF rendering loop");
    
    // Function to render the current frame with effects
    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Render the current frame of the animated GIF to the canvas
      const rendered = animatedGif.renderToCanvas(canvas, (canvas) => {
        // Apply glitch effects to the rendered frame
        try {
          // Use animated effects if animation is enabled, otherwise use manual user effects
          const effectsToUse = animationOptions.enabled ? effectsToApply : userEffects;
          applyEffects(canvas, effectsToUse);
        } catch (err) {
          console.error('ImageEditor: Error applying effects to GIF frame:', err);
        }
      });
      
      if (!rendered) {
        console.warn("ImageEditor: Failed to render GIF frame - frame data may be missing");
      }
    };
    
    // Create a stable animation loop
    let animationFrameId: number | null = null;
    let lastFrameIndex = animatedGif.currentFrameIndex;
    
    const animate = () => {
      try {
        // Only re-render if the frame has changed or we need to apply animated effects
        if (lastFrameIndex !== animatedGif.currentFrameIndex || animationOptions.enabled) {
          renderFrame();
          lastFrameIndex = animatedGif.currentFrameIndex;
        }
        
        animationFrameId = requestAnimationFrame(animate);
      } catch (error) {
        console.error("ImageEditor: Error in GIF animation loop:", error);
        // Try to recover by requesting another frame
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(animate);
    
    // Clean up on unmount or when dependencies change
    return () => {
      console.log("ImageEditor: Cleaning up animated GIF rendering");
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
  }, [isAnimatedGif, isLoading, animatedGif.currentFrameIndex, applyEffects, userEffects, effectsToApply, animationOptions.enabled]);

  // Improve the updateCanvasDimensions function to handle edge cases
  const updateCanvasDimensions = () => {
    console.log("ImageEditor: Updating canvas dimensions, animated GIF:", isAnimatedGif);
    
    if ((!imageElement && !isAnimatedGif) || !canvasRef.current) {
      console.warn("ImageEditor: Can't update canvas - no image or canvas");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error("ImageEditor: Failed to get canvas context");
      return;
    }
    
    let newWidth, newHeight;
    
    // Get source dimensions (either from static image or animated GIF)
    const sourceWidth = isAnimatedGif ? animatedGif.width : (imageElement ? imageElement.width : 0);
    const sourceHeight = isAnimatedGif ? animatedGif.height : (imageElement ? imageElement.height : 0);
    
    if (!sourceWidth || !sourceHeight) {
      console.warn("ImageEditor: Source dimensions are zero or missing");
      return;
    }
    
    console.log("ImageEditor: Source dimensions:", sourceWidth, "x", sourceHeight);
    
    // If not using original dimensions, apply the selected resolution
    if (selectedResolution.width !== 0 && selectedResolution.height !== 0) {
      if (selectedResolution.name === 'Custom') {
        newWidth = customWidth;
        newHeight = customHeight;
      } else {
        newWidth = selectedResolution.width;
        newHeight = selectedResolution.height;
      }
    } else {
      // Use original dimensions
      newWidth = sourceWidth;
      newHeight = sourceHeight;
    }
    
    console.log("ImageEditor: New canvas dimensions:", newWidth, "x", newHeight);
    
    // Update canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // For static images, draw the image with the appropriate cropping
    if (!isAnimatedGif && imageElement) {
      console.log("ImageEditor: Drawing static image with crop mode:", cropMode);
      // Calculate source and destination parameters based on crop mode
      let sourceX = 0, sourceY = 0, sourceWidth = imageElement.width, sourceHeight = imageElement.height;
      let destX = 0, destY = 0, destWidth = newWidth, destHeight = newHeight;
      
      if (cropMode === 'fit') {
        // Fit the image inside canvas dimensions while maintaining aspect ratio
        const scale = Math.min(newWidth / imageElement.width, newHeight / imageElement.height);
        destWidth = imageElement.width * scale;
        destHeight = imageElement.height * scale;
        
        // Center the image
        destX = (newWidth - destWidth) / 2;
        destY = (newHeight - destHeight) / 2;
        
        // Fill background with black
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
      } else if (cropMode === 'crop') {
        // Crop the image to fit exactly into the canvas dimensions
        const scale = Math.max(newWidth / imageElement.width, newHeight / imageElement.height);
        
        sourceWidth = Math.min(imageElement.width, newWidth / scale);
        sourceHeight = Math.min(imageElement.height, newHeight / scale);
        
        // Adjust source position based on crop position
        if (cropPosition === 'top') {
          sourceY = 0;
        } else if (cropPosition === 'bottom') {
          sourceY = imageElement.height - sourceHeight;
        } else if (cropPosition === 'left') {
          sourceX = 0;
        } else if (cropPosition === 'right') {
          sourceX = imageElement.width - sourceWidth;
        } else { // center
          sourceX = (imageElement.width - sourceWidth) / 2;
          sourceY = (imageElement.height - sourceHeight) / 2;
        }
      }
      
      // Draw image with appropriate positioning and scaling
      ctx.drawImage(
        imageElement,
        sourceX, sourceY, sourceWidth, sourceHeight,
        destX, destY, destWidth, destHeight
      );
      
      // Store the original image data at the new resolution
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imgData);
      
      // Apply current effects
      if (Object.keys(userEffects).length > 0) {
        try {
          applyEffects(canvas, userEffects);
        } catch (err) {
          console.error('Error applying effects after resize:', err);
        }
      }
    } else if (isAnimatedGif) {
      console.log("ImageEditor: Canvas prepared for animated GIF rendering");
      // For animated GIFs, the animation loop will handle rendering
    } else {
      console.warn("ImageEditor: Neither static image nor animated GIF available");
    }
  };

  // Update GIF recording to handle animated GIFs
  const handleStartGifRecording = () => {
    if (!canvasRef.current) return;
    
    if (isAnimatedGif) {
      // For animated GIFs, use the generateGif method from our hook to process all frames
      setIsRecordingAnimatedGif(true);
      
      animatedGif.generateGif(
        canvasRef.current, 
        (canvas) => {
          // Apply effects to each frame
          const effectsToUse = animationOptions.enabled ? effectsToApply : userEffects;
          applyEffects(canvas, effectsToUse);
        },
        { 
          quality: 10,
          workers: 4
        }
      ).then((blob) => {
        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glitched-gif-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.gif`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        setIsRecordingAnimatedGif(false);
      }).catch((err) => {
        console.error('Error generating GIF:', err);
        setIsRecordingAnimatedGif(false);
      });
    } else {
      // For static images, use the regular GIF recorder
      gifRecorder.startRecording(canvasRef.current, {
        delay: 100, // 100ms between frames = 10fps
        maxFrames: 50 // 5 seconds at 10fps
      });
    }
  };

  // Add state for tracking animated GIF recording
  const [isRecordingAnimatedGif, setIsRecordingAnimatedGif] = useState(false);

  // Add back the effects that were removed
  // Effect to apply resolution changes when image is loaded
  useEffect(() => {
    if ((!imageElement && !isAnimatedGif) || isLoading) return;
    
    console.log("Updating canvas with selected resolution");
    updateCanvasDimensions();
  }, [imageElement, isAnimatedGif, isLoading, selectedResolution, customWidth, customHeight, cropMode, cropPosition]);

  // Update the effect application to always start from the original image for static images
  useEffect(() => {
    if (isAnimatedGif || !imageElement || isLoading || !canvasRef.current || !originalImageData) return;
    
    console.log("Applying updated effects to canvas");
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Start with the original image
    ctx.putImageData(originalImageData, 0, 0);
    
    // Use animated effects if animation is enabled, otherwise use manual user effects
    const effectsToUse = animationOptions.enabled ? effectsToApply : userEffects;
    
    try {
      console.log("Applying effects:", JSON.stringify(effectsToUse).substring(0, 100) + "...");
      applyEffects(canvas, effectsToUse);
    } catch (err) {
      console.error('Error applying effects:', err);
    }
  }, [effectsToApply, userEffects, isLoading, animationOptions.enabled, applyEffects, imageElement, originalImageData, isAnimatedGif]);

  // Functions to handle GIF recording
  const handleStopGifRecording = () => {
    gifRecorder.stopRecording();
  };

  // Handle animation toggle
  useEffect(() => {
    updateAnimationOptions({
      enabled: animationOptions.enabled,
      speed: animationOptions.speed,
      intensity: animationOptions.intensity,
      audioReactive: animationOptions.audioReactive
    });
    
    // Start or stop audio analysis when animation and audio reactivity are toggled
    if (animationOptions.enabled && animationOptions.audioReactive) {
      startAudioAnalysis();
    } else if (!animationOptions.audioReactive) {
      stopAudioAnalysis();
    }
  }, [
    animationOptions.enabled, 
    animationOptions.speed, 
    animationOptions.intensity, 
    animationOptions.audioReactive, 
    updateAnimationOptions, 
    startAudioAnalysis, 
    stopAudioAnalysis
  ]);
  
  // Function to handle resolution dialog
  const handleOpenResolutionDialog = () => {
    setResolutionDialogOpen(true);
  };
  
  const handleCloseResolutionDialog = () => {
    setResolutionDialogOpen(false);
  };
  
  const handleResolutionChange = (preset: ResolutionPreset) => {
    setSelectedResolution(preset);
    
    // Update custom dimensions for the Custom preset
    if (preset.name === 'Custom') {
      // Do nothing, we'll use the existing customWidth and customHeight
    } else if (preset.name === 'Original' && imageElement) {
      // Set custom dimensions to match original for aspect ratio calculations
      setCustomWidth(imageElement.width);
      setCustomHeight(imageElement.height);
    } else {
      // Set custom dimensions to match the selected preset
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
  };
  
  // Update custom dimensions with aspect ratio preservation
  const handleCustomWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(event.target.value, 10);
    setCustomWidth(width);
    
    if (maintainAspectRatio && !isNaN(width)) {
      // Calculate new height based on aspect ratio
      setCustomHeight(Math.round(width / aspectRatio));
    }
  };
  
  const handleCustomHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(event.target.value, 10);
    setCustomHeight(height);
    
    if (maintainAspectRatio && !isNaN(height)) {
      // Calculate new width based on aspect ratio
      setCustomWidth(Math.round(height * aspectRatio));
    }
  };
  
  // Handle aspect ratio toggle
  const handleAspectRatioToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setMaintainAspectRatio(checked);
    
    if (checked && imageElement) {
      // When turning it on, recalculate the aspect ratio from the current custom dimensions
      setAspectRatio(customWidth / customHeight);
    }
  };
  
  // Update user effects
  const handleEffectsChange = (newEffects: GlitchOptions) => {
    setUserEffects(newEffects);
  };
  
  // Reset effects
  const handleReset = () => {
    // Reset effect options
    setUserEffects({
      pixelSort: undefined,
      dataBend: undefined,
      channelShift: undefined,
      noise: 0,
      invert: [],
      quantize: undefined,
      redChannel: undefined,
      greenChannel: undefined,
      blueChannel: undefined,
    });
    
    // Reset the canvas to the original image
    if (canvasRef.current && originalImageData) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
    
    // If animation is enabled, keep it running but with reset effects
    if (animationOptions.enabled) {
      updateAnimationOptions({
        enabled: true,
        speed: animationOptions.speed,
        intensity: animationOptions.intensity,
        audioReactive: animationOptions.audioReactive
      });
    }
  };
  
  // Save image
  const handleSave = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'glitched-image.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // Handle animation and audio controls
  const handleAnimationEnabledChange = (enabled: boolean) => {
    setAnimationOptions(prev => ({ ...prev, enabled }));
    updateAnimationOptions({ enabled });
  };
  
  const handleAnimationSpeedChange = (speed: number) => {
    setAnimationOptions(prev => ({ ...prev, speed }));
    updateAnimationOptions({ speed });
  };
  
  const handleAnimationIntensityChange = (intensity: number) => {
    setAnimationOptions(prev => ({ ...prev, intensity }));
    updateAnimationOptions({ intensity });
  };
  
  const handleAudioReactiveChange = (audioReactive: boolean) => {
    setAnimationOptions(prev => ({ ...prev, audioReactive }));
    updateAnimationOptions({ audioReactive });
  };
  
  const handleMicrophoneToggle = () => {
    if (audioData.isActive) {
      stopAudioAnalysis();
    } else {
      startAudioAnalysis();
    }
  };
  
  // Add handlers for crop mode and position
  const handleCropModeChange = (mode: 'fill' | 'fit' | 'crop') => {
    setCropMode(mode);
  };
  
  const handleCropPositionChange = (position: 'center' | 'top' | 'bottom' | 'left' | 'right') => {
    setCropPosition(position);
  };
  
  // Update animation options when chaotic mode changes
  useEffect(() => {
    setAnimationOptions(prev => ({
      ...prev,
      chaotic: chaoticMode
    }));
  }, [chaoticMode]);

  // Add the chaotic mode handler function
  const handleChaoticModeChange = (chaotic: boolean) => {
    setChaoticMode(chaotic);
    updateAnimationOptions({ chaotic });
  };

  // Add global cleanup for all animations and timers
  useEffect(() => {
    // Nothing to setup, this is just for cleanup
    
    return () => {
      console.log("ImageEditor: Global cleanup on unmount");
      
      // Stop any GIF animations
      if (isAnimatedGif) {
        animatedGif.pause();
      }
      
      // Stop audio analysis
      stopAudioAnalysis();
      
      // Stop any GIF recording
      if (gifRecorder.isRecording) {
        gifRecorder.stopRecording();
      }
      
      // Clear any animation frames or timers
      if (animationOptions.enabled) {
        updateAnimationOptions({ enabled: false });
      }
    };
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            backgroundColor: 'rgba(18, 18, 18, 0.8)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <Box 
                sx={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh',
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexGrow: 1,
                  width: '100%',
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    display: 'block',
                  }} 
                />
              </Box>
              
              <Box sx={{ 
                mt: 2, 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center' 
              }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleOpenResolutionDialog}
                  sx={{ 
                    color: '#fff', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 0.5,
                    px: 1.5
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {selectedResolution.name === 'Custom' 
                      ? `Custom (${customWidth}x${customHeight})` 
                      : selectedResolution.name === 'Original' && (imageElement || isAnimatedGif)
                        ? `Original (${isAnimatedGif ? animatedGif.width : imageElement!.width}x${isAnimatedGif ? animatedGif.height : imageElement!.height})`
                        : selectedResolution.name
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    {cropMode === 'fill' ? 'Stretch' : cropMode === 'fit' ? 'Letterbox' : 'Crop'}
                    {cropMode === 'crop' && ` (${cropPosition})`}
                    {isAnimatedGif && ' • Animated GIF'}
                  </Typography>
                </Button>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {/* Add GIF control buttons if this is an animated GIF */}
                  {isAnimatedGif && (
                    <Box sx={{ mr: 2, display: 'flex', gap: 1 }}>
                      <Tooltip title={animatedGif.isPlaying ? "Pause GIF" : "Play GIF"}>
                        <IconButton
                          size="small"
                          onClick={() => animatedGif.isPlaying ? animatedGif.pause() : animatedGif.play()}
                          sx={{ 
                            color: '#fff',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                          }}
                        >
                          {animatedGif.isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset to First Frame">
                        <IconButton
                          size="small"
                          onClick={() => animatedGif.reset()}
                          sx={{ 
                            color: '#fff',
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                          }}
                        >
                          <RestartAltIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Box sx={{ 
                        fontSize: '0.75rem', 
                        color: '#fff', 
                        ml: 0.5, 
                        opacity: 0.8, 
                        display: 'flex', 
                        alignItems: 'center' 
                      }}>
                        {animatedGif.currentFrameIndex + 1}/{animatedGif.frameCount}
                      </Box>
                    </Box>
                  )}
                  
                  {isRecordingAnimatedGif ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '140px' }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      <Typography variant="caption" sx={{ color: '#fff' }}>
                        Processing GIF...
                      </Typography>
                    </Box>
                  ) : gifRecorder.isRecording ? (
                    <Tooltip title="Stop Recording">
                      <span>
                        <IconButton 
                          color="error" 
                          onClick={handleStopGifRecording}
                          sx={{ 
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                              '0%': { opacity: 0.7 },
                              '50%': { opacity: 1 },
                              '100%': { opacity: 0.7 },
                            }
                          }}
                        >
                          <StopIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : gifRecorder.isProcessing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '120px' }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      <Typography variant="caption" sx={{ color: '#fff' }}>
                        {Math.round(gifRecorder.progress * 100)}%
                      </Typography>
                    </Box>
                  ) : (
                    <Tooltip title={isAnimatedGif ? "Process GIF with Effects" : "Record GIF (5 seconds)"}>
                      <span>
                        <IconButton 
                          color="primary" 
                          onClick={handleStartGifRecording}
                          disabled={!imageElement && !isAnimatedGif}
                        >
                          <VideocamIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              
              {gifRecorder.error && (
                <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                  {gifRecorder.error}
                </Alert>
              )}
              
              {gifRecorder.isRecording && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(gifRecorder.frameCount / 50) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" sx={{ color: '#fff', display: 'block', textAlign: 'center', mt: 0.5 }}>
                    Recording frame {gifRecorder.frameCount}/50
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <EffectControls 
          effects={userEffects} 
          onChange={handleEffectsChange} 
          onReset={handleReset} 
          onSave={handleSave}
          animationEnabled={animationOptions.enabled}
          onAnimationToggle={handleAnimationEnabledChange}
          animationSpeed={animationOptions.speed}
          onAnimationSpeedChange={handleAnimationSpeedChange}
          animationIntensity={animationOptions.intensity}
          onAnimationIntensityChange={handleAnimationIntensityChange}
          chaoticMode={chaoticMode}
          onChaoticModeToggle={handleChaoticModeChange}
          audioReactive={animationOptions.audioReactive}
          onAudioReactiveToggle={handleAudioReactiveChange}
          microphoneActive={audioData.isActive}
          onMicrophoneToggle={handleMicrophoneToggle}
        />
      </Grid>
      
      {/* Resolution Dialog */}
      <Dialog 
        open={resolutionDialogOpen} 
        onClose={handleCloseResolutionDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 32, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle>Canvas Resolution</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
            Resolution Presets
          </Typography>
          <Grid container spacing={2}>
            {resolutionPresets.map((preset) => (
              <Grid item xs={6} sm={4} md={3} key={preset.name}>
                <Button
                  variant={selectedResolution.name === preset.name ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => handleResolutionChange(preset)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: selectedResolution.name === preset.name ? '#fff' : 'rgba(255,255,255,0.8)',
                    height: '100%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 8px'
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    {preset.name}
                  </Typography>
                  {preset.name !== 'Original' && (
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {preset.width}x{preset.height}
                    </Typography>
                  )}
                  {preset.name === 'Original' && imageElement && (
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {imageElement.width}x{imageElement.height}
                    </Typography>
                  )}
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {selectedResolution.name === 'Custom' && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Custom Dimensions
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    label="Width"
                    type="number"
                    value={customWidth}
                    onChange={handleCustomWidthChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 4000 } }}
                    variant="outlined"
                    size="small"
                    sx={{
                      input: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={2} sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">×</Typography>
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    label="Height"
                    type="number"
                    value={customHeight}
                    onChange={handleCustomHeightChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 4000 } }}
                    variant="outlined"
                    size="small"
                    sx={{
                      input: { color: '#fff' },
                      label: { color: 'rgba(255,255,255,0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={maintainAspectRatio}
                  onChange={handleAspectRatioToggle}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#0A84FF',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#0A84FF',
                    }
                  }}
                />
                <Typography variant="body2">Maintain aspect ratio</Typography>
              </Box>
            </Box>
          )}
          
          {/* Crop Controls */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              Resize Mode
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Button
                  variant={cropMode === 'fill' ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => handleCropModeChange('fill')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: cropMode === 'fill' ? '#fff' : 'rgba(255,255,255,0.8)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 8px'
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Fill
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Stretch to fit
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant={cropMode === 'fit' ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => handleCropModeChange('fit')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: cropMode === 'fit' ? '#fff' : 'rgba(255,255,255,0.8)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 8px'
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Fit
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Letterbox/pillarbox
                  </Typography>
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button
                  variant={cropMode === 'crop' ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => handleCropModeChange('crop')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: cropMode === 'crop' ? '#fff' : 'rgba(255,255,255,0.8)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 8px'
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Crop
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Cut to fit
                  </Typography>
                </Button>
              </Grid>
            </Grid>
            
            {cropMode === 'crop' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Crop Position
                </Typography>
                <Grid container spacing={1}>
                  {['center', 'top', 'bottom', 'left', 'right'].map((position) => (
                    <Grid item xs={true} key={position}>
                      <Button
                        variant={cropPosition === position ? "contained" : "outlined"}
                        fullWidth
                        onClick={() => handleCropPositionChange(position as any)}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.3)',
                          color: cropPosition === position ? '#fff' : 'rgba(255,255,255,0.8)',
                          textTransform: 'capitalize'
                        }}
                      >
                        {position}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
              <Typography variant="body2" color="rgba(255,255,255,0.7)">
                <strong>Fill:</strong> Stretches the image to match the target dimensions exactly.
                <br />
                <strong>Fit:</strong> Maintains aspect ratio and adds black bars if needed.
                <br />
                <strong>Crop:</strong> Maintains aspect ratio but crops the image to fill the dimensions.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseResolutionDialog} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              updateCanvasDimensions();
              handleCloseResolutionDialog();
            }} 
            variant="contained" 
            color="primary"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ImageEditor; 