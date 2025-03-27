import React, { useState } from 'react';
import {
  Box,
  Slider,
  Typography,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { GlitchOptions } from '../hooks/useGlitchEffect';

interface EffectControlsProps {
  effects: GlitchOptions;
  onChange: (newEffects: GlitchOptions) => void;
  onReset: () => void;
  onSave: () => void;
  animationEnabled?: boolean;
  onAnimationToggle?: (enabled: boolean) => void;
  animationSpeed?: number;
  onAnimationSpeedChange?: (speed: number) => void;
  animationIntensity?: number;
  onAnimationIntensityChange?: (intensity: number) => void;
  chaoticMode?: boolean;
  onChaoticModeToggle?: (enabled: boolean) => void;
  audioReactive?: boolean;
  onAudioReactiveToggle?: (enabled: boolean) => void;
  microphoneActive?: boolean;
  onMicrophoneToggle?: () => void;
}

const EffectControls: React.FC<EffectControlsProps> = ({
  effects,
  onChange,
  onReset,
  onSave,
  animationEnabled = false,
  onAnimationToggle,
  animationSpeed = 0.5,
  onAnimationSpeedChange,
  animationIntensity = 0.5,
  onAnimationIntensityChange,
  chaoticMode = false,
  onChaoticModeToggle,
  audioReactive = false,
  onAudioReactiveToggle,
  microphoneActive = false,
  onMicrophoneToggle,
}) => {
  // Update the expanded state to handle both main and channel accordions
  const [mainExpanded, setMainExpanded] = useState<string | false>('panel1');
  const [channelExpanded, setChannelExpanded] = useState<string | false>(false);

  const handleMainAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setMainExpanded(isExpanded ? panel : false);
  };

  const handleChannelAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    // Stop event propagation to prevent parent accordion from closing
    event.stopPropagation();
    setChannelExpanded(isExpanded ? panel : false);
  };

  // Helper functions to update effect options
  const updatePixelSort = (field: string, value: any) => {
    onChange({
      ...effects,
      pixelSort: {
        ...(effects.pixelSort || { intensity: 0.5, threshold: 0.5, vertical: false }),
        [field]: value,
      },
    });
  };

  const updateDataBend = (field: string, value: any) => {
    onChange({
      ...effects,
      dataBend: {
        ...(effects.dataBend || { amount: 0.5, chunkSize: 0.5 }),
        [field]: value,
      },
    });
  };

  const updateChannelShift = (field: string, value: any) => {
    onChange({
      ...effects,
      channelShift: {
        ...(effects.channelShift || { amount: 0.5, channels: [0, 1, 2] }),
        [field]: value,
      },
    });
  };

  const updateNoise = (value: number) => {
    onChange({ ...effects, noise: value });
  };

  const updateQuantize = (value: number) => {
    onChange({ ...effects, quantize: value });
  };

  const updateInvert = (channel: number) => {
    const currentInvert = effects.invert || [];
    const newInvert = currentInvert.includes(channel)
      ? currentInvert.filter(c => c !== channel)
      : [...currentInvert, channel];
    
    onChange({ ...effects, invert: newInvert });
  };

  // Colors for each effect type
  const colors = {
    pixelSort: '#0A84FF',
    dataBend: '#30D158',
    channelShift: '#FF453A',
    noise: '#FFD60A',
    invert: '#BF5AF2',
    quantize: '#FF9F0A',
    animation: '#5E5CE6', // New color for animation controls
  };

  return (
    <Paper 
      sx={{ 
        p: 3,
        borderRadius: 2,
        backgroundColor: 'rgba(28, 28, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        overflowY: 'auto',
        maxHeight: '80vh',
      }}
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Glitch Controls
          </Typography>
          <Box>
            <Tooltip title="Reset Effects">
              <span>
                <IconButton 
                  onClick={onReset}
                  sx={{ 
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Save Image">
              <span>
                <IconButton 
                  onClick={onSave}
                  sx={{ 
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Animation Controls */}
        <Accordion 
          expanded={mainExpanded === 'panel-animation'} 
          onChange={handleMainAccordionChange('panel-animation')}
          sx={{ 
            backgroundColor: 'rgba(94, 92, 230, 0.2)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.animation }} />}
            sx={{ borderBottom: `1px solid ${colors.animation}20` }}
          >
            <Typography sx={{ color: colors.animation, fontWeight: 500 }}>Animation & Audio</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={animationEnabled}
                      onChange={(e) => onAnimationToggle?.(e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colors.animation,
                          '&:hover': { backgroundColor: `${colors.animation}14` }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: colors.animation,
                        }
                      }}
                    />
                  }
                  label="Enable Animation"
                  sx={{ color: '#fff' }}
                />
                
                <Tooltip title={animationEnabled ? "Pause Animation" : "Play Animation"}>
                  <span>
                    <IconButton 
                      onClick={() => onAnimationToggle?.(!animationEnabled)}
                      sx={{ 
                        color: animationEnabled ? colors.animation : '#fff',
                        backgroundColor: animationEnabled ? `${colors.animation}20` : 'rgba(255, 255, 255, 0.1)',
                        '&:hover': { backgroundColor: animationEnabled ? `${colors.animation}30` : 'rgba(255, 255, 255, 0.2)' }
                      }}
                    >
                      {animationEnabled ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              
              {animationEnabled && (
                <>
                  <Box>
                    <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                      Animation Speed
                    </Typography>
                    <Slider
                      value={animationSpeed}
                      onChange={(_, value) => onAnimationSpeedChange?.(value as number)}
                      min={0.1}
                      max={1}
                      step={0.01}
                      sx={{ color: colors.animation }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                      Animation Intensity
                    </Typography>
                    <Slider
                      value={animationIntensity}
                      onChange={(_, value) => onAnimationIntensityChange?.(value as number)}
                      min={0.1}
                      max={1}
                      step={0.01}
                      sx={{ color: colors.animation }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={chaoticMode}
                          onChange={(e) => onChaoticModeToggle?.(e.target.checked)}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.animation,
                              '&:hover': { backgroundColor: `${colors.animation}14` }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.animation,
                            }
                          }}
                        />
                      }
                      label="Chaotic Mode"
                      sx={{ color: '#fff' }}
                    />
                    <Tooltip title={chaoticMode ? "Smooth animation" : "Random jumps"}>
                      <Box sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        p: 0.5, 
                        borderRadius: 1, 
                        bgcolor: chaoticMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                        color: chaoticMode ? '#ff6b6b' : '#4ade80',
                        mx: 1
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {chaoticMode ? "CHAOS" : "SMOOTH"}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                  
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={audioReactive}
                          onChange={(e) => onAudioReactiveToggle?.(e.target.checked)}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.animation,
                              '&:hover': { backgroundColor: `${colors.animation}14` }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.animation,
                            }
                          }}
                        />
                      }
                      label="Audio Reactive"
                      sx={{ color: '#fff' }}
                    />
                    
                    <Tooltip title={microphoneActive ? "Disable Microphone" : "Enable Microphone"}>
                      <span>
                        <IconButton 
                          onClick={onMicrophoneToggle}
                          disabled={!audioReactive}
                          sx={{ 
                            color: microphoneActive && audioReactive ? colors.animation : '#888',
                            backgroundColor: microphoneActive && audioReactive ? `${colors.animation}20` : 'rgba(255, 255, 255, 0.1)',
                            '&:hover': { 
                              backgroundColor: !audioReactive 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : microphoneActive 
                                  ? `${colors.animation}30` 
                                  : 'rgba(255, 255, 255, 0.2)'
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.3)',
                            }
                          }}
                        >
                          {microphoneActive ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  
                  {audioReactive && (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                      Bass will affect pixel sorting, mids will affect data bending, and treble will affect channel shifting
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Pixel Sort */}
        <Accordion 
          expanded={mainExpanded === 'panel1'} 
          onChange={handleMainAccordionChange('panel1')}
          sx={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.5)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.pixelSort }} />}
            sx={{ borderBottom: `1px solid ${colors.pixelSort}20` }}
          >
            <Typography sx={{ color: colors.pixelSort, fontWeight: 500 }}>Pixel Sort</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Intensity
                </Typography>
                <Slider
                  value={effects.pixelSort?.intensity || 0}
                  onChange={(_, value) => updatePixelSort('intensity', value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.pixelSort }}
                />
              </Box>
              
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Threshold
                </Typography>
                <Slider
                  value={effects.pixelSort?.threshold || 0}
                  onChange={(_, value) => updatePixelSort('threshold', value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.pixelSort }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={Boolean(effects.pixelSort?.vertical)}
                      onChange={(e) => updatePixelSort('vertical', e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colors.pixelSort,
                          '&:hover': { backgroundColor: `${colors.pixelSort}14` }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: colors.pixelSort,
                        }
                      }}
                    />
                  }
                  label="Vertical"
                  sx={{ color: '#fff' }}
                />
                
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="pixel-sort-channel-label" sx={{ color: '#fff' }}>Channel</InputLabel>
                  <Select
                    labelId="pixel-sort-channel-label"
                    value={effects.pixelSort?.channel ?? ''}
                    onChange={(e) => updatePixelSort('channel', e.target.value === '' ? undefined : Number(e.target.value))}
                    label="Channel"
                    sx={{ 
                      color: '#fff', 
                      '.MuiOutlinedInput-notchedOutline': { borderColor: `${colors.pixelSort}50` },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.pixelSort },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.pixelSort },
                    }}
                  >
                    <MenuItem value="">Brightness</MenuItem>
                    <MenuItem value={0}>Red</MenuItem>
                    <MenuItem value={1}>Green</MenuItem>
                    <MenuItem value={2}>Blue</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Data Bend */}
        <Accordion 
          expanded={mainExpanded === 'panel2'} 
          onChange={handleMainAccordionChange('panel2')}
          sx={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.5)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.dataBend }} />}
            sx={{ borderBottom: `1px solid ${colors.dataBend}20` }}
          >
            <Typography sx={{ color: colors.dataBend, fontWeight: 500 }}>Data Bend</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Amount
                </Typography>
                <Slider
                  value={effects.dataBend?.amount || 0}
                  onChange={(_, value) => updateDataBend('amount', value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.dataBend }}
                />
              </Box>
              
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Chunk Size
                </Typography>
                <Slider
                  value={effects.dataBend?.chunkSize || 0.5}
                  onChange={(_, value) => updateDataBend('chunkSize', value as number)}
                  min={0.1}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.dataBend }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="data-bend-mode-label" sx={{ color: '#fff' }}>Mode</InputLabel>
                  <Select
                    labelId="data-bend-mode-label"
                    value={effects.dataBend?.mode ?? ''}
                    onChange={(e) => updateDataBend('mode', e.target.value === '' ? undefined : Number(e.target.value))}
                    label="Mode"
                    sx={{ 
                      color: '#fff', 
                      '.MuiOutlinedInput-notchedOutline': { borderColor: `${colors.dataBend}50` },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.dataBend },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.dataBend },
                    }}
                  >
                    <MenuItem value="">Random</MenuItem>
                    <MenuItem value={0}>Duplicate</MenuItem>
                    <MenuItem value={1}>Reverse</MenuItem>
                    <MenuItem value={2}>Shift</MenuItem>
                    <MenuItem value={3}>Scramble</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="data-bend-channel-label" sx={{ color: '#fff' }}>Channel</InputLabel>
                  <Select
                    labelId="data-bend-channel-label"
                    value={effects.dataBend?.channel ?? ''}
                    onChange={(e) => updateDataBend('channel', e.target.value === '' ? undefined : Number(e.target.value))}
                    label="Channel"
                    sx={{ 
                      color: '#fff', 
                      '.MuiOutlinedInput-notchedOutline': { borderColor: `${colors.dataBend}50` },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.dataBend },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.dataBend },
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value={0}>Red</MenuItem>
                    <MenuItem value={1}>Green</MenuItem>
                    <MenuItem value={2}>Blue</MenuItem>
                    <MenuItem value={3}>Alpha</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Channel Shift */}
        <Accordion 
          expanded={mainExpanded === 'panel3'} 
          onChange={handleMainAccordionChange('panel3')}
          sx={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.5)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.channelShift }} />}
            sx={{ borderBottom: `1px solid ${colors.channelShift}20` }}
          >
            <Typography sx={{ color: colors.channelShift, fontWeight: 500 }}>Channel Shift</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Amount
                </Typography>
                <Slider
                  value={effects.channelShift?.amount || 0}
                  onChange={(_, value) => updateChannelShift('amount', value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.channelShift }}
                />
              </Box>
              
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Direction
                </Typography>
                <FormControl variant="outlined" size="small" fullWidth>
                  <Select
                    value={effects.channelShift?.direction ?? 0}
                    onChange={(e) => updateChannelShift('direction', Number(e.target.value))}
                    sx={{ 
                      color: '#fff', 
                      '.MuiOutlinedInput-notchedOutline': { borderColor: `${colors.channelShift}50` },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.channelShift },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.channelShift },
                    }}
                  >
                    <MenuItem value={0}>Random</MenuItem>
                    <MenuItem value={-1}>Left</MenuItem>
                    <MenuItem value={1}>Right</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box>
                <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Channels
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant={effects.channelShift?.channels?.includes(0) ? "contained" : "outlined"}
                    onClick={() => {
                      const current = effects.channelShift?.channels || [0, 1, 2];
                      const newChannels = current.includes(0) 
                        ? current.filter(c => c !== 0) 
                        : [...current, 0];
                      updateChannelShift('channels', newChannels.length ? newChannels : [0, 1, 2]);
                    }}
                    sx={{ 
                      color: effects.channelShift?.channels?.includes(0) ? '#fff' : '#FF453A',
                      borderColor: '#FF453A',
                      backgroundColor: effects.channelShift?.channels?.includes(0) ? '#FF453A' : 'transparent',
                      '&:hover': {
                        backgroundColor: effects.channelShift?.channels?.includes(0) ? '#FF453A' : 'rgba(255, 69, 58, 0.1)',
                      }
                    }}
                  >
                    R
                  </Button>
                  <Button 
                    variant={effects.channelShift?.channels?.includes(1) ? "contained" : "outlined"}
                    onClick={() => {
                      const current = effects.channelShift?.channels || [0, 1, 2];
                      const newChannels = current.includes(1) 
                        ? current.filter(c => c !== 1) 
                        : [...current, 1];
                      updateChannelShift('channels', newChannels.length ? newChannels : [0, 1, 2]);
                    }}
                    sx={{ 
                      color: effects.channelShift?.channels?.includes(1) ? '#fff' : '#30D158',
                      borderColor: '#30D158',
                      backgroundColor: effects.channelShift?.channels?.includes(1) ? '#30D158' : 'transparent',
                      '&:hover': {
                        backgroundColor: effects.channelShift?.channels?.includes(1) ? '#30D158' : 'rgba(48, 209, 88, 0.1)',
                      }
                    }}
                  >
                    G
                  </Button>
                  <Button 
                    variant={effects.channelShift?.channels?.includes(2) ? "contained" : "outlined"}
                    onClick={() => {
                      const current = effects.channelShift?.channels || [0, 1, 2];
                      const newChannels = current.includes(2) 
                        ? current.filter(c => c !== 2) 
                        : [...current, 2];
                      updateChannelShift('channels', newChannels.length ? newChannels : [0, 1, 2]);
                    }}
                    sx={{ 
                      color: effects.channelShift?.channels?.includes(2) ? '#fff' : '#0A84FF',
                      borderColor: '#0A84FF',
                      backgroundColor: effects.channelShift?.channels?.includes(2) ? '#0A84FF' : 'transparent',
                      '&:hover': {
                        backgroundColor: effects.channelShift?.channels?.includes(2) ? '#0A84FF' : 'rgba(10, 132, 255, 0.1)',
                      }
                    }}
                  >
                    B
                  </Button>
                </Box>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
        
        {/* Additional Effects */}
        <Accordion 
          expanded={mainExpanded === 'panel4'} 
          onChange={handleMainAccordionChange('panel4')}
          sx={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.5)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colors.noise }} />}
            sx={{ borderBottom: `1px solid ${colors.noise}20` }}
          >
            <Typography sx={{ color: colors.noise, fontWeight: 500 }}>More Effects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              <Box>
                <Typography gutterBottom sx={{ color: colors.noise, fontSize: '0.875rem', fontWeight: 500 }}>
                  Noise
                </Typography>
                <Slider
                  value={effects.noise || 0}
                  onChange={(_, value) => updateNoise(value as number)}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ color: colors.noise }}
                />
              </Box>
              
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box>
                <Typography gutterBottom sx={{ color: colors.invert, fontSize: '0.875rem', fontWeight: 500 }}>
                  Invert Channels
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant={(effects.invert || []).includes(0) ? "contained" : "outlined"}
                    onClick={() => updateInvert(0)}
                    sx={{ 
                      color: (effects.invert || []).includes(0) ? '#fff' : '#FF453A',
                      borderColor: '#FF453A',
                      backgroundColor: (effects.invert || []).includes(0) ? '#FF453A' : 'transparent',
                      '&:hover': {
                        backgroundColor: (effects.invert || []).includes(0) ? '#FF453A' : 'rgba(255, 69, 58, 0.1)',
                      }
                    }}
                  >
                    R
                  </Button>
                  <Button 
                    variant={(effects.invert || []).includes(1) ? "contained" : "outlined"}
                    onClick={() => updateInvert(1)}
                    sx={{ 
                      color: (effects.invert || []).includes(1) ? '#fff' : '#30D158',
                      borderColor: '#30D158',
                      backgroundColor: (effects.invert || []).includes(1) ? '#30D158' : 'transparent',
                      '&:hover': {
                        backgroundColor: (effects.invert || []).includes(1) ? '#30D158' : 'rgba(48, 209, 88, 0.1)',
                      }
                    }}
                  >
                    G
                  </Button>
                  <Button 
                    variant={(effects.invert || []).includes(2) ? "contained" : "outlined"}
                    onClick={() => updateInvert(2)}
                    sx={{ 
                      color: (effects.invert || []).includes(2) ? '#fff' : '#0A84FF',
                      borderColor: '#0A84FF',
                      backgroundColor: (effects.invert || []).includes(2) ? '#0A84FF' : 'transparent',
                      '&:hover': {
                        backgroundColor: (effects.invert || []).includes(2) ? '#0A84FF' : 'rgba(10, 132, 255, 0.1)',
                      }
                    }}
                  >
                    B
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box>
                <Typography gutterBottom sx={{ color: colors.quantize, fontSize: '0.875rem', fontWeight: 500 }}>
                  Quantize ({effects.quantize || 256} Colors)
                </Typography>
                <Slider
                  value={effects.quantize || 256}
                  onChange={(_, value) => updateQuantize(value as number)}
                  min={2}
                  max={256}
                  step={1}
                  marks={[
                    { value: 2, label: '2' },
                    { value: 16, label: '16' },
                    { value: 64, label: '64' },
                    { value: 256, label: '256' },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ color: colors.quantize }}
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Channel-Specific Effects */}
        <Accordion 
          expanded={mainExpanded === 'panel5'} 
          onChange={handleMainAccordionChange('panel5')}
          sx={{ 
            backgroundColor: 'rgba(28, 28, 30, 0.5)',
            color: '#fff',
            borderRadius: '8px',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
            sx={{ borderBottom: `1px solid rgba(255, 255, 255, 0.1)` }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 500 }}>Channel Effects</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Apply effects to individual color channels for more creative control
              </Typography>
              
              {/* Red Channel accordion */}
              <Accordion 
                expanded={channelExpanded === 'red-channel'} 
                onChange={(event, isExpanded) => {
                  // Stop propagation to prevent parent accordion from toggling
                  event.stopPropagation();
                  setChannelExpanded(isExpanded ? 'red-channel' : false);
                }}
                sx={{ 
                  backgroundColor: 'rgba(255, 69, 58, 0.15)',
                  color: '#fff',
                  borderRadius: '8px',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#FF453A' }} />}
                  sx={{ borderBottom: `1px solid rgba(255, 69, 58, 0.2)` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography sx={{ color: '#FF453A', fontWeight: 500 }}>Red Channel</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Pixel Sort
                      </Typography>
                      <Slider
                        value={effects.redChannel?.pixelSort?.intensity || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.redChannel) {
                            newEffects.redChannel = {};
                          }
                          newEffects.redChannel.pixelSort = {
                            ...(newEffects.redChannel.pixelSort || { threshold: 0.5, vertical: false }),
                            intensity: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#FF453A' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Data Bend
                      </Typography>
                      <Slider
                        value={effects.redChannel?.dataBend?.amount || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.redChannel) {
                            newEffects.redChannel = {};
                          }
                          newEffects.redChannel.dataBend = {
                            ...(newEffects.redChannel.dataBend || { chunkSize: 0.5 }),
                            amount: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#FF453A' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Noise
                      </Typography>
                      <Slider
                        value={effects.redChannel?.noise || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.redChannel) {
                            newEffects.redChannel = {};
                          }
                          newEffects.redChannel.noise = value as number;
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#FF453A' }}
                      />
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={Boolean(effects.redChannel?.invert)}
                          onChange={(e) => {
                            const newEffects = { ...effects };
                            if (!newEffects.redChannel) {
                              newEffects.redChannel = {};
                            }
                            newEffects.redChannel.invert = e.target.checked;
                            onChange(newEffects);
                          }}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#FF453A',
                              '&:hover': { backgroundColor: `rgba(255, 69, 58, 0.2)` }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#FF453A',
                            }
                          }}
                        />
                      }
                      label="Invert Channel"
                      sx={{ color: '#fff' }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Green Channel accordion */}
              <Accordion 
                expanded={channelExpanded === 'green-channel'} 
                onChange={(event, isExpanded) => {
                  // Stop propagation to prevent parent accordion from toggling
                  event.stopPropagation();
                  setChannelExpanded(isExpanded ? 'green-channel' : false);
                }}
                sx={{ 
                  backgroundColor: 'rgba(48, 209, 88, 0.15)',
                  color: '#fff',
                  borderRadius: '8px',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#30D158' }} />}
                  sx={{ borderBottom: `1px solid rgba(48, 209, 88, 0.2)` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography sx={{ color: '#30D158', fontWeight: 500 }}>Green Channel</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Pixel Sort
                      </Typography>
                      <Slider
                        value={effects.greenChannel?.pixelSort?.intensity || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.greenChannel) {
                            newEffects.greenChannel = {};
                          }
                          newEffects.greenChannel.pixelSort = {
                            ...(newEffects.greenChannel.pixelSort || { threshold: 0.5, vertical: false }),
                            intensity: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#30D158' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Data Bend
                      </Typography>
                      <Slider
                        value={effects.greenChannel?.dataBend?.amount || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.greenChannel) {
                            newEffects.greenChannel = {};
                          }
                          newEffects.greenChannel.dataBend = {
                            ...(newEffects.greenChannel.dataBend || { chunkSize: 0.5 }),
                            amount: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#30D158' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Noise
                      </Typography>
                      <Slider
                        value={effects.greenChannel?.noise || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.greenChannel) {
                            newEffects.greenChannel = {};
                          }
                          newEffects.greenChannel.noise = value as number;
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#30D158' }}
                      />
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={Boolean(effects.greenChannel?.invert)}
                          onChange={(e) => {
                            const newEffects = { ...effects };
                            if (!newEffects.greenChannel) {
                              newEffects.greenChannel = {};
                            }
                            newEffects.greenChannel.invert = e.target.checked;
                            onChange(newEffects);
                          }}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#30D158',
                              '&:hover': { backgroundColor: `rgba(48, 209, 88, 0.2)` }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#30D158',
                            }
                          }}
                        />
                      }
                      label="Invert Channel"
                      sx={{ color: '#fff' }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Blue Channel accordion */}
              <Accordion 
                expanded={channelExpanded === 'blue-channel'} 
                onChange={(event, isExpanded) => {
                  // Stop propagation to prevent parent accordion from toggling
                  event.stopPropagation();
                  setChannelExpanded(isExpanded ? 'blue-channel' : false);
                }}
                sx={{ 
                  backgroundColor: 'rgba(10, 132, 255, 0.15)',
                  color: '#fff',
                  borderRadius: '8px',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#0A84FF' }} />}
                  sx={{ borderBottom: `1px solid rgba(10, 132, 255, 0.2)` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography sx={{ color: '#0A84FF', fontWeight: 500 }}>Blue Channel</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Pixel Sort
                      </Typography>
                      <Slider
                        value={effects.blueChannel?.pixelSort?.intensity || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.blueChannel) {
                            newEffects.blueChannel = {};
                          }
                          newEffects.blueChannel.pixelSort = {
                            ...(newEffects.blueChannel.pixelSort || { threshold: 0.5, vertical: false }),
                            intensity: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#0A84FF' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Data Bend
                      </Typography>
                      <Slider
                        value={effects.blueChannel?.dataBend?.amount || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.blueChannel) {
                            newEffects.blueChannel = {};
                          }
                          newEffects.blueChannel.dataBend = {
                            ...(newEffects.blueChannel.dataBend || { chunkSize: 0.5 }),
                            amount: value as number
                          };
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#0A84FF' }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography gutterBottom sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        Noise
                      </Typography>
                      <Slider
                        value={effects.blueChannel?.noise || 0}
                        onChange={(_, value) => {
                          const newEffects = { ...effects };
                          if (!newEffects.blueChannel) {
                            newEffects.blueChannel = {};
                          }
                          newEffects.blueChannel.noise = value as number;
                          onChange(newEffects);
                        }}
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ color: '#0A84FF' }}
                      />
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={Boolean(effects.blueChannel?.invert)}
                          onChange={(e) => {
                            const newEffects = { ...effects };
                            if (!newEffects.blueChannel) {
                              newEffects.blueChannel = {};
                            }
                            newEffects.blueChannel.invert = e.target.checked;
                            onChange(newEffects);
                          }}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#0A84FF',
                              '&:hover': { backgroundColor: `rgba(10, 132, 255, 0.2)` }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#0A84FF',
                            }
                          }}
                        />
                      }
                      label="Invert Channel"
                      sx={{ color: '#fff' }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Paper>
  );
};

export default EffectControls; 