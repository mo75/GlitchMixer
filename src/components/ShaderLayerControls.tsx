import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
  Paper,
  Divider,
  InputLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Tune as TuneIcon,
  OpenInNew as OpenInNewIcon,
  RestartAlt as RestartIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { ShaderOptions, ShaderLayer, SHADER_PRESETS } from '../hooks/useShaderEffect';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from 'react-beautiful-dnd';

interface ShaderLayerControlsProps {
  shaderOptions: ShaderOptions;
  onShaderOptionsChange: (options: Partial<ShaderOptions>) => void;
}

export default function ShaderLayerControls({ 
  shaderOptions, 
  onShaderOptionsChange 
}: ShaderLayerControlsProps) {
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [tempShaderCode, setTempShaderCode] = useState('');
  const [editingLayerIndex, setEditingLayerIndex] = useState<number>(-1);
  const [editLayerDialogOpen, setEditLayerDialogOpen] = useState(false);
  
  // Function to handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const fromIndex = result.source.index;
    const toIndex = result.destination.index;
    
    if (fromIndex === toIndex) return;
    
    const updatedLayers = Array.from(shaderOptions.layers);
    const [movedLayer] = updatedLayers.splice(fromIndex, 1);
    updatedLayers.splice(toIndex, 0, movedLayer);
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to add a new shader layer
  const handleAddLayer = () => {
    // Pick a random shader from available shaders
    const shaderKeys = Object.keys(SHADER_PRESETS);
    const randomKey = shaderKeys[Math.floor(Math.random() * shaderKeys.length)];
    const randomShader = SHADER_PRESETS[randomKey as keyof typeof SHADER_PRESETS];
    
    const newLayer: ShaderLayer = {
      fragmentShader: randomShader,
      uniforms: {},
      intensity: 0.5,
      enabled: true,
      name: randomKey,
      opacity: 1.0
    };
    
    onShaderOptionsChange({
      layers: [...shaderOptions.layers, newLayer]
    });
  };
  
  // Function to remove a shader layer
  const handleRemoveLayer = (index: number) => {
    // Don't remove the last layer
    if (shaderOptions.layers.length <= 1) return;
    
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers.splice(index, 1);
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to toggle a layer's enabled state
  const handleToggleLayerEnabled = (index: number) => {
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[index] = {
      ...updatedLayers[index],
      enabled: !updatedLayers[index].enabled
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to open the edit dialog for a layer
  const handleEditLayer = (index: number) => {
    setEditingLayerIndex(index);
    setTempShaderCode(
      shaderOptions.layers[index].customCode || 
      shaderOptions.layers[index].fragmentShader
    );
    setEditLayerDialogOpen(true);
  };
  
  // Function to handle shader preset change for a layer
  const handleLayerPresetChange = (index: number, event: SelectChangeEvent) => {
    const shaderName = event.target.value;
    const shader = SHADER_PRESETS[shaderName as keyof typeof SHADER_PRESETS];
    
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[index] = {
      ...updatedLayers[index],
      fragmentShader: shader,
      name: shaderName
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to handle layer name change
  const handleLayerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (editingLayerIndex < 0) return;
    
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[editingLayerIndex] = {
      ...updatedLayers[editingLayerIndex],
      name: event.target.value
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to handle layer intensity change
  const handleLayerIntensityChange = (index: number, value: number) => {
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[index] = {
      ...updatedLayers[index],
      intensity: value
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to handle layer opacity change
  const handleLayerOpacityChange = (index: number, value: number) => {
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[index] = {
      ...updatedLayers[index],
      opacity: value
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
  };
  
  // Function to open the code editor
  const handleOpenCodeEditor = () => {
    if (editingLayerIndex < 0) return;
    
    setTempShaderCode(
      shaderOptions.layers[editingLayerIndex].customCode || 
      shaderOptions.layers[editingLayerIndex].fragmentShader
    );
    setCodeDialogOpen(true);
  };
  
  // Function to close the code editor
  const handleCloseCodeEditor = () => {
    setCodeDialogOpen(false);
  };
  
  // Function to apply a custom shader
  const handleApplyCustomShader = () => {
    if (editingLayerIndex < 0) return;
    
    const updatedLayers = [...shaderOptions.layers];
    updatedLayers[editingLayerIndex] = {
      ...updatedLayers[editingLayerIndex],
      fragmentShader: tempShaderCode,
      customCode: tempShaderCode
    };
    
    onShaderOptionsChange({
      layers: updatedLayers
    });
    setCodeDialogOpen(false);
  };
  
  // Function to handle global shader enable/disable
  const handleEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onShaderOptionsChange({
      enabled: event.target.checked
    });
  };
  
  // Function to close the edit layer dialog
  const handleCloseEditLayerDialog = () => {
    setEditLayerDialogOpen(false);
    setEditingLayerIndex(-1);
  };
  
  // Function to get the current preset name for a layer
  const getLayerPresetName = (layer: ShaderLayer): string => {
    if (layer.customCode) return 'custom';
    
    const presetEntries = Object.entries(SHADER_PRESETS);
    const matchingPreset = presetEntries.find(
      ([_, code]) => code === layer.fragmentShader
    );
    
    if (matchingPreset) {
      return matchingPreset[0];
    }
    
    return 'none';
  };
  
  // Function to reset all shader layers
  const handleResetAllLayers = () => {
    onShaderOptionsChange({
      layers: [{
        fragmentShader: SHADER_PRESETS.none,
        uniforms: {},
        intensity: 0.5,
        enabled: true,
        customCode: '',
        name: 'Layer 1',
        opacity: 1.0
      }],
      enabled: false
    });
  };
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">WebGL Shader Effects</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={shaderOptions.enabled}
                onChange={handleEnableChange}
                color="primary"
              />
            }
            label="Enable Shaders"
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {shaderOptions.enabled && (
          <>
            {shaderOptions.layers.map((layer, index) => (
              <Paper 
                elevation={1} 
                sx={{ p: 2, mb: 2, backgroundColor: (theme) => theme.palette.background.default }}
                key={index}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layer.enabled}
                          onChange={() => handleToggleLayerEnabled(index)}
                          disabled={!shaderOptions.enabled}
                        />
                      }
                      label={`Layer ${index + 1}: ${layer.name || 'Unnamed'}`}
                    />
                    
                    <IconButton 
                      onClick={() => handleRemoveLayer(index)}
                      disabled={shaderOptions.layers.length <= 1}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Shader Type</InputLabel>
                      <Select
                        value={layer.name || Object.keys(SHADER_PRESETS).find(
                          key => SHADER_PRESETS[key as keyof typeof SHADER_PRESETS] === layer.fragmentShader
                        ) || 'none'}
                        onChange={(e) => handleLayerPresetChange(index, e)}
                        label="Shader Type"
                        disabled={!layer.enabled || !shaderOptions.enabled}
                      >
                        {Object.keys(SHADER_PRESETS).map((key) => (
                          <MenuItem key={key} value={key}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography gutterBottom>Intensity</Typography>
                    <Slider
                      value={layer.intensity}
                      onChange={(_, value) => handleLayerIntensityChange(index, value as number)}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={!layer.enabled || !shaderOptions.enabled}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography gutterBottom>Opacity</Typography>
                    <Slider
                      value={layer.opacity || 1.0}
                      onChange={(_, value) => handleLayerOpacityChange(index, value as number)}
                      min={0}
                      max={1}
                      step={0.01}
                      disabled={!layer.enabled || !shaderOptions.enabled}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleAddLayer}
              fullWidth
              sx={{ mt: 1 }}
              disabled={!shaderOptions.enabled}
            >
              Add Shader Layer
            </Button>
          </>
        )}
      </Paper>
      
      {/* Edit Layer Dialog */}
      <Dialog
        open={editLayerDialogOpen}
        onClose={handleCloseEditLayerDialog}
        maxWidth="sm"
        fullWidth
      >
        {editingLayerIndex >= 0 && editingLayerIndex < shaderOptions.layers.length && (
          <>
            <DialogTitle>
              Edit Shader Layer
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Layer Name"
                    fullWidth
                    value={shaderOptions.layers[editingLayerIndex].name || `Layer ${editingLayerIndex + 1}`}
                    onChange={handleLayerNameChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <FormLabel>Shader Type</FormLabel>
                    <Select
                      value={getLayerPresetName(shaderOptions.layers[editingLayerIndex])}
                      onChange={(e) => handleLayerPresetChange(editingLayerIndex, e)}
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
                      value={shaderOptions.layers[editingLayerIndex].intensity}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(_, value) => handleLayerIntensityChange(editingLayerIndex, value as number)}
                      disabled={getLayerPresetName(shaderOptions.layers[editingLayerIndex]) === 'none'}
                    />
                    <Typography sx={{ ml: 2, minWidth: '45px' }}>
                      {Math.round(shaderOptions.layers[editingLayerIndex].intensity * 100)}%
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <FormLabel>Layer Opacity</FormLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Slider
                      value={shaderOptions.layers[editingLayerIndex].opacity || 1.0}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(_, value) => handleLayerOpacityChange(editingLayerIndex, value as number)}
                    />
                    <Typography sx={{ ml: 2, minWidth: '45px' }}>
                      {Math.round((shaderOptions.layers[editingLayerIndex].opacity || 1.0) * 100)}%
                    </Typography>
                  </Box>
                </Grid>
                
                {shaderOptions.layers[editingLayerIndex].customCode && (
                  <Grid item xs={12}>
                    <Button
                      startIcon={<CodeIcon />}
                      variant="outlined"
                      fullWidth
                      onClick={handleOpenCodeEditor}
                    >
                      Edit Custom Shader
                    </Button>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseEditLayerDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
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
                <code>uniform float u_opacity;</code> - Layer opacity (0.0-1.0)
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