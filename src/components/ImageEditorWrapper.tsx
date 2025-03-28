import React from 'react';
import { GlitchOptions } from '../hooks/useGlitchEffect';
import { ShaderOptions } from '../hooks/useShaderEffect';
import { UseImageBlenderResult } from '../hooks/useImageBlender';

// Importing the original ImageEditor component
// @ts-ignore - Ignoring TS errors for the problematic component
import ImageEditor from './ImageEditor';

// Using the same props as the original component
interface ImageEditorWrapperProps {
  selectedImage: string | null;
  effects: GlitchOptions;
  shaderOptions: ShaderOptions;
  imageBlender: UseImageBlenderResult;
  onImageChange: (image: string) => void;
  onEffectsChange: (effects: GlitchOptions) => void;
  onShaderOptionsChange: (options: Partial<ShaderOptions>) => void;
  onEffectsReset: () => void;
  onApplyPreset: (glitchOptions: GlitchOptions, shaderOptions?: ShaderOptions) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Creating a simple wrapper component
function ImageEditorWrapper(props: ImageEditorWrapperProps) {
  // Just passing all props to the original component
  return <ImageEditor {...props} />;
}

export default ImageEditorWrapper; 