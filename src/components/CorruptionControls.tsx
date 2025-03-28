import React, { useCallback, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Divider, 
         FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent,
         Slider, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { ExpandMore, Refresh, Upload } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { ByteCorruptOptions, ChunkSwapOptions, BinaryXorOptions } from '../hooks/useGlitchEffect';
import { BlendImage, BlendMode, BlendOptions } from '../hooks/useImageBlender';

interface CorruptionControlsProps {
  byteCorrupt: ByteCorruptOptions | undefined;
  chunkSwap: ChunkSwapOptions | undefined;
  binaryXor: BinaryXorOptions | undefined;
  secondaryImages: BlendImage[];
  selectedImage: BlendImage | null;
  blendOptions: BlendOptions;
  onByteCorruptChange: (options: ByteCorruptOptions | undefined) => void;
  onChunkSwapChange: (options: ChunkSwapOptions | undefined) => void;
  onBinaryXorChange: (options: BinaryXorOptions | undefined) => void;
  onBlendImageUpload: (file: File) => Promise<void>;
  onBlendImageSelect: (index: number) => void;
  onBlendOptionsChange: (options: Partial<BlendOptions>) => void;
  onBlendReset: () => void;
}

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#f5f5f5',
  borderRadius: '4px',
  marginBottom: theme.spacing(1),
  '& .MuiAccordionSummary-root': {
    borderRadius: '4px',
  }
}));

const SliderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: theme.spacing(2),
  '& .MuiSlider-root': {
    width: '70%',
    marginLeft: theme.spacing(2),
  },
  '& .MuiTypography-root': {
    minWidth: '80px',
  }
}));

export const CorruptionControls: React.FC<CorruptionControlsProps> = ({
  byteCorrupt,
  chunkSwap,
  binaryXor,
  secondaryImages,
  selectedImage,
  blendOptions,
  onByteCorruptChange,
  onChunkSwapChange,
  onBinaryXorChange,
  onBlendImageUpload,
  onBlendImageSelect,
  onBlendOptionsChange,
  onBlendReset
}) => {
  const [byteCorruptExpanded, setByteCorruptExpanded] = useState(false);
  const [chunkSwapExpanded, setChunkSwapExpanded] = useState(false);
  const [binaryXorExpanded, setBinaryXorExpanded] = useState(false);
  const [imageBlendExpanded, setImageBlendExpanded] = useState(false);

  // Helper to create or update byte corruption options
  const handleByteCorruptChange = useCallback((update: Partial<ByteCorruptOptions>) => {
    const newOptions: ByteCorruptOptions = {
      amount: 0.5,
      mode: 0,
      blockSize: 1,
      structured: false,
      ...byteCorrupt,
      ...update
    };
    onByteCorruptChange(newOptions);
  }, [byteCorrupt, onByteCorruptChange]);

  // Helper to clear byte corruption
  const handleClearByteCorrupt = useCallback(() => {
    onByteCorruptChange(undefined);
  }, [onByteCorruptChange]);

  // Helper to create or update chunk swap options
  const handleChunkSwapChange = useCallback((update: Partial<ChunkSwapOptions>) => {
    const newOptions: ChunkSwapOptions = {
      amount: 0.5,
      chunkSize: 0.5,
      preserveAlpha: true,
      ...chunkSwap,
      ...update
    };
    onChunkSwapChange(newOptions);
  }, [chunkSwap, onChunkSwapChange]);

  // Helper to clear chunk swap
  const handleClearChunkSwap = useCallback(() => {
    onChunkSwapChange(undefined);
  }, [onChunkSwapChange]);

  // Helper to create or update binary XOR options
  const handleBinaryXorChange = useCallback((update: Partial<BinaryXorOptions>) => {
    const newOptions: BinaryXorOptions = {
      strength: 0.5,
      mode: 0,
      ...binaryXor,
      ...update
    };
    onBinaryXorChange(newOptions);
  }, [binaryXor, onBinaryXorChange]);

  // Helper to clear binary XOR
  const handleClearBinaryXor = useCallback(() => {
    onBinaryXorChange(undefined);
  }, [onBinaryXorChange]);

  // Handler for image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onBlendImageUpload(files[0]);
    }
  }, [onBlendImageUpload]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        File Corruption Effects
      </Typography>
      
      {/* Byte Corruption Controls */}
      <StyledAccordion 
        expanded={byteCorruptExpanded} 
        onChange={() => setByteCorruptExpanded(!byteCorruptExpanded)}
      >
        <AccordionSummary 
          expandIcon={<ExpandMore />}
          sx={{ bgcolor: byteCorrupt ? 'error.dark' : undefined }}
        >
          <Typography>Byte Corruption</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" paragraph>
            Corrupt individual bytes in the image data to create digital artifacts.
          </Typography>
          
          <SliderBox>
            <Typography>Amount:</Typography>
            <Slider
              value={byteCorrupt?.amount || 0}
              onChange={(_, value) => handleByteCorruptChange({ amount: value as number })}
              min={0}
              max={1}
              step={0.01}
              disabled={!byteCorrupt}
            />
          </SliderBox>
          
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Corruption Mode</InputLabel>
              <Select
                value={byteCorrupt?.mode?.toString() || ''}
                label="Corruption Mode"
                onChange={(e) => handleByteCorruptChange({ mode: parseInt(e.target.value) })}
                disabled={!byteCorrupt}
              >
                <MenuItem value={0}>Random Bytes</MenuItem>
                <MenuItem value={1}>Bit Flip</MenuItem>
                <MenuItem value={2}>Zero Out</MenuItem>
                <MenuItem value={3}>Max Out</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <SliderBox>
            <Typography>Block Size:</Typography>
            <Slider
              value={byteCorrupt?.blockSize || 1}
              onChange={(_, value) => handleByteCorruptChange({ blockSize: value as number })}
              min={1}
              max={32}
              step={1}
              disabled={!byteCorrupt}
              marks={[
                { value: 1, label: '1' },
                { value: 8, label: '8' },
                { value: 16, label: '16' },
                { value: 32, label: '32' }
              ]}
            />
          </SliderBox>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={byteCorrupt?.structured || false}
                  onChange={(_, checked) => handleByteCorruptChange({ structured: checked })}
                  disabled={!byteCorrupt}
                />
              }
              label="Use Structured Patterns"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {!byteCorrupt ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleByteCorruptChange({})}
              >
                Enable Byte Corruption
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleClearByteCorrupt}
              >
                Disable
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </StyledAccordion>
      
      {/* Chunk Swap Controls */}
      <StyledAccordion 
        expanded={chunkSwapExpanded} 
        onChange={() => setChunkSwapExpanded(!chunkSwapExpanded)}
      >
        <AccordionSummary 
          expandIcon={<ExpandMore />}
          sx={{ bgcolor: chunkSwap ? 'warning.dark' : undefined }}
        >
          <Typography>Chunk Swap</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" paragraph>
            Swap chunks of the image data to create visual disruptions.
          </Typography>
          
          <SliderBox>
            <Typography>Amount:</Typography>
            <Slider
              value={chunkSwap?.amount || 0}
              onChange={(_, value) => handleChunkSwapChange({ amount: value as number })}
              min={0}
              max={1}
              step={0.01}
              disabled={!chunkSwap}
            />
          </SliderBox>
          
          <SliderBox>
            <Typography>Chunk Size:</Typography>
            <Slider
              value={chunkSwap?.chunkSize || 0.5}
              onChange={(_, value) => handleChunkSwapChange({ chunkSize: value as number })}
              min={0.1}
              max={1}
              step={0.05}
              disabled={!chunkSwap}
              marks={[
                { value: 0.1, label: 'Small' },
                { value: 0.5, label: 'Medium' },
                { value: 1, label: 'Large' }
              ]}
            />
          </SliderBox>
          
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={chunkSwap?.preserveAlpha || false}
                  onChange={(_, checked) => handleChunkSwapChange({ preserveAlpha: checked })}
                  disabled={!chunkSwap}
                />
              }
              label="Preserve Alpha Channel"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {!chunkSwap ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleChunkSwapChange({})}
              >
                Enable Chunk Swap
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleClearChunkSwap}
              >
                Disable
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </StyledAccordion>
      
      {/* Binary XOR Controls */}
      <StyledAccordion 
        expanded={binaryXorExpanded} 
        onChange={() => setBinaryXorExpanded(!binaryXorExpanded)}
      >
        <AccordionSummary 
          expandIcon={<ExpandMore />}
          sx={{ bgcolor: binaryXor ? 'info.dark' : undefined }}
        >
          <Typography>Binary XOR</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" paragraph>
            Apply bitwise XOR operations to create fractal-like patterns.
          </Typography>
          
          <SliderBox>
            <Typography>Strength:</Typography>
            <Slider
              value={binaryXor?.strength || 0}
              onChange={(_, value) => handleBinaryXorChange({ strength: value as number })}
              min={0}
              max={1}
              step={0.01}
              disabled={!binaryXor}
            />
          </SliderBox>
          
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Pattern Mode</InputLabel>
              <Select
                value={binaryXor?.mode?.toString() || ''}
                label="Pattern Mode"
                onChange={(e) => handleBinaryXorChange({ mode: parseInt(e.target.value) })}
                disabled={!binaryXor}
              >
                <MenuItem value={0}>Full Image</MenuItem>
                <MenuItem value={1}>Horizontal Bands</MenuItem>
                <MenuItem value={2}>Vertical Bands</MenuItem>
                <MenuItem value={3}>Blocks</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {!binaryXor ? (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleBinaryXorChange({})}
              >
                Enable Binary XOR
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleClearBinaryXor}
              >
                Disable
              </Button>
            )}
          </Box>
        </AccordionDetails>
      </StyledAccordion>
      
      {/* Image Blend Controls */}
      <StyledAccordion 
        expanded={imageBlendExpanded} 
        onChange={() => setImageBlendExpanded(!imageBlendExpanded)}
      >
        <AccordionSummary 
          expandIcon={<ExpandMore />}
          sx={{ bgcolor: selectedImage ? 'success.dark' : undefined }}
        >
          <Typography>Image Contamination</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" paragraph>
            Blend another image into the current one to create unique contamination effects.
          </Typography>
          
          {/* Upload Control */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
            >
              Upload Image for Contamination
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
          
          {/* Secondary Image Gallery */}
          {secondaryImages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Contamination Sources ({secondaryImages.length})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                {secondaryImages.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => onBlendImageSelect(idx)}
                    sx={{
                      border: img === selectedImage ? '2px solid #4caf50' : '2px solid transparent',
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      minWidth: '60px',
                      minHeight: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={img.dataUrl}
                      alt={`Source ${idx + 1}`}
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
          
          {/* Blend Controls */}
          {selectedImage && (
            <>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Blend Mode</InputLabel>
                  <Select
                    value={blendOptions.mode}
                    label="Blend Mode"
                    onChange={(e) => onBlendOptionsChange({ mode: e.target.value as BlendMode })}
                  >
                    <MenuItem value="mix">Mix</MenuItem>
                    <MenuItem value="difference">Difference</MenuItem>
                    <MenuItem value="multiply">Multiply</MenuItem>
                    <MenuItem value="screen">Screen</MenuItem>
                    <MenuItem value="overlay">Overlay</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <SliderBox>
                <Typography>Amount:</Typography>
                <Slider
                  value={blendOptions.amount}
                  onChange={(_, value) => onBlendOptionsChange({ amount: value as number })}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </SliderBox>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Position Offset</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="X Offset"
                    type="number"
                    size="small"
                    value={blendOptions.offsetX}
                    onChange={(e) => onBlendOptionsChange({ offsetX: parseInt(e.target.value) || 0 })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Y Offset"
                    type="number"
                    size="small"
                    value={blendOptions.offsetY}
                    onChange={(e) => onBlendOptionsChange({ offsetY: parseInt(e.target.value) || 0 })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onBlendReset}
                >
                  Reset Blend Options
                </Button>
              </Box>
            </>
          )}
          
          {secondaryImages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
              Upload an image to use as a contamination source.
            </Typography>
          )}
        </AccordionDetails>
      </StyledAccordion>
    </Box>
  );
}; 