import { Button, Grid, Typography, Box } from '@mui/material';
import { ShaderOptions } from '../hooks/useShaderEffect';

// Import the SHADER_PRESETS_EXAMPLES from App.tsx
// This component's props will receive the presets and the function to apply them
interface ShaderPresetsProps {
  presets: Record<string, ShaderOptions>;
  onApplyPreset: (presetName: string) => void;
}

const ShaderPresets = ({ presets, onApplyPreset }: ShaderPresetsProps) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Shader Presets
      </Typography>
      <Grid container spacing={1}>
        {Object.keys(presets).map((presetName) => (
          <Grid item key={presetName}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => onApplyPreset(presetName)}
              sx={{ 
                textTransform: 'capitalize',
                backgroundColor: (theme) => theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                }
              }}
            >
              {presetName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ShaderPresets; 