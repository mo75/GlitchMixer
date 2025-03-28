import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Save as SaveIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { EffectPreset, useEffectPresets } from '../hooks/useEffectPresets';
import { GlitchOptions } from '../hooks/useGlitchEffect';
import { ShaderOptions } from '../hooks/useShaderEffect';

interface PresetManagerProps {
  currentGlitchOptions: GlitchOptions;
  currentShaderOptions?: ShaderOptions;
  onPresetApply: (glitchOptions: GlitchOptions, shaderOptions?: ShaderOptions) => void;
}

export default function PresetManager({
  currentGlitchOptions,
  currentShaderOptions,
  onPresetApply
}: PresetManagerProps) {
  const {
    presets,
    currentPreset,
    applyPreset,
    saveAsPreset,
    updatePreset,
    deletePreset,
    toggleFavorite,
    exportPresets,
    importPresets,
    resetToDefaults
  } = useEffectPresets();
  
  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Form states
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetTags, setPresetTags] = useState<string>('');
  const [currentTag, setCurrentTag] = useState('');
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
  
  // For file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For dropdown menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, presetId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPresetId(presetId);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPresetId(null);
  };
  
  const handleSaveDialogOpen = () => {
    setSaveDialogOpen(true);
    setPresetName('');
    setPresetDescription('');
    setPresetTags('');
    setCurrentTag('');
  };
  
  const handleSaveDialogClose = () => {
    setSaveDialogOpen(false);
  };
  
  const handleSavePreset = () => {
    if (!presetName) return;
    
    const tagArray = presetTags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    saveAsPreset(
      presetName,
      presetDescription,
      currentGlitchOptions,
      currentShaderOptions,
      tagArray
    );
    
    setSaveDialogOpen(false);
  };
  
  const handleDeleteDialogOpen = (presetId: string) => {
    setPresetToDelete(presetId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setPresetToDelete(null);
  };
  
  const handleConfirmDelete = () => {
    if (presetToDelete) {
      deletePreset(presetToDelete);
      setDeleteDialogOpen(false);
      setPresetToDelete(null);
    }
  };
  
  const handleApplyPreset = (presetId: string) => {
    const preset = applyPreset(presetId);
    
    if (preset) {
      onPresetApply(preset.glitchOptions, preset.shaderOptions);
    }
  };
  
  const handleAddTag = () => {
    if (currentTag) {
      setPresetTags(prev => {
        const tags = prev ? `${prev}, ${currentTag}` : currentTag;
        return tags;
      });
      setCurrentTag('');
    }
  };
  
  const handleFavoriteToggle = (presetId: string) => {
    toggleFavorite(presetId);
    handleMenuClose();
  };
  
  const handleExportPresets = () => {
    exportPresets();
    handleMenuClose();
  };
  
  const handleImportDialogOpen = () => {
    setImportDialogOpen(true);
    handleMenuClose();
  };
  
  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
  };
  
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importPresets(content);
      
      if (success) {
        setImportDialogOpen(false);
      } else {
        alert('Error importing presets. Check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const handleResetDialogOpen = () => {
    setResetDialogOpen(true);
    handleMenuClose();
  };
  
  const handleResetDialogClose = () => {
    setResetDialogOpen(false);
  };
  
  const handleConfirmReset = () => {
    resetToDefaults();
    setResetDialogOpen(false);
  };
  
  // Format date from ISO string to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Group presets by favorites and others
  const favoritePresets = presets.filter(preset => preset.isFavorite);
  const otherPresets = presets.filter(preset => !preset.isFavorite);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Effect Presets</Typography>
        <Box>
          <Tooltip title="Save current settings as preset">
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              size="small"
              onClick={handleSaveDialogOpen}
            >
              Save Preset
            </Button>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Display current preset if one is selected */}
      {currentPreset && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Current: {currentPreset.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentPreset.description}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {currentPreset.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
          </Box>
        </Paper>
      )}
      
      {/* Preset list */}
      <Paper sx={{ mb: 2 }}>
        <List sx={{ bgcolor: 'background.paper' }}>
          {/* Favorites section */}
          {favoritePresets.length > 0 && (
            <>
              <ListItem>
                <ListItemText primary="Favorites" />
              </ListItem>
              <Divider />
              
              {favoritePresets.map((preset) => (
                <ListItem
                  key={preset.id}
                  disablePadding
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="preset options" 
                      onClick={(e) => handleMenuOpen(e, preset.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleApplyPreset(preset.id)}>
                    <ListItemAvatar>
                      <StarIcon color="warning" />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={preset.name} 
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {preset.description}
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {preset.tags.slice(0, 3).map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                            {preset.tags.length > 3 && (
                              <Chip label={`+${preset.tags.length - 3}`} size="small" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              
              <Divider />
            </>
          )}
          
          {/* Other presets section */}
          {otherPresets.length > 0 && (
            <>
              <ListItem>
                <ListItemText primary="Other Presets" />
              </ListItem>
              <Divider />
              
              {otherPresets.map((preset) => (
                <ListItem
                  key={preset.id}
                  disablePadding
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="preset options" 
                      onClick={(e) => handleMenuOpen(e, preset.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleApplyPreset(preset.id)}>
                    <ListItemAvatar>
                      <FolderIcon color="primary" />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={preset.name} 
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {preset.description}
                          </Typography>
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {preset.tags.slice(0, 3).map((tag, index) => (
                              <Chip key={index} label={tag} size="small" />
                            ))}
                            {preset.tags.length > 3 && (
                              <Chip label={`+${preset.tags.length - 3}`} size="small" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </>
          )}
          
          {/* No presets message */}
          {presets.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No presets found" 
                secondary="Save your current settings as a preset to start building your collection."
              />
            </ListItem>
          )}
        </List>
        
        {/* Actions footer */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            startIcon={<FileUploadIcon />} 
            size="small"
            onClick={handleImportDialogOpen}
          >
            Import
          </Button>
          <Button 
            startIcon={<FileDownloadIcon />} 
            size="small"
            onClick={handleExportPresets}
          >
            Export
          </Button>
          <Button 
            startIcon={<ResetIcon />} 
            size="small"
            color="warning"
            onClick={handleResetDialogOpen}
          >
            Reset
          </Button>
        </Box>
      </Paper>
      
      {/* Preset options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedPresetId && handleFavoriteToggle(selectedPresetId)}>
          {
            presets.find(p => p.id === selectedPresetId)?.isFavorite ? (
              <>
                <StarBorderIcon fontSize="small" sx={{ mr: 1 }} />
                Remove from Favorites
              </>
            ) : (
              <>
                <StarIcon fontSize="small" sx={{ mr: 1 }} />
                Add to Favorites
              </>
            )
          }
        </MenuItem>
        <MenuItem onClick={() => selectedPresetId && handleDeleteDialogOpen(selectedPresetId)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Save Preset Dialog */}
      <Dialog 
        open={saveDialogOpen} 
        onClose={handleSaveDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save as Preset</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <TextField
              label="Preset Name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 1 }}>
            <TextField
              label="Description"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              rows={2}
              variant="outlined"
            />
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 1 }}>
            <TextField
              label="Add Tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleAddTag} edge="end">
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              fullWidth
              margin="normal"
              variant="outlined"
              helperText="Press Enter or click + to add a tag"
            />
          </FormControl>
          
          {presetTags && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {presetTags.split(',').map((tag, index) => (
                <Chip key={index} label={tag.trim()} />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSavePreset} 
            variant="contained" 
            color="primary"
            disabled={!presetName}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Preset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this preset? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Import Presets Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
      >
        <DialogTitle>Import Presets</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a JSON file containing presets to import.
          </DialogContentText>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleFileUploadClick}
            >
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleImportDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={handleResetDialogClose}
      >
        <DialogTitle>Reset Presets</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reset all presets to their default values. Any custom presets will be lost.
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmReset} color="error">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 