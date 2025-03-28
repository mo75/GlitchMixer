import { useEffect, useState } from 'react';
import init, { GlitchEffect } from 'glitch-wasm';
import { BlendImage, BlendOptions, getBlendModeValue } from './useImageBlender';

export interface PixelSortOptions {
  intensity: number;
  threshold: number;
  vertical: boolean;
  channel?: number; // 0=R, 1=G, 2=B, undefined=brightness
}

export interface DataBendOptions {
  amount: number;
  mode?: number; // 0=duplicate, 1=reverse, 2=shift, 3=scramble, undefined=random
  chunkSize?: number; // 0.0-1.0
  channel?: number; // 0=R, 1=G, 2=B, 3=A, undefined=all
}

export interface ChannelShiftOptions {
  amount: number;
  channels?: number[]; // Which channels to shift (0=R, 1=G, 2=B)
  direction?: number; // -1=left, 1=right, 0=random
}

export interface ByteCorruptOptions {
  amount: number;          // Corruption intensity (0.0-1.0)
  mode?: number;           // 0=random bytes, 1=bit flip, 2=zero out, 3=max out, undefined=random
  blockSize?: number;      // Size of corruption blocks (default: 1)
  structured: boolean;     // Use structured patterns vs random
}

export interface ChunkSwapOptions {
  amount: number;         // How many chunks to swap (0.0-1.0)
  chunkSize?: number;     // Relative chunk size (0.0-1.0)
  preserveAlpha: boolean; // Whether to preserve alpha channel
}

export interface BinaryXorOptions {
  pattern?: number[];     // Pattern to XOR with (if undefined, will use random pattern)
  strength: number;       // Strength of the effect (0.0-1.0)
  mode?: number;          // 0=full image, 1=horizontal bands, 2=vertical bands, 3=blocks
}

export interface ImageBlendOptions {
  secondaryImage: BlendImage;  // The secondary image to blend with
  blendOptions: BlendOptions;  // Blend mode, amount, and offset
}

// Extended to support per-channel application of effects
export interface ChannelEffects {
  pixelSort?: PixelSortOptions;
  dataBend?: DataBendOptions;
  shift?: ChannelShiftOptions;
  noise?: number; // 0.0-1.0
  invert?: boolean; // Whether to invert this channel
  quantize?: number; // Color depth reduction (2-256)
  byteCorrupt?: ByteCorruptOptions; // Byte corruption
  binaryXor?: BinaryXorOptions; // Binary XOR operation
}

export interface GlitchOptions {
  // Global effects that work across all channels
  pixelSort?: PixelSortOptions;
  dataBend?: DataBendOptions;
  channelShift?: ChannelShiftOptions;
  noise?: number; // 0.0-1.0
  invert?: number[]; // Which channels to invert (0=R, 1=G, 2=B, 3=A)
  quantize?: number; // Color depth reduction (2-256)
  
  // New corruption effects
  byteCorrupt?: ByteCorruptOptions;
  chunkSwap?: ChunkSwapOptions;
  binaryXor?: BinaryXorOptions;
  imageBlend?: ImageBlendOptions;
  
  // Per-channel effects
  redChannel?: ChannelEffects;
  greenChannel?: ChannelEffects;
  blueChannel?: ChannelEffects;
}

export const useGlitchEffect = () => {
  const [glitchEffect, setGlitchEffect] = useState<GlitchEffect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWasm = async () => {
      try {
        await init();
        const effect = new GlitchEffect();
        setGlitchEffect(effect);
        setIsLoading(false);
      } catch (err) {
        console.error('WebAssembly initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize WebAssembly module');
        setIsLoading(false);
      }
    };

    initWasm();

    return () => {
      if (glitchEffect) {
        // Free is handled automatically by wasm-bindgen
      }
    };
  }, []);

  // Overloaded applyEffects function - handles both ImageData and HTMLCanvasElement
  const applyEffects = (source: ImageData | HTMLCanvasElement, options: GlitchOptions): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Case 1: If source is a canvas, extract the ImageData
      if (source instanceof HTMLCanvasElement) {
        const canvas = source;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        
        // Extract the current image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process the image data
        const processedData = applyEffectsToImageData(imageData, options);
        
        // If successful, apply back to canvas and return processed data
        if (processedData) {
          ctx.putImageData(processedData, 0, 0);
          return processedData;
        }
        return null;
      } 
      
      // Case 2: If source is ImageData, process it directly
      else {
        return applyEffectsToImageData(source, options);
      }
    } catch (err) {
      console.error('Error applying effects:', err);
      return null;
    }
  };

  // Move the original applyEffects implementation to a separate function
  const applyEffectsToImageData = (imageData: ImageData, options: GlitchOptions): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data to work with
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.putImageData(imageData, 0, 0);
      const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create a copy of the pixel data we can modify
      const pixelData = new Uint8Array(newImageData.data);
      
      // Apply global effects that work on all channels together
      applyGlobalEffects(pixelData, newImageData.width, options);
      
      // If we have per-channel effects, extract channels, apply effects separately, and recombine
      if (options.redChannel || options.greenChannel || options.blueChannel) {
        applyChannelEffects(pixelData, newImageData.width, options);
      }
      
      // Create a new ImageData with the modified pixels
      return new ImageData(
        new Uint8ClampedArray(pixelData.buffer),
        newImageData.width,
        newImageData.height
      );
    } catch (err) {
      console.error('Error applying effects:', err);
      return null;
    }
  };

  // Helper function to apply global effects to all channels
  const applyGlobalEffects = (pixelData: Uint8Array, width: number, options: GlitchOptions) => {
    if (!glitchEffect) return;
    
    // 1. Pixel Sort
    if (options.pixelSort && options.pixelSort.intensity > 0) {
      glitchEffect.pixel_sort(
        pixelData,
        width,
        options.pixelSort.intensity,
        options.pixelSort.threshold,
        options.pixelSort.vertical,
        options.pixelSort.channel === undefined ? null : options.pixelSort.channel
      );
    }
    
    // 2. Data Bend
    if (options.dataBend && options.dataBend.amount > 0) {
      glitchEffect.data_bend(
        pixelData,
        options.dataBend.amount,
        options.dataBend.mode === undefined ? null : options.dataBend.mode,
        options.dataBend.chunkSize === undefined ? null : options.dataBend.chunkSize,
        options.dataBend.channel === undefined ? null : options.dataBend.channel
      );
    }
    
    // 3. Channel Shift
    if (options.channelShift && options.channelShift.amount > 0) {
      // Create a clean new array for channels to avoid aliasing
      let channelsArray = null;
      if (options.channelShift.channels && options.channelShift.channels.length > 0) {
        // Create a primitive copy first to avoid reference issues
        const primitiveArray = [...options.channelShift.channels].map(Number);
        channelsArray = new Uint32Array(primitiveArray);
      }
      
      glitchEffect.channel_shift(
        pixelData,
        options.channelShift.amount,
        channelsArray,
        options.channelShift.direction === undefined ? null : options.channelShift.direction
      );
    }
    
    // 4. Noise
    if (options.noise && options.noise > 0) {
      glitchEffect.add_noise(pixelData, options.noise);
    }
    
    // 5. Invert
    if (options.invert && options.invert.length > 0) {
      // Create a clean new array to avoid aliasing
      const primitiveArray = [...options.invert].map(Number);
      const invertArray = new Uint32Array(primitiveArray);
      glitchEffect.invert_channels(pixelData, invertArray);
    }
    
    // 6. Quantize
    if (options.quantize && options.quantize < 256) {
      glitchEffect.quantize(pixelData, options.quantize);
    }
    
    // 7. Byte Corruption
    if (options.byteCorrupt && options.byteCorrupt.amount > 0) {
      glitchEffect.byte_corrupt(
        pixelData,
        options.byteCorrupt.amount,
        options.byteCorrupt.mode === undefined ? null : options.byteCorrupt.mode,
        options.byteCorrupt.blockSize === undefined ? null : options.byteCorrupt.blockSize,
        options.byteCorrupt.structured
      );
    }
    
    // 8. Chunk Swap
    if (options.chunkSwap && options.chunkSwap.amount > 0) {
      glitchEffect.chunk_swap(
        pixelData,
        width,
        options.chunkSwap.amount,
        options.chunkSwap.chunkSize === undefined ? null : options.chunkSwap.chunkSize,
        options.chunkSwap.preserveAlpha
      );
    }
    
    // 9. Binary XOR
    if (options.binaryXor && options.binaryXor.strength > 0) {
      let patternArray = null;
      if (options.binaryXor.pattern && options.binaryXor.pattern.length > 0) {
        // Create a primitive Uint8Array from the pattern
        patternArray = new Uint8Array(options.binaryXor.pattern);
      }
      
      glitchEffect.binary_xor(
        pixelData,
        width,
        patternArray,
        options.binaryXor.strength,
        options.binaryXor.mode === undefined ? null : options.binaryXor.mode
      );
    }
    
    // 10. Image Blend
    if (options.imageBlend && options.imageBlend.secondaryImage?.data) {
      const { secondaryImage, blendOptions } = options.imageBlend;
      
      glitchEffect.image_blend(
        pixelData,
        width,
        secondaryImage.data,
        secondaryImage.width,
        secondaryImage.height,
        getBlendModeValue(blendOptions.mode),
        blendOptions.amount,
        blendOptions.offsetX,
        blendOptions.offsetY
      );
    }
  };

  // Helper function to extract channels, apply effects, and recombine
  const applyChannelEffects = (pixelData: Uint8Array, width: number, options: GlitchOptions) => {
    if (!glitchEffect) return;
    
    const pixelCount = pixelData.length / 4;
    
    // Extract channels into separate arrays
    const redChannel = new Uint8Array(pixelCount);
    const greenChannel = new Uint8Array(pixelCount);
    const blueChannel = new Uint8Array(pixelCount);
    const alphaChannel = new Uint8Array(pixelCount);
    
    // Extract channels
    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      redChannel[i] = pixelData[offset];
      greenChannel[i] = pixelData[offset + 1];
      blueChannel[i] = pixelData[offset + 2];
      alphaChannel[i] = pixelData[offset + 3];
    }
    
    // Apply effects to individual channels
    
    // Red channel effects
    if (options.redChannel) {
      applyEffectsToChannel(redChannel, width, options.redChannel);
    }
    
    // Green channel effects
    if (options.greenChannel) {
      applyEffectsToChannel(greenChannel, width, options.greenChannel);
    }
    
    // Blue channel effects
    if (options.blueChannel) {
      applyEffectsToChannel(blueChannel, width, options.blueChannel);
    }
    
    // Recombine channels
    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      pixelData[offset] = redChannel[i];
      pixelData[offset + 1] = greenChannel[i];
      pixelData[offset + 2] = blueChannel[i];
      pixelData[offset + 3] = alphaChannel[i]; // Keep original alpha
    }
  };

  // Helper function to apply effects to a single channel
  const applyEffectsToChannel = (channelData: Uint8Array, width: number, effects: ChannelEffects) => {
    if (!glitchEffect) return;
    
    // We need to transform single-channel data to RGBA for the Wasm functions to work
    // Create a temporary RGBA array where our channel is duplicated to all RGB components
    const rgbaData = new Uint8Array(channelData.length * 4);
    
    // Copy the channel data to RGB components, set alpha to 255
    for (let i = 0; i < channelData.length; i++) {
      const value = channelData[i];
      const offset = i * 4;
      rgbaData[offset] = value;     // R
      rgbaData[offset + 1] = value; // G
      rgbaData[offset + 2] = value; // B
      rgbaData[offset + 3] = 255;   // Alpha
    }
    
    // Now apply the effects to this expanded array
    
    // 1. Pixel Sort
    if (effects.pixelSort && effects.pixelSort.intensity > 0) {
      glitchEffect.pixel_sort(
        rgbaData,
        width,
        effects.pixelSort.intensity,
        effects.pixelSort.threshold,
        effects.pixelSort.vertical,
        effects.pixelSort.channel === undefined ? null : effects.pixelSort.channel
      );
    }
    
    // 2. Data Bend
    if (effects.dataBend && effects.dataBend.amount > 0) {
      glitchEffect.data_bend(
        rgbaData,
        effects.dataBend.amount,
        effects.dataBend.mode === undefined ? null : effects.dataBend.mode,
        effects.dataBend.chunkSize === undefined ? null : effects.dataBend.chunkSize,
        effects.dataBend.channel === undefined ? null : effects.dataBend.channel
      );
    }
    
    // 3. Shift (basically a mini channel shift but on one channel)
    if (effects.shift && effects.shift.amount > 0) {
      glitchEffect.channel_shift(
        rgbaData,
        effects.shift.amount,
        new Uint32Array([0, 1, 2]), // all RGB channels since they contain copies of our data
        effects.shift.direction === undefined ? null : effects.shift.direction
      );
    }
    
    // 4. Noise
    if (effects.noise && effects.noise > 0) {
      glitchEffect.add_noise(rgbaData, effects.noise);
    }
    
    // 5. Invert
    if (effects.invert) {
      glitchEffect.invert_channels(rgbaData, new Uint32Array([0, 1, 2])); // All RGB components
    }
    
    // 6. Quantize
    if (effects.quantize && effects.quantize < 256) {
      glitchEffect.quantize(rgbaData, effects.quantize);
    }
    
    // 7. Byte Corruption
    if (effects.byteCorrupt && effects.byteCorrupt.amount > 0) {
      glitchEffect.byte_corrupt(
        rgbaData,
        effects.byteCorrupt.amount,
        effects.byteCorrupt.mode === undefined ? null : effects.byteCorrupt.mode,
        effects.byteCorrupt.blockSize === undefined ? null : effects.byteCorrupt.blockSize,
        effects.byteCorrupt.structured
      );
    }
    
    // 8. Binary XOR
    if (effects.binaryXor && effects.binaryXor.strength > 0) {
      let patternArray = null;
      if (effects.binaryXor.pattern && effects.binaryXor.pattern.length > 0) {
        patternArray = new Uint8Array(effects.binaryXor.pattern);
      }
      
      glitchEffect.binary_xor(
        rgbaData,
        width,
        patternArray,
        effects.binaryXor.strength,
        effects.binaryXor.mode === undefined ? null : effects.binaryXor.mode
      );
    }
    
    // Now extract the channel data back from RGB (we'll average R, G, B for best effect)
    for (let i = 0; i < channelData.length; i++) {
      const offset = i * 4;
      const r = rgbaData[offset];
      const g = rgbaData[offset + 1];
      const b = rgbaData[offset + 2];
      
      // Average the RGB values for the final channel value
      channelData[i] = Math.round((r + g + b) / 3);
    }
  };

  // Individual effect functions for more control
  const pixelSort = (imageData: ImageData, options: PixelSortOptions): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      glitchEffect.pixel_sort(
        data, 
        imageData.width, 
        options.intensity, 
        options.threshold, 
        options.vertical, 
        options.channel
      );
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error applying pixel sort:', err);
      return null;
    }
  };

  const dataBend = (imageData: ImageData, options: DataBendOptions): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      glitchEffect.data_bend(
        data, 
        options.amount, 
        options.mode, 
        options.chunkSize, 
        options.channel
      );
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error applying data bend:', err);
      return null;
    }
  };

  const channelShift = (imageData: ImageData, options: ChannelShiftOptions): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      // Create a clean new array for channels to avoid aliasing
      let channelsArray = null;
      if (options.channels && options.channels.length > 0) {
        // Create a primitive copy first to avoid reference issues
        const primitiveArray = [...options.channels].map(Number);
        channelsArray = new Uint32Array(primitiveArray);
      }
      
      glitchEffect.channel_shift(
        data, 
        options.amount, 
        channelsArray, 
        options.direction === undefined ? null : options.direction
      );
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error applying channel shift:', err);
      return null;
    }
  };
  
  const addNoise = (imageData: ImageData, amount: number): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      glitchEffect.add_noise(data, amount);
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error applying noise:', err);
      return null;
    }
  };
  
  const invertChannels = (imageData: ImageData, channels: number[]): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      // Create a clean new array to avoid aliasing
      const primitiveArray = [...channels].map(Number);
      const invertArray = new Uint32Array(primitiveArray);
      
      glitchEffect.invert_channels(data, invertArray);
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error inverting channels:', err);
      return null;
    }
  };
  
  const quantize = (imageData: ImageData, levels: number): ImageData | null => {
    if (!glitchEffect) return null;

    try {
      // Create a copy of the image data
      const copy = new Uint8ClampedArray(imageData.data);
      const data = new Uint8Array(copy);
      
      glitchEffect.quantize(data, levels);
      
      // Create new ImageData with the modified data
      return new ImageData(
        new Uint8ClampedArray(data.buffer), 
        imageData.width, 
        imageData.height
      );
    } catch (err) {
      console.error('Error quantizing image:', err);
      return null;
    }
  };

  return {
    applyEffects,
    pixelSort,
    dataBend,
    channelShift,
    addNoise,
    invertChannels,
    quantize,
    isLoading,
    error,
  };
}; 