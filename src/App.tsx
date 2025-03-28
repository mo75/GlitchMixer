import React, { useEffect, useState, useRef } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Box, Typography, Button } from '@mui/material';
import './App.css';
import ImageEditorWrapper from './components/ImageEditorWrapper';
import ImageUpload from './components/ImageUpload';
import { GlitchOptions } from './hooks/useGlitchEffect';
import { useImageBlender } from './hooks/useImageBlender';
import { ShaderOptions, useShaderEffect, SHADER_PRESETS } from './hooks/useShaderEffect';
import ShaderPresets from './components/ShaderPresets';

// Default glitch options structure with corruption effects
const defaultGlitchOptions: GlitchOptions = {
  pixelSort: undefined,
  dataBend: undefined,
  channelShift: undefined,
  noise: 0,
  invert: [],
  quantize: undefined,
  redChannel: undefined,
  greenChannel: undefined,
  blueChannel: undefined,
};

// Default shader options
const defaultShaderOptions: ShaderOptions = {
  layers: [
    {
      fragmentShader: SHADER_PRESETS.hueRotate, // Use hue rotation shader by default 
      uniforms: {},
      intensity: 0.5,
      enabled: true,
      name: 'Hue Rotation',
      opacity: 1.0
    }
  ],
  enabled: true // Enable shaders by default
};

// Example shader presets that combine multiple layers
const SHADER_PRESETS_EXAMPLES = {
  psychedelic: {
    layers: [
      {
        fragmentShader: SHADER_PRESETS.hueRotate,
        uniforms: {},
        intensity: 0.7,
        enabled: true,
        name: 'Hue Rotation',
        opacity: 1.0
      },
      {
        fragmentShader: SHADER_PRESETS.rgbShift,
        uniforms: {},
        intensity: 0.3,
        enabled: true,
        name: 'RGB Shift',
        opacity: 0.8
      }
    ],
    enabled: true
  },
  retro: {
    layers: [
      {
        fragmentShader: SHADER_PRESETS.pixelate,
        uniforms: {},
        intensity: 0.7,
        enabled: true,
        name: 'Pixelation',
        opacity: 1.0
      },
      {
        fragmentShader: SHADER_PRESETS.vhsGlitch,
        uniforms: {},
        intensity: 0.4,
        enabled: true,
        name: 'VHS Distortion',
        opacity: 0.85
      }
    ],
    enabled: true
  },
  glitchArt: {
    layers: [
      {
        fragmentShader: SHADER_PRESETS.digitalNoise,
        uniforms: {},
        intensity: 0.5,
        enabled: true,
        name: 'Digital Noise',
        opacity: 0.7
      },
      {
        fragmentShader: SHADER_PRESETS.wave,
        uniforms: {},
        intensity: 0.4,
        enabled: true,
        name: 'Wave Distortion',
        opacity: 0.9
      },
      {
        fragmentShader: SHADER_PRESETS.rgbShift,
        uniforms: {},
        intensity: 0.2,
        enabled: true,
        name: 'RGB Shift',
        opacity: 0.6
      }
    ],
    enabled: true
  }
};

// Create a theme instance with dark mode support
const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [effects, setEffects] = useState<GlitchOptions>(defaultGlitchOptions);
  const [shaderOptions, setShaderOptions] = useState<ShaderOptions>(defaultShaderOptions);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Create refs for canvases
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Create an instance of our image blender hook
  const imageBlender = useImageBlender();
  
  // Create shader effect instance
  const { shaderOptions: shaderState } = useShaderEffect();
  
  // Load image from localStorage on mount or load test image
  useEffect(() => {
    const savedImage = localStorage.getItem('glitchMixer_image');
    if (savedImage) {
      setSelectedImage(savedImage);
    } else {
      loadTestImage();
    }
    
    // Load effects from localStorage
    const savedEffects = localStorage.getItem('glitchMixer_effects');
    if (savedEffects) {
      try {
        setEffects(JSON.parse(savedEffects));
      } catch (e) {
        console.error('Error loading saved effects:', e);
      }
    }
    
    // Load shader options from localStorage
    const savedShaderOptions = localStorage.getItem('glitchMixer_shaderOptions');
    if (savedShaderOptions) {
      try {
        setShaderOptions(JSON.parse(savedShaderOptions));
      } catch (e) {
        console.error('Error loading saved shader options:', e);
      }
    }
  }, []);
  
  // Save selected image to localStorage when it changes
  useEffect(() => {
    if (selectedImage) {
      localStorage.setItem('glitchMixer_image', selectedImage);
      setImageLoaded(true);
    } else {
      localStorage.removeItem('glitchMixer_image');
      setImageLoaded(false);
    }
  }, [selectedImage]);
  
  // Save effects to localStorage when they change
  useEffect(() => {
    localStorage.setItem('glitchMixer_effects', JSON.stringify(effects));
  }, [effects]);
  
  // Save shader options to localStorage when they change
  useEffect(() => {
    localStorage.setItem('glitchMixer_shaderOptions', JSON.stringify(shaderOptions));
  }, [shaderOptions]);
  
  const loadTestImage = () => {
    console.log("App: Loading default tunnel rats image");
    
    // Directly use the Tunnel Rats image as base64
    // This avoids needing to store the file in the public directory
    fetch('https://i.imgur.com/PDTkGn7.jpeg')
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setSelectedImage(base64data);
          setImageLoaded(true);
          console.log("App: Default image loaded successfully");
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error("Failed to load default image:", error);
        // Fallback to a simple colored square if image fails to load
        const fallbackImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAABCdJREFUeF7t1AENAAAIw7CDf09DHcQJfuwcuJl5joBAoAisQDpWCATeBCyIb0CgIGBBgDo6AQvi/xMoCFiQoI5OwIL4/wQKAhYkqKMTsCD+P4GCgAUJ6ugELIj/T6AgYEGCOjoBC+L/EygIWJCgjk7Agvj/BAoCFiSooxOwIP4/gYKABQnq6AQsiP9PoCAw71Lq2khJbVkAAAAASUVORK5CYII=';
        setSelectedImage(fallbackImageBase64);
        setImageLoaded(true);
      });
  };

  const handleImageChange = (imageDataUrl: string) => {
    console.log("App: Image changed", imageDataUrl ? "image present" : "no image");
    setSelectedImage(imageDataUrl);
    setImageLoaded(!!imageDataUrl);
  };

  const handleEffectsChange = (newEffects: GlitchOptions) => {
    // If we have a selected blend image, include it in the effects
    if (imageBlender.selectedImage) {
      newEffects = {
        ...newEffects,
        imageBlend: {
          secondaryImage: imageBlender.selectedImage,
          blendOptions: imageBlender.blendOptions
        }
      };
    } else if (newEffects.imageBlend) {
      // If no blend image is selected but we have blend effects, remove them
      delete newEffects.imageBlend;
    }
    
    setEffects(newEffects);
  };

  const handleEffectsReset = () => {
    setEffects(defaultGlitchOptions);
    setShaderOptions(defaultShaderOptions);
    imageBlender.resetBlendOptions();
  };
  
  const handleShaderOptionsChange = (newOptions: Partial<ShaderOptions>) => {
    setShaderOptions(prev => ({
      ...prev,
      ...newOptions
    }));
  };
  
  const handleApplyPreset = (glitchOptions: GlitchOptions, shaderOptions?: ShaderOptions) => {
    // Apply the glitch options from the preset
    handleEffectsChange(glitchOptions);
    
    // Apply shader options if they exist in the preset
    if (shaderOptions) {
      handleShaderOptionsChange(shaderOptions);
    }
  };

  // Add a function to apply preset examples
  const applyShaderPreset = (presetName: string) => {
    const preset = SHADER_PRESETS_EXAMPLES[presetName as keyof typeof SHADER_PRESETS_EXAMPLES];
    if (preset) {
      setShaderOptions(preset);
    }
  };

  // Add a reset function that resets effects and shader options
  const handleReset = () => {
    // Reset effects to default
    setEffects(defaultGlitchOptions);
    // Reset shader options to default
    setShaderOptions(defaultShaderOptions);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GlitchMixer
        </Typography>
        {!imageLoaded ? (
          <ImageUpload onImageChange={handleImageChange} />
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Button variant="contained" color="secondary" onClick={handleReset}>
                Reset
              </Button>
            </Box>
            <ShaderPresets 
              presets={SHADER_PRESETS_EXAMPLES} 
              onApplyPreset={applyShaderPreset} 
            />
            <ImageEditorWrapper
              selectedImage={selectedImage}
              effects={effects}
              shaderOptions={shaderOptions}
              imageBlender={imageBlender}
              onImageChange={handleImageChange}
              onEffectsChange={handleEffectsChange}
              onShaderOptionsChange={handleShaderOptionsChange}
              onEffectsReset={handleEffectsReset}
              onApplyPreset={handleApplyPreset}
              canvasRef={mainCanvasRef}
            />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App; 