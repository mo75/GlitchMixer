import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';

interface ImageUploadProps {
  onImageChange: (imageDataUrl: string) => void;
  isLoading?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageChange, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        setUploadError('Please upload an image file (PNG, JPG, GIF, etc.)');
      }
    }
  }, [onImageChange]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = event.target.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  }, [onImageChange]);

  const processImageFile = (file: File) => {
    console.log("ImageUpload: Processing file:", file.name, file.type, file.size);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        console.log("ImageUpload: File loaded successfully, data URL length:", e.target.result.length);
        onImageChange(e.target.result);
      }
    };
    
    reader.onerror = (error) => {
      console.error("ImageUpload: Error reading file:", error);
      setUploadError('Failed to read the image file. Please try another image.');
    };
    
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 2,
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.1)' : undefined,
        border: isDragging ? '2px dashed #1976d2' : '2px dashed rgba(255, 255, 255, 0.2)',
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.3)'
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      {isLoading ? (
        <CircularProgress size={60} />
      ) : (
        <>
          <InsertPhotoIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drop your image here
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Supports PNG, JPG, GIF, and other image formats
          </Typography>
          
          {uploadError && (
            <Typography variant="body2" color="error" align="center" sx={{ mb: 2 }}>
              {uploadError}
            </Typography>
          )}
          
          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
          >
            Select Image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </>
      )}
    </Paper>
  );
};

export default ImageUpload; 