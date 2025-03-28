import { useState, useCallback, useRef } from 'react';

export interface BlendImage {
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  data?: Uint8ClampedArray;
}

export type BlendMode = 'mix' | 'difference' | 'multiply' | 'screen' | 'overlay';

export interface BlendOptions {
  mode: BlendMode;
  amount: number;  // 0-1
  offsetX: number;
  offsetY: number;
}

export interface UseImageBlenderResult {
  secondaryImages: BlendImage[];
  selectedImage: BlendImage | null;
  blendOptions: BlendOptions;
  isLoading: boolean;
  addSecondaryImage: (file: File) => Promise<void>;
  removeSecondaryImage: (index: number) => void;
  selectSecondaryImage: (index: number) => void;
  updateBlendOptions: (options: Partial<BlendOptions>) => void;
  resetBlendOptions: () => void;
  getImageDataForBlending: () => Uint8ClampedArray | undefined;
}

const DEFAULT_BLEND_OPTIONS: BlendOptions = {
  mode: 'mix',
  amount: 0.5,
  offsetX: 0,
  offsetY: 0
};

const BLEND_MODE_MAP: Record<BlendMode, number> = {
  'mix': 0,
  'difference': 1,
  'multiply': 2,
  'screen': 3,
  'overlay': 4
};

export function useImageBlender(): UseImageBlenderResult {
  const [secondaryImages, setSecondaryImages] = useState<BlendImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [blendOptions, setBlendOptions] = useState<BlendOptions>(DEFAULT_BLEND_OPTIONS);
  const [isLoading, setIsLoading] = useState(false);
  
  const selectedImage = selectedImageIndex >= 0 && selectedImageIndex < secondaryImages.length
    ? secondaryImages[selectedImageIndex]
    : null;

  // Load raw image data from URL for blending
  const loadImageData = useCallback(async (dataUrl: string): Promise<{data: Uint8ClampedArray, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve({
          data: imageData.data,
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = dataUrl;
    });
  }, []);

  // Add a new secondary image
  const addSecondaryImage = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });
      
      const { data, width, height } = await loadImageData(dataUrl);
      
      const newImage: BlendImage = {
        dataUrl,
        width,
        height,
        name: file.name,
        data
      };
      
      setSecondaryImages(prev => [...prev, newImage]);
      
      // Automatically select the first image if none is selected
      if (selectedImageIndex === -1) {
        setSelectedImageIndex(secondaryImages.length);
      }
    } catch (error) {
      console.error('Error adding secondary image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadImageData, secondaryImages.length, selectedImageIndex]);

  // Remove a secondary image
  const removeSecondaryImage = useCallback((index: number) => {
    setSecondaryImages(prev => prev.filter((_, i) => i !== index));
    
    // Adjust selected image index if needed
    if (selectedImageIndex === index) {
      setSelectedImageIndex(-1);
    } else if (selectedImageIndex > index) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  }, [selectedImageIndex]);

  // Select a secondary image for blending
  const selectSecondaryImage = useCallback((index: number) => {
    if (index >= 0 && index < secondaryImages.length) {
      setSelectedImageIndex(index);
    }
  }, [secondaryImages.length]);

  // Update blend options
  const updateBlendOptions = useCallback((options: Partial<BlendOptions>) => {
    setBlendOptions(prev => ({ ...prev, ...options }));
  }, []);

  // Reset blend options to defaults
  const resetBlendOptions = useCallback(() => {
    setBlendOptions(DEFAULT_BLEND_OPTIONS);
  }, []);

  // Get image data for the currently selected image (used by effects)
  const getImageDataForBlending = useCallback((): Uint8ClampedArray | undefined => {
    return selectedImage?.data;
  }, [selectedImage]);

  return {
    secondaryImages,
    selectedImage,
    blendOptions,
    isLoading,
    addSecondaryImage,
    removeSecondaryImage,
    selectSecondaryImage,
    updateBlendOptions,
    resetBlendOptions,
    getImageDataForBlending
  };
}

// Helper function to convert blend mode string to enum value
export function getBlendModeValue(mode: BlendMode): number {
  return BLEND_MODE_MAP[mode] || 0;
} 