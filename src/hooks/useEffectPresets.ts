import { useState, useEffect, useCallback } from 'react';
import { GlitchOptions } from './useGlitchEffect';
import { ShaderOptions } from './useShaderEffect';

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  glitchOptions: GlitchOptions;
  shaderOptions?: ShaderOptions;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  tags: string[];
}

export interface PresetState {
  presets: EffectPreset[];
  currentPreset: EffectPreset | null;
}

export const DEFAULT_PRESETS: EffectPreset[] = [
  {
    id: 'preset-1',
    name: 'RGB Split',
    description: 'Classic RGB channel shift effect',
    glitchOptions: {
      channelShift: {
        amount: 0.5,
        channels: [0, 1, 2], // R, G, B
        direction: 1
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['classic', 'channel shift']
  },
  {
    id: 'preset-2',
    name: 'Pixel Chaos',
    description: 'Pixelated distortion with random pixel shifts',
    glitchOptions: {
      pixelSort: {
        intensity: 0.7,
        threshold: 0.4,
        vertical: false
      },
      quantize: 32
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['pixel', 'retro']
  },
  {
    id: 'preset-3',
    name: 'Digital Corruption',
    description: 'Heavy data corruption with binary artifacts',
    glitchOptions: {
      byteCorrupt: {
        amount: 0.4,
        mode: 1, // bit flip
        blockSize: 8,
        structured: false
      },
      binaryXor: {
        strength: 0.3,
        mode: 0 // full image
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['corruption', 'binary']
  },
  {
    id: 'preset-4',
    name: 'VHS Artifact',
    description: 'Vintage video tape distortion',
    glitchOptions: {
      dataBend: {
        amount: 0.2,
        mode: 2, // shift
        chunkSize: 0.02,
        channel: undefined // all channels
      },
      noise: 0.1
    },
    shaderOptions: {
      fragmentShader: 'vhsGlitch',
      uniforms: {},
      intensity: 0.6,
      enabled: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['analog', 'vintage', 'vhs']
  },
  {
    id: 'preset-5',
    name: 'Glitch Wave',
    description: 'Undulating wave pattern with color channel separation',
    glitchOptions: {
      channelShift: {
        amount: 0.3,
        channels: [0, 2], // R and B
        direction: 0 // random
      }
    },
    shaderOptions: {
      fragmentShader: 'wave',
      uniforms: {},
      intensity: 0.7,
      enabled: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['wave', 'animated']
  }
];

export const useEffectPresets = () => {
  const [state, setState] = useState<PresetState>({
    presets: [],
    currentPreset: null
  });
  
  // Load presets from localStorage on init
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem('glitchMixer.presets');
      
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets) as EffectPreset[];
        setState(prev => ({ ...prev, presets: parsedPresets }));
      } else {
        // Use default presets if no saved presets found
        setState(prev => ({ ...prev, presets: DEFAULT_PRESETS }));
      }
      
      const lastUsedPresetId = localStorage.getItem('glitchMixer.currentPreset');
      if (lastUsedPresetId) {
        const savedPresets = JSON.parse(localStorage.getItem('glitchMixer.presets') || '[]');
        const currentPreset = savedPresets.find((preset: EffectPreset) => preset.id === lastUsedPresetId) || null;
        setState(prev => ({ ...prev, currentPreset }));
      }
    } catch (err) {
      console.error('Error loading presets:', err);
      setState(prev => ({ ...prev, presets: DEFAULT_PRESETS }));
    }
  }, []);
  
  // Save presets to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('glitchMixer.presets', JSON.stringify(state.presets));
      
      if (state.currentPreset) {
        localStorage.setItem('glitchMixer.currentPreset', state.currentPreset.id);
      } else {
        localStorage.removeItem('glitchMixer.currentPreset');
      }
    } catch (err) {
      console.error('Error saving presets:', err);
    }
  }, [state.presets, state.currentPreset]);
  
  // Apply a preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = state.presets.find(p => p.id === presetId) || null;
    setState(prev => ({ ...prev, currentPreset: preset }));
    return preset;
  }, [state.presets]);
  
  // Save current effects as a new preset
  const saveAsPreset = useCallback((
    name: string,
    description: string,
    glitchOptions: GlitchOptions,
    shaderOptions?: ShaderOptions,
    tags: string[] = []
  ) => {
    const now = new Date().toISOString();
    const newPreset: EffectPreset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      glitchOptions,
      shaderOptions,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      tags
    };
    
    setState(prev => ({
      ...prev,
      presets: [...prev.presets, newPreset],
      currentPreset: newPreset
    }));
    
    return newPreset;
  }, []);
  
  // Update an existing preset
  const updatePreset = useCallback((
    presetId: string,
    updates: Partial<Omit<EffectPreset, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const now = new Date().toISOString();
    
    setState(prev => {
      const updatedPresets = prev.presets.map(preset => {
        if (preset.id === presetId) {
          const updatedPreset = {
            ...preset,
            ...updates,
            updatedAt: now
          };
          
          // Update current preset if it's the one being edited
          if (prev.currentPreset?.id === presetId) {
            return updatedPreset;
          }
          
          return updatedPreset;
        }
        return preset;
      });
      
      // Also update the current preset if needed
      const updatedCurrentPreset = 
        prev.currentPreset?.id === presetId
          ? {
              ...prev.currentPreset,
              ...updates,
              updatedAt: now
            }
          : prev.currentPreset;
      
      return {
        presets: updatedPresets,
        currentPreset: updatedCurrentPreset
      };
    });
  }, []);
  
  // Delete a preset
  const deletePreset = useCallback((presetId: string) => {
    setState(prev => {
      const filteredPresets = prev.presets.filter(preset => preset.id !== presetId);
      const updatedCurrentPreset = 
        prev.currentPreset?.id === presetId ? null : prev.currentPreset;
      
      return {
        presets: filteredPresets,
        currentPreset: updatedCurrentPreset
      };
    });
  }, []);
  
  // Toggle favorite status of a preset
  const toggleFavorite = useCallback((presetId: string) => {
    setState(prev => {
      const updatedPresets = prev.presets.map(preset => {
        if (preset.id === presetId) {
          return { ...preset, isFavorite: !preset.isFavorite };
        }
        return preset;
      });
      
      // Update current preset if needed
      const updatedCurrentPreset = 
        prev.currentPreset?.id === presetId
          ? { ...prev.currentPreset, isFavorite: !prev.currentPreset.isFavorite }
          : prev.currentPreset;
      
      return {
        presets: updatedPresets,
        currentPreset: updatedCurrentPreset
      };
    });
  }, []);
  
  // Export presets to JSON file
  const exportPresets = useCallback(() => {
    try {
      const dataStr = JSON.stringify(state.presets, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `glitchmixer-presets-${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting presets:', err);
    }
  }, [state.presets]);
  
  // Import presets from JSON file
  const importPresets = useCallback((jsonData: string, replace = false) => {
    try {
      const importedPresets = JSON.parse(jsonData) as EffectPreset[];
      
      setState(prev => {
        // Validate imported presets and ensure they have required fields
        const validPresets = importedPresets.filter(preset => {
          return preset.id && preset.name && preset.glitchOptions;
        });
        
        // Generate new IDs to avoid conflicts
        const presetsWithNewIds = validPresets.map(preset => ({
          ...preset,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        
        return {
          presets: replace ? presetsWithNewIds : [...prev.presets, ...presetsWithNewIds],
          currentPreset: prev.currentPreset
        };
      });
      
      return true;
    } catch (err) {
      console.error('Error importing presets:', err);
      return false;
    }
  }, []);
  
  // Reset to default presets
  const resetToDefaults = useCallback(() => {
    setState({
      presets: DEFAULT_PRESETS,
      currentPreset: null
    });
  }, []);
  
  return {
    presets: state.presets,
    currentPreset: state.currentPreset,
    applyPreset,
    saveAsPreset,
    updatePreset,
    deletePreset,
    toggleFavorite,
    exportPresets,
    importPresets,
    resetToDefaults
  };
}; 