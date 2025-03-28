# GlitchMixer

A modern web application for real-time image glitching and corruption using WebAssembly. Create unique digital art by manipulating images with various glitch effects.

## Features

- 🖼️ Real-time image manipulation with WebAssembly
- 🎨 Multiple glitch effects:
  - Pixel Sorting
  - Data Bending
  - Channel Shifting
  - Noise Addition
  - Color Quantization
  - Channel Inversion
- 🧬 Advanced File Corruption:
  - Direct Byte Manipulation
  - Chunk Swapping
  - Binary XOR Patterns
  - Image Contamination/Blending
- 🎮 WebGL Shader Effects:
  - Multiple Shader Layers
  - Drag and Drop Ordering
  - Layer Controls
  - RGB Shift
  - Wave Distortion
  - Digital Noise
  - Pixelation
  - VHS Distortion
  - Custom Shader Support
- 🎬 Multiple Export Options:
  - PNG Images
  - Animated GIFs
  - Video Export (WebM)
- 💾 Save and Load Effect Presets
- 🎛️ Interactive controls with real-time preview
- 💾 Save glitched images
- 📱 Touch-friendly interface
- 🌙 Dark mode support
- 🎭 Chaotic animation mode for random glitch effects
- 🎬 GIF and video recording capability
- 🖌️ Advanced resolution and cropping controls
- 🔄 Session persistence for all settings

## Animated GIF Support

GlitchMixer now supports processing animated GIFs:

1. Load any GIF file to automatically detect and process it
2. All frames will be preserved with their original timing
3. Use the play/pause and reset controls to preview the animation
4. Apply any glitch effect to the entire animation
5. Export the processed GIF with effects applied to all frames

## Advanced File Corruption

GlitchMixer offers powerful file corruption tools:

- **Byte Corruption**: Manipulate individual bytes in the image data with random bytes, bit flips, zeroing, or maxing out. Create structured corruption patterns or random glitches.
- **Chunk Swap**: Rearrange blocks of the image by swapping chunks of data with each other.
- **Binary XOR**: Apply XOR patterns to create intricate digital artifacts. Choose from full image XOR, horizontal bands, vertical bands, or block patterns.
- **Image Contamination**: Blend multiple images together using various blending modes (mix, difference, multiply, screen, overlay) to create unique corrupted visuals.

## WebGL Shader Effects

GlitchMixer now supports multiple WebGL shader layers that can be stacked for complex visual effects:

- **Multiple Layer Support**: Stack shader effects like RGB shift, wave distortion, pixelation, and more
- **Layer Controls**: Each layer has independent controls for intensity and opacity
- **Built-in Presets**: Try out pre-configured multi-layer shader effects
- **Real-time Blending**: See how the combined effects transform your image in real-time

### Example Shader Combinations

- **Psychedelic**: Combines hue rotation with RGB shift for trippy color effects
- **Retro**: Uses pixelation and VHS glitch for a nostalgic look
- **Glitch Art**: Layers digital noise, wave distortion, and RGB shift for a heavily corrupted aesthetic

### Tips for Using Shader Layers

- Experiment with layer opacity to create subtle blends between effects
- Try different layer orderings for dramatically different results
- Apply shader effects after using the pixel-based glitch effects for maximum impact

## Export Options

GlitchMixer offers multiple ways to save your creations:

- **PNG Images**: Export a static snapshot of your current creation
- **Animated GIFs**: Create looping animations with:
  - Adjustable quality (1-10)
  - Custom frame delay (20ms-500ms)
  - Frame count control (5-100 frames)
- **Video Export**: Record WebM videos with:
  - Multiple quality presets (low, medium, high)
  - Custom duration (1-30 seconds)
  - Framerate control (10-60 FPS)

## Preset System

Save and manage your favorite effect combinations:

- **Save Presets**: Store your current effects with names, descriptions, and tags
- **Apply Presets**: Quickly switch between different effect combinations
- **Organization**: Mark presets as favorites for easy access
- **Import/Export**: Share presets as JSON files or back up your collection
- **Default Presets**: Includes several starting points for common glitch styles

## Resolution & Cropping Controls

GlitchMixer offers comprehensive resolution control:

- Various preset resolutions (480p to 4K)
- Square formats (256×256 to 1024×1024)
- Social media optimized sizes (Instagram, Twitter, Facebook)
- Print formats (A4, A5)
- Custom dimensions with aspect ratio lock

Three cropping modes are available:
- Fill (stretch to fit)
- Fit (letterbox/pillarbox)
- Crop (with position control: center, top, bottom, left, right)

## Prerequisites

- Node.js (v16 or higher)
- Rust (for WebAssembly compilation)
- wasm-pack (will be installed automatically)

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/mo75/GlitchMixer.git
cd GlitchMixer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another available port)

## Manual Setup

If you prefer to set up manually:

1. Install wasm-pack:
```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

2. Build the WebAssembly module:
```bash
cd glitch-wasm
wasm-pack build --target web
cd ..
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Upload an image using the "Upload Image" button or drag and drop
2. Use the sliders to adjust the glitch effects:
   - **Pixel Sort**: Sorts pixels based on brightness
   - **Data Bend**: Randomly shifts pixel data
   - **Channel Shift**: Offsets color channels
   - **Noise**: Adds random pixel noise
   - **Quantize**: Reduces color palette
   - **Invert**: Inverts specific color channels
3. Enable animation to create dynamic effects
4. Experiment with file corruption tools:
   - **Byte Corruption**: Manipulate raw bytes in the image
   - **Chunk Swap**: Rearrange blocks of image data
   - **Binary XOR**: Create XOR patterns and digital artifacts
   - **Image Contamination**: Blend/contaminate with another image
5. Apply WebGL shader effects for additional visual treatments
6. Adjust resolution and cropping as needed
7. Save and load presets to reuse your favorite effects
8. Export your creation as an image, GIF, or video

## Writing Custom Shaders

1. In the WebGL Shader Layers panel, click "Add Shader Layer" to create a new shader layer
2. Click the Edit button for the layer you want to customize
3. Select "Custom Shader..." from the dropdown and click the Edit button
4. Write your GLSL fragment shader in the editor
5. Use the available uniforms to access:
   - The input image (`u_image`)
   - Animation time (`u_time`)
   - Effect intensity (`u_intensity`)
   - Layer opacity (`u_opacity`)
   - Image dimensions (`u_resolution`)
6. Click "Apply Shader" to see your custom effect
7. Add multiple shader layers and reorder them to create complex combinations
8. Use the layer opacity slider to blend between different shader effects

## Using the Preset System

- **Save a Preset**: Click "Save Preset" and provide a name, description, and optional tags
- **Apply a Preset**: Click on any preset in the list to apply its effects
- **Organize**: Toggle favorites by clicking the star icon in the preset menu
- **Import/Export**: Use the buttons at the bottom of the preset panel to share or backup

## Development

The project uses:
- React with TypeScript for the frontend
- Rust and WebAssembly for image processing
- Vite as the build tool
- Material-UI for the user interface
- WebGL for shader effects
- MediaRecorder API for video export

### Project Structure

```
GlitchMixer/
├── src/                  # React application source
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   └── types.d.ts        # TypeScript declarations
├── glitch-wasm/          # Rust WebAssembly source
│   ├── src/              # Rust source code
│   └── Cargo.toml        # Rust dependencies
└── public/               # Static assets
```

## Technologies Used

- React with TypeScript
- MUI for UI components
- gif.js for GIF encoding
- gifuct-js for GIF parsing
- Web Audio API for audio-reactive effects
- WebAssembly (Rust) for high-performance image processing
- WebGL for real-time shader effects
- MediaRecorder API for video recording

## License

MIT 