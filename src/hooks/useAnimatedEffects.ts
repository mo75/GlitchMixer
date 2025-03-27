import { useState, useEffect, useRef } from 'react';
import { GlitchOptions } from './useGlitchEffect';
import { AudioData } from './useAudioAnalyzer';

interface AnimationOptions {
  enabled: boolean;
  speed: number; // Animation speed (0-1)
  intensity: number; // Animation intensity (0-1)
  audioReactive: boolean; // Whether to react to audio
  chaotic: boolean; // Whether to use chaotic (random jumps) animation instead of smooth oscillation
}

export const useAnimatedEffects = (
  initialEffects: GlitchOptions, 
  audioData: AudioData
): [GlitchOptions, (newOptions: Partial<AnimationOptions>) => void, AnimationOptions] => {
  const [animationOptions, setAnimationOptions] = useState<AnimationOptions>({
    enabled: false,
    speed: 0.5,
    intensity: 0.5,
    audioReactive: false,
    chaotic: false // Default to smooth animations
  });

  const [currentEffects, setCurrentEffects] = useState<GlitchOptions>(initialEffects);
  const baseEffectsRef = useRef<GlitchOptions>(initialEffects);
  const timeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Update base effects when initialEffects change
  useEffect(() => {
    baseEffectsRef.current = initialEffects;
    if (!animationOptions.enabled) {
      setCurrentEffects(initialEffects);
    }
  }, [initialEffects, animationOptions.enabled]);

  useEffect(() => {
    if (animationOptions.enabled) {
      startAnimation();
    } else {
      stopAnimation();
      setCurrentEffects(baseEffectsRef.current);
    }

    return () => {
      stopAnimation();
    };
  }, [animationOptions.enabled, animationOptions.speed, animationOptions.intensity, animationOptions.audioReactive]);

  const startAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - timeRef.current;
      timeRef.current = timestamp;

      // Animate the effects - always starting with a fresh copy of base effects
      const newEffects = animateEffects(
        JSON.parse(JSON.stringify(baseEffectsRef.current)), // Create a deep copy to avoid mutation
        deltaTime,
        animationOptions,
        audioData
      );
      setCurrentEffects(newEffects);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    timeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const updateAnimationOptions = (newOptions: Partial<AnimationOptions>) => {
    setAnimationOptions(prev => ({ ...prev, ...newOptions }));
  };

  return [currentEffects, updateAnimationOptions, animationOptions];
};

// Helper function to animate effects
function animateEffects(
  baseEffects: GlitchOptions, 
  deltaTime: number, 
  options: AnimationOptions,
  audioData: AudioData
): GlitchOptions {
  // We're now working with a fresh copy of baseEffects, so no need to clone again
  const newEffects = baseEffects;
  
  // Calculate time factors (for oscillations)
  const timeScale = options.speed * 0.001;
  const time = performance.now() * timeScale;
  
  // Base intensity multiplier (0.5-2.0)
  let intensityMultiplier = 0.5 + options.intensity * 1.5;

  // Function to generate value based on animation mode
  const generateValue = (baseValue: number, time: number, amplitude: number): number => {
    if (options.chaotic) {
      // In chaotic mode, we use random jumps that change based on time
      // We use a seeded random approach where the seed changes with time
      const seed = Math.sin(time * 10) * 10000;
      const randomValue = Math.sin(seed) * 0.5 + 0.5; // Convert to 0-1 range
      return Math.max(0, Math.min(1, baseValue + (randomValue * 2 - 1) * amplitude));
    } else {
      // In smooth mode, we use sinusoidal oscillation (the original approach)
      const oscillation = Math.sin(time) * amplitude;
      return Math.max(0, Math.min(1, baseValue + oscillation));
    }
  };

  // Apply audio reactivity if enabled
  if (options.audioReactive && audioData.isActive) {
    // Scale intensity based on audio volume
    intensityMultiplier *= 1 + audioData.volume * 2;
    
    // Apply frequency-specific modulations
    const bassFactor = audioData.bass * 2;
    const midFactor = audioData.mid * 1.5;
    const trebleFactor = audioData.treble;
    
    // Animate pixel sort based on bass
    if (newEffects.pixelSort) {
      newEffects.pixelSort = {
        ...newEffects.pixelSort,
        intensity: generateValue(
          newEffects.pixelSort.intensity || 0.5,
          time,
          0.1 * intensityMultiplier * (1 + bassFactor)
        ),
        // Animate threshold too
        threshold: generateValue(
          newEffects.pixelSort.threshold || 0.5,
          time * 0.62,
          0.08 * intensityMultiplier * (1 + midFactor)
        )
      };
      
      if (intensityMultiplier > 1.2 && Math.sin(time * 0.2) > 0.95) {
        newEffects.pixelSort.vertical = !newEffects.pixelSort.vertical;
      }
    }
    
    // Animate data bend based on mids
    if (newEffects.dataBend) {
      newEffects.dataBend = {
        ...newEffects.dataBend,
        amount: generateValue(
          newEffects.dataBend.amount || 0.5,
          time * 1.3, // Different frequency
          0.15 * intensityMultiplier * (1 + midFactor)
        )
      };
    }
    
    // Animate channel shift based on treble
    if (newEffects.channelShift) {
      newEffects.channelShift = {
        ...newEffects.channelShift,
        amount: generateValue(
          newEffects.channelShift.amount || 0.5,
          time * 0.7, // Different frequency
          0.12 * intensityMultiplier * (1 + trebleFactor)
        )
      };
    }
    
    // Animate noise based on overall volume spikes
    if (typeof newEffects.noise === 'number') {
      newEffects.noise = Math.min(
        1, 
        (newEffects.noise || 0) + (audioData.volume * options.intensity * 0.5)
      );
    }
    
    // Animate channel-specific effects
    if (newEffects.redChannel) {
      if (newEffects.redChannel.pixelSort) {
        newEffects.redChannel.pixelSort.intensity = generateValue(
          newEffects.redChannel.pixelSort.intensity || 0,
          time * 0.8,
          0.2 * intensityMultiplier * bassFactor
        );
      }
      
      if (newEffects.redChannel.noise !== undefined) {
        newEffects.redChannel.noise = generateValue(
          newEffects.redChannel.noise || 0,
          time * 1.2,
          0.2 * intensityMultiplier * trebleFactor
        );
      }
    }
    
    if (newEffects.greenChannel) {
      if (newEffects.greenChannel.dataBend) {
        newEffects.greenChannel.dataBend.amount = generateValue(
          newEffects.greenChannel.dataBend.amount || 0,
          time * 0.9,
          0.2 * intensityMultiplier * midFactor
        );
      }
    }
    
    if (newEffects.blueChannel) {
      if (newEffects.blueChannel.dataBend) {
        newEffects.blueChannel.dataBend.amount = generateValue(
          newEffects.blueChannel.dataBend.amount || 0,
          time * 1.1,
          0.2 * intensityMultiplier * (bassFactor + trebleFactor) / 2
        );
      }
    }
  } else {
    // Regular animation without audio reactivity
    // Animate pixel sort
    if (newEffects.pixelSort) {
      newEffects.pixelSort = {
        ...newEffects.pixelSort,
        intensity: generateValue(
          newEffects.pixelSort.intensity || 0.5,
          time,
          0.1 * intensityMultiplier
        ),
        // Animate threshold too
        threshold: generateValue(
          newEffects.pixelSort.threshold || 0.5,
          time * 0.62, // Different frequency for interesting combinations
          0.08 * intensityMultiplier
        )
      };
      
      // Less frequent vertical toggle for non-audio mode
      if (intensityMultiplier > 1.3 && Math.sin(time * 0.15) > 0.97) {
        newEffects.pixelSort.vertical = !newEffects.pixelSort.vertical;
      }
    }
    
    // Animate data bend
    if (newEffects.dataBend) {
      newEffects.dataBend = {
        ...newEffects.dataBend,
        amount: generateValue(
          newEffects.dataBend.amount || 0.5,
          time * 1.3, // Different frequency
          0.15 * intensityMultiplier
        )
      };
    }
    
    // Animate channel shift
    if (newEffects.channelShift) {
      newEffects.channelShift = {
        ...newEffects.channelShift,
        amount: generateValue(
          newEffects.channelShift.amount || 0.5,
          time * 0.7, // Different frequency
          0.12 * intensityMultiplier
        )
      };
    }
    
    // Channel-specific subtle animations
    if (newEffects.redChannel?.pixelSort) {
      newEffects.redChannel.pixelSort.intensity = generateValue(
        newEffects.redChannel.pixelSort.intensity || 0,
        time * 0.8,
        0.05 * intensityMultiplier
      );
    }
    
    if (newEffects.greenChannel?.dataBend) {
      newEffects.greenChannel.dataBend.amount = generateValue(
        newEffects.greenChannel.dataBend.amount || 0,
        time * 0.9,
        0.07 * intensityMultiplier
      );
    }
    
    if (newEffects.blueChannel?.dataBend) {
      newEffects.blueChannel.dataBend.amount = generateValue(
        newEffects.blueChannel.dataBend.amount || 0,
        time * 1.1,
        0.06 * intensityMultiplier
      );
    }
  }
  
  return newEffects;
} 