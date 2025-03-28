import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Tune as TuneIcon,
  OpenInNew as OpenInNewIcon,
  RestartAlt as RestartIcon
} from '@mui/icons-material';
import { ShaderOptions, SHADER_PRESETS } from '../hooks/useShaderEffect';

interface ShaderControlsProps {
  shaderOptions: ShaderOptions;
  onShaderOptionsChange: (options: Partial<ShaderOptions>) => void;
}

export default function ShaderControls({ 
  shaderOptions, 
  onShaderOptionsChange 
}: ShaderControlsProps) {
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [tempShaderCode, setTempShaderCode] = useState('');
  
  const handleShaderPresetChange = (event: SelectChangeEvent) => {
    const selectedPreset = event.target.value as keyof typeof SHADER_PRESETS | 'custom';
    
    if (selectedPreset === 'custom') {
      // If custom is selected, open the code editor dialog and keep using current code
      setTempShaderCode(shaderOptions.customCode || shaderOptions.fragmentShader);
      setCodeDialogOpen(true);
    } else {
      // Otherwise, apply the selected preset
      onShaderOptionsChange({
        fragmentShader: SHADER_PRESETS[selectedPreset],
        customCode: '' // Clear custom code when switching to a preset
      });
    }
  };
  
  const handleOpenCodeEditor = () => {
    setTempShaderCode(shaderOptions.customCode || shaderOptions.fragmentShader);
    setCodeDialogOpen(true);
  };
  
  const handleCloseCodeEditor = () => {
    setCodeDialogOpen(false);
  };
  
  const handleApplyCustomShader = () => {
    onShaderOptionsChange({
      fragmentShader: tempShaderCode,
      customCode: tempShaderCode
    });
    setCodeDialogOpen(false);
  };
  
  const handleIntensityChange = (event: Event, newValue: number | number[]) => {
    onShaderOptionsChange({
      intensity: newValue as number
    });
  };
  
  const handleEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onShaderOptionsChange({
      enabled: event.target.checked
    });
  };
  
  // Determine current shader preset name for the dropdown
  const getCurrentPresetName = (): string => {
    if (shaderOptions.customCode) return 'custom';
    
    console.log("Getting current preset name, fragmentShader length:", shaderOptions.fragmentShader?.length || 0);
    
    const presetEntries = Object.entries(SHADER_PRESETS);
    const matchingPreset = presetEntries.find(
      ([_, code]) => code === shaderOptions.fragmentShader
    );
    
    if (matchingPreset) {
      console.log("Found matching preset:", matchingPreset[0]);
      return matchingPreset[0];
    }
    
    return 'none';
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="shader-controls-content"
          id="shader-controls-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TuneIcon sx={{ mr: 1 }} />
            <Typography sx={{ flexGrow: 1 }}>WebGL Shader Effects</Typography>
            <Switch
              size="small"
              checked={shaderOptions.enabled}
              onChange={handleEnableChange}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <FormLabel>Shader Type</FormLabel>
                <Select
                  value={getCurrentPresetName()}
                  onChange={handleShaderPresetChange}
                  disabled={!shaderOptions.enabled}
                >
                  <MenuItem value="none">None (Passthrough)</MenuItem>
                  <MenuItem value="hueRotate">Hue Rotation</MenuItem>
                  <MenuItem value="rgbShift">RGB Shift</MenuItem>
                  <MenuItem value="wave">Wave Distortion</MenuItem>
                  <MenuItem value="digitalNoise">Digital Noise</MenuItem>
                  <MenuItem value="pixelate">Pixelation</MenuItem>
                  <MenuItem value="vhsGlitch">VHS Distortion</MenuItem>
                  <MenuItem value="custom">Custom Shader...</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormLabel>Effect Intensity</FormLabel>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Slider
                  value={shaderOptions.intensity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={handleIntensityChange}
                  disabled={!shaderOptions.enabled || getCurrentPresetName() === 'none'}
                />
                <Typography sx={{ ml: 2, minWidth: '45px' }}>
                  {Math.round(shaderOptions.intensity * 100)}%
                </Typography>
              </Box>
            </Grid>
            
            {shaderOptions.customCode && (
              <Grid item xs={12}>
                <Button
                  startIcon={<CodeIcon />}
                  variant="outlined"
                  fullWidth
                  onClick={handleOpenCodeEditor}
                  disabled={!shaderOptions.enabled}
                >
                  Edit Custom Shader
                </Button>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  startIcon={<RestartIcon />}
                  color="secondary"
                  size="small"
                  onClick={() => onShaderOptionsChange({
                    fragmentShader: SHADER_PRESETS.none,
                    intensity: 0.5,
                    customCode: '',
                    enabled: false
                  })}
                >
                  Reset
                </Button>
                
                <Button
                  endIcon={<OpenInNewIcon />}
                  size="small"
                  color="primary"
                  component="a"
                  href="https://shadertoy.com/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shader Examples
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Custom Shader Code Editor Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={handleCloseCodeEditor}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1 }} />
            Custom WebGL Fragment Shader
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Write your custom GLSL fragment shader. The following uniforms are available:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Box component="li">
                <code>uniform sampler2D u_image;</code> - The input image
              </Box>
              <Box component="li">
                <code>uniform float u_time;</code> - Current time in seconds
              </Box>
              <Box component="li">
                <code>uniform float u_intensity;</code> - Effect intensity (0.0-1.0)
              </Box>
              <Box component="li">
                <code>uniform vec2 u_resolution;</code> - Image dimensions (width, height)
              </Box>
              <Box component="li">
                <code>varying vec2 v_texCoord;</code> - Texture coordinates (0.0-1.0)
              </Box>
            </Box>
            
            <TextField
              label="GLSL Fragment Shader"
              multiline
              fullWidth
              rows={16}
              variant="outlined"
              value={tempShaderCode}
              onChange={(e) => setTempShaderCode(e.target.value)}
              inputProps={{
                style: { fontFamily: 'monospace', fontSize: '0.875rem' }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseCodeEditor}>Cancel</Button>
          <Button 
            onClick={handleApplyCustomShader} 
            variant="contained" 
            color="primary"
            startIcon={<CodeIcon />}
          >
            Apply Shader
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 