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
- 🎛️ Interactive controls with real-time preview
- 💾 Save glitched images
- 📱 Touch-friendly interface
- 🌙 Dark mode support
- 🎭 Chaotic animation mode for random glitch effects
- 🎬 GIF recording capability
- 🖌️ Advanced resolution and cropping controls
- 🔄 Session persistence for all settings

## Animated GIF Support

GlitchMixer now supports processing animated GIFs:

1. Load any GIF file to automatically detect and process it
2. All frames will be preserved with their original timing
3. Use the play/pause and reset controls to preview the animation
4. Apply any glitch effect to the entire animation
5. Export the processed GIF with effects applied to all frames

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
4. Adjust resolution and cropping as needed
5. Record GIFs of your creations
6. Click the save icon to download your glitched image

## Development

The project uses:
- React with TypeScript for the frontend
- Rust and WebAssembly for image processing
- Vite as the build tool
- Material-UI for the user interface

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Using GIF Functionality

- To process an existing animated GIF:
  1. Load a GIF file
  2. Apply effects as desired
  3. Click the camera button to process and export the GIF with all frames

- To create a GIF from a static image:
  1. Load a static image
  2. Enable animation and adjust settings
  3. Click the camera button to record a 5-second animation

## Chaotic Animation Mode

Enable chaotic mode to create unpredictable, random glitch animations:
1. Toggle on Animation
2. Enable the "Chaotic Mode" switch
3. Adjust intensity to control the level of randomness

## Technologies Used

- React with TypeScript
- MUI for UI components
- gif.js for GIF encoding
- gifuct-js for GIF parsing
- Web Audio API for audio-reactive effects

## License

MIT 