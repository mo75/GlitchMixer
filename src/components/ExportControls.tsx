import React, { useState, useRef } from 'react';
import {
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
  LinearProgress,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import {
  VideoFile as VideoIcon,
  GifBox as GifIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { useGifRecorder } from '../hooks/useGifRecorder';
import { useVideoExport } from '../hooks/useVideoExport';

interface ExportControlsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function ExportControls({ canvasRef }: ExportControlsProps) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'image' | 'gif' | 'video'>('image');
  const [filename, setFilename] = useState(`glitchmixer-${new Date().toISOString().slice(0, 10)}`);
  
  // GIF export settings
  const [gifQuality, setGifQuality] = useState<number>(10);
  const [gifDelay, setGifDelay] = useState<number>(100);
  const [gifFrames, setGifFrames] = useState<number>(30);
  
  // Video export settings
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoFps, setVideoFps] = useState<number>(30);
  
  // For progress display
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  
  // Hooks for recording
  const gifRecorder = useGifRecorder({
    quality: 11 - gifQuality, // Convert 1-10 to 10-1 (lower is better in gif.js)
    delay: gifDelay,
    maxFrames: gifFrames
  });
  
  const videoExporter = useVideoExport({
    bitRate: videoQuality === 'low' ? 1500000 : videoQuality === 'medium' ? 2500000 : 4000000,
    frameRate: videoFps,
    maxDuration: videoDuration
  });

  // Reference to progress check interval
  const progressIntervalRef = useRef<number | null>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleExportTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExportType(event.target.value as 'image' | 'gif' | 'video');
  };

  const handleStartExport = () => {
    if (!canvasRef.current) {
      alert('Canvas not available');
      return;
    }
    
    try {
      // Different export logic based on type
      if (exportType === 'image') {
        // Single image export is straightforward
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
        handleClose();
      } 
      else if (exportType === 'gif') {
        // For GIF, we need to show progress and start capturing frames
        setShowProgressDialog(true);
        handleClose();
        
        gifRecorder.startRecording(canvasRef.current, {
          quality: 11 - gifQuality,
          delay: gifDelay,
          maxFrames: gifFrames
        });
        
        // Setup progress monitoring
        progressIntervalRef.current = window.setInterval(() => {
          if (gifRecorder.isProcessing) {
            // If finished capturing and now processing, show that stage
            if (progressIntervalRef.current) {
              window.clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
          else if (!gifRecorder.isRecording) {
            // If recording finished or failed
            clearProgressInterval();
            setShowProgressDialog(false);
          }
        }, 100);
      }
      else if (exportType === 'video') {
        // For video, we also show progress and start recording
        setShowProgressDialog(true);
        handleClose();
        
        videoExporter.startRecording(canvasRef.current, {
          bitRate: videoQuality === 'low' ? 1500000 : videoQuality === 'medium' ? 2500000 : 4000000,
          frameRate: videoFps,
          maxDuration: videoDuration
        });
        
        // Setup progress monitoring
        progressIntervalRef.current = window.setInterval(() => {
          if (videoExporter.isProcessing) {
            // If processing, keep showing the dialog
          }
          else if (!videoExporter.isRecording) {
            // If recording finished or failed
            clearProgressInterval();
            setShowProgressDialog(false);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error during export. See console for details.');
      clearProgressInterval();
      setShowProgressDialog(false);
    }
  };
  
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  const handleCancelExport = () => {
    if (exportType === 'gif') {
      gifRecorder.cancelRecording();
    } else if (exportType === 'video') {
      videoExporter.cancelRecording();
    }
    
    clearProgressInterval();
    setShowProgressDialog(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpen}
        startIcon={<DownloadIcon />}
      >
        Export
      </Button>
      
      {/* Main Export Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Export Image or Animation
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Export Format</FormLabel>
                <RadioGroup
                  value={exportType}
                  onChange={handleExportTypeChange}
                >
                  <FormControlLabel 
                    value="image" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ImageIcon sx={{ mr: 1 }} />
                        <Typography>PNG Image</Typography>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="gif" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GifIcon sx={{ mr: 1 }} />
                        <Typography>Animated GIF</Typography>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="video" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VideoIcon sx={{ mr: 1 }} />
                        <Typography>Video (WebM)</Typography>
                      </Box>
                    } 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Filename"
                  variant="outlined"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  helperText={`Will be saved as ${filename}.${exportType === 'image' ? 'png' : exportType === 'gif' ? 'gif' : 'webm'}`}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Settings specific to the selected export type */}
              {exportType === 'gif' && (
                <Box>
                  <Typography variant="h6" gutterBottom>GIF Settings</Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography id="gif-quality-slider" gutterBottom>
                      Quality: {gifQuality}
                    </Typography>
                    <Slider
                      value={gifQuality}
                      onChange={(_, value) => setGifQuality(value as number)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      aria-labelledby="gif-quality-slider"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Higher values = better quality, larger file
                    </Typography>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography id="gif-delay-slider" gutterBottom>
                      Frame Delay: {gifDelay}ms
                    </Typography>
                    <Slider
                      value={gifDelay}
                      onChange={(_, value) => setGifDelay(value as number)}
                      min={20}
                      max={500}
                      step={10}
                      aria-labelledby="gif-delay-slider"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Lower values = faster animation
                    </Typography>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography id="gif-frames-slider" gutterBottom>
                      Frame Count: {gifFrames}
                    </Typography>
                    <Slider
                      value={gifFrames}
                      onChange={(_, value) => setGifFrames(value as number)}
                      min={5}
                      max={100}
                      step={5}
                      marks
                      aria-labelledby="gif-frames-slider"
                    />
                    <Typography variant="body2" color="text.secondary">
                      More frames = longer animation, larger file
                    </Typography>
                  </FormControl>
                </Box>
              )}
              
              {exportType === 'video' && (
                <Box>
                  <Typography variant="h6" gutterBottom>Video Settings</Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel id="video-quality-group-label">Quality</FormLabel>
                    <RadioGroup
                      row
                      aria-labelledby="video-quality-group-label"
                      value={videoQuality}
                      onChange={(e) => setVideoQuality(e.target.value as 'low' | 'medium' | 'high')}
                    >
                      <FormControlLabel value="low" control={<Radio />} label="Low" />
                      <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                      <FormControlLabel value="high" control={<Radio />} label="High" />
                    </RadioGroup>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography id="video-duration-slider" gutterBottom>
                      Duration: {videoDuration} seconds
                    </Typography>
                    <Slider
                      value={videoDuration}
                      onChange={(_, value) => setVideoDuration(value as number)}
                      min={1}
                      max={30}
                      step={1}
                      marks
                      aria-labelledby="video-duration-slider"
                    />
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography id="video-fps-slider" gutterBottom>
                      Frame Rate: {videoFps} FPS
                    </Typography>
                    <Slider
                      value={videoFps}
                      onChange={(_, value) => setVideoFps(value as number)}
                      min={10}
                      max={60}
                      step={5}
                      marks
                      aria-labelledby="video-fps-slider"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Higher FPS = smoother video, larger file
                    </Typography>
                  </FormControl>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleStartExport} 
            variant="contained" 
            color="primary"
            startIcon={
              exportType === 'image' ? <ImageIcon /> : 
              exportType === 'gif' ? <GifIcon /> : <VideoIcon />
            }
          >
            Export as {exportType === 'image' ? 'PNG' : exportType === 'gif' ? 'GIF' : 'Video'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Progress Dialog */}
      <Dialog
        open={showProgressDialog}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {exportType === 'gif' 
            ? `Creating GIF ${gifRecorder.isProcessing ? '(Processing)' : '(Recording)'}`
            : `Recording Video ${videoExporter.formattedDuration} / ${videoExporter.maxDuration}s`
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', mt: 2 }}>
            {exportType === 'gif' ? (
              <>
                {gifRecorder.isProcessing ? (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Processing GIF ({Math.round(gifRecorder.progress * 100)}%)
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={gifRecorder.progress * 100} 
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Recording frames ({gifRecorder.frameCount} / {gifFrames})
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(gifRecorder.frameCount / gifFrames) * 100} 
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" gutterBottom>
                  Recording video ({Math.round((videoExporter.duration / videoExporter.maxDuration) * 100)}%)
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(videoExporter.duration / videoExporter.maxDuration) * 100} 
                />
              </>
            )}
            
            {(gifRecorder.error || videoExporter.error) && (
              <Typography color="error" sx={{ mt: 2 }}>
                Error: {gifRecorder.error || videoExporter.error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelExport} color="error">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 