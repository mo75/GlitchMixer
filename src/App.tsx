import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  useTheme,
  Stack,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ImageEditor from './components/ImageEditor';

// Import test image from public assets
const testImage = '/assets/images/test-image.jpeg';
const sampleGif = '/sample.gif';
const pixelGif = '/pixel.gif';

const App: React.FC = () => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load previous image or test image on mount
  useEffect(() => {
    // First check if we have a previously selected image in localStorage
    const savedImage = localStorage.getItem('glitchMixer_lastImage');
    
    if (savedImage) {
      console.log("App: Found previously selected image in localStorage");
      
      // For data URLs, we can use them directly
      if (savedImage.startsWith('data:')) {
        setSelectedImage(savedImage);
        setImageLoaded(true);
        return;
      }
      
      // For URLs, let's verify they still exist
      const img = new Image();
      img.onload = () => {
        console.log("App: Previously selected image loaded successfully");
        setSelectedImage(savedImage);
        setImageLoaded(true);
      };
      img.onerror = () => {
        console.warn("App: Previously selected image failed to load, falling back to test image");
        loadTestImage();
      };
      img.src = `${savedImage}?nocache=${Date.now()}`;
    } else {
      console.log("App: No saved image found, loading test image");
      loadTestImage();
    }
  }, []);
  
  // Helper function to load the test image
  const loadTestImage = () => {
    console.log("App: Loading test image");
    
    // Pre-load the test image to verify it exists
    const img = new Image();
    img.onload = () => {
      console.log("Test image loaded successfully");
      setSelectedImage(testImage);
      setImageLoaded(true);
    };
    img.onerror = (err) => {
      console.error("Failed to load test image:", err);
      // Try with an absolute path
      const absolutePath = new URL('/assets/images/test-image.jpeg', window.location.origin).href;
      console.log("Trying absolute path:", absolutePath);
      setSelectedImage(absolutePath);
    };
    img.src = testImage;
  };

  // Update localStorage whenever selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      try {
        localStorage.setItem('glitchMixer_lastImage', selectedImage);
        console.log("App: Saved current image to localStorage");
      } catch (err) {
        console.error("App: Error saving image to localStorage:", err);
        // If the image is too large (data URL), we can skip saving it
      }
    }
  }, [selectedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("App: User uploaded file:", file.name, "type:", file.type);
      
      // Reset current image completely before loading new one
      setSelectedImage(null);
      setImageLoaded(false);
      
      // GIF-specific handling with additional checks
      if (file.type === 'image/gif') {
        console.log("App: Detected GIF upload, special handling...");
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log("App: File read as data URL, type:", dataUrl.substring(0, 50) + "...");
        
        // Longer delay for more reliable loading
        setTimeout(() => {
          setSelectedImage(dataUrl);
          setImageLoaded(true);
          console.log("App: New image set from upload");
        }, 300);
      };
      
      reader.onerror = (err) => {
        console.error("App: Error reading file:", err);
        alert("Failed to load the selected file. Please try another image.");
      };
      
      // Start the read operation
      reader.readAsDataURL(file);
    }
  };

  const loadSampleGif = (gifUrl: string) => {
    console.log("App: Loading sample GIF:", gifUrl);
    
    // First check if the GIF exists before setting it
    const img = new Image();
    img.onload = () => {
      console.log("App: Sample GIF verified and exists:", gifUrl);
      
      // Completely reset the state before setting new image
      setSelectedImage(null);
      setImageLoaded(false);
      
      // Wait for state to reset, then load the new image
      setTimeout(() => {
        setSelectedImage(gifUrl);
        setImageLoaded(true);
      }, 200); // Use a longer delay to ensure clean state
    };
    
    img.onerror = (err) => {
      console.error("App: Error loading sample GIF:", err);
      alert(`Failed to load sample GIF at ${gifUrl}. The file might not exist.`);
    };
    
    // Force nocache for more reliable loading
    img.src = `${gifUrl}?nocache=${Date.now()}`;
  };

  // Add a component unload effect to clean up any lingering resources
  useEffect(() => {
    return () => {
      console.log("App: Cleaning up resources on unmount");
      // Clear any timers, etc.
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)'
          : 'linear-gradient(135deg, #f2f2f7 0%, #e5e5ea 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0A84FF 0%, #30D158 50%, #FF453A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textAlign: 'center',
            }}
          >
            GlitchMixer
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(28, 28, 30, 0.8)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<AddPhotoAlternateIcon />}
                  fullWidth
                  sx={{
                    height: 56,
                    backgroundColor: '#0A84FF',
                    '&:hover': {
                      backgroundColor: '#0071e3',
                    },
                  }}
                >
                  Upload Image/GIF
                  <input
                    type="file"
                    hidden
                    accept="image/*,.gif"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => loadSampleGif(sampleGif)}
                  sx={{
                    height: 56,
                    color: '#30D158',
                    borderColor: '#30D158',
                    '&:hover': {
                      borderColor: '#25a647',
                      backgroundColor: 'rgba(48, 209, 88, 0.1)',
                    },
                  }}
                >
                  Sample GIF 1
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => loadSampleGif(pixelGif)}
                  sx={{
                    height: 56,
                    color: '#FF453A',
                    borderColor: '#FF453A',
                    '&:hover': {
                      borderColor: '#d6372f',
                      backgroundColor: 'rgba(255, 69, 58, 0.1)',
                    },
                  }}
                >
                  Sample GIF 2
                </Button>
              </Box>
            </Paper>

            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(28, 28, 30, 0.8)',
                backdropFilter: 'blur(10px)',
                flex: 1,
                minHeight: 500,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {selectedImage ? (
                <ImageEditor imageUrl={selectedImage} />
              ) : (
                <Box sx={{ textAlign: 'center', color: '#fff' }}>
                  <Typography variant="h6" gutterBottom>
                    No Image Selected
                  </Typography>
                  <Typography variant="body2">
                    Please upload an image or wait for the test image to load.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default App; 