import { useState, useEffect, useRef, useCallback } from 'react';

// Default vertex shader - just passes coordinates
const DEFAULT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

// Default fragment shader - basic passthrough
const DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform float u_time;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

// Collection of predefined fragment shaders
export const SHADER_PRESETS = {
  none: DEFAULT_FRAGMENT_SHADER,
  
  // Simple hue rotation - very reliable
  hueRotate: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    varying vec2 v_texCoord;
    
    // Function to convert RGB to HSV
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    // Function to convert HSV to RGB
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      // Get the original pixel
      vec4 texColor = texture2D(u_image, v_texCoord);
      
      // Convert to HSV
      vec3 hsv = rgb2hsv(texColor.rgb);
      
      // Rotate the hue based on time and intensity
      hsv.x = fract(hsv.x + u_time * u_intensity * 0.2);
      
      // Convert back to RGB
      vec3 rgb = hsv2rgb(hsv);
      
      // Output the color
      gl_FragColor = vec4(rgb, texColor.a);
    }
  `,
  
  // RGB shift glitch effect
  rgbShift: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    varying vec2 v_texCoord;
    
    void main() {
      float amount = u_intensity * 0.01;
      
      // Dynamic shift based on time
      vec2 shift = amount * vec2(cos(u_time * 2.0), sin(u_time * 2.0));
      
      // Sample the texture with different offsets for each channel
      float r = texture2D(u_image, v_texCoord + shift).r;
      float g = texture2D(u_image, v_texCoord).g;
      float b = texture2D(u_image, v_texCoord - shift).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
  
  // Wave distortion effect
  wave: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    varying vec2 v_texCoord;
    
    void main() {
      float amount = u_intensity * 0.05;
      
      // Calculate wave distortion
      vec2 distortedCoord = v_texCoord;
      distortedCoord.x += sin(v_texCoord.y * 10.0 + u_time) * amount;
      distortedCoord.y += cos(v_texCoord.x * 10.0 + u_time) * amount;
      
      gl_FragColor = texture2D(u_image, distortedCoord);
    }
  `,
  
  // Digital noise pattern
  digitalNoise: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    varying vec2 v_texCoord;
    
    // Pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec4 color = texture2D(u_image, v_texCoord);
      
      // Create noise effect
      float noise = random(v_texCoord + u_time) * u_intensity;
      
      // Apply noise with varying intensity to each channel
      color.r += noise * 0.3;
      color.g += noise * 0.2;
      color.b += noise * 0.4;
      
      gl_FragColor = color;
    }
  `,
  
  // Pixelation effect
  pixelate: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    uniform vec2 u_resolution;
    
    varying vec2 v_texCoord;
    
    void main() {
      float pixelSize = max(4.0, u_intensity * 50.0);
      
      // Calculate pixelated coordinates
      vec2 pixels = u_resolution / pixelSize;
      vec2 pixelCoord = floor(v_texCoord * pixels) / pixels;
      
      gl_FragColor = texture2D(u_image, pixelCoord);
    }
  `,
  
  // VHS tape distortion
  vhsGlitch: `
    precision mediump float;
    
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    
    varying vec2 v_texCoord;
    
    // Pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      // Create VHS-like distortion
      float intensity = u_intensity * 0.05;
      
      // Calculate scan line
      float scanLine = floor(v_texCoord.y * 100.0) * 0.01;
      
      // Create horizontal displacement
      float noise = random(vec2(scanLine, u_time * 0.1));
      float shift = (noise - 0.5) * intensity;
      
      // Apply tracking lines and color bleeding
      vec2 distortedCoord = v_texCoord;
      distortedCoord.x += shift;
      
      // Color bleed effect
      vec4 baseColor = texture2D(u_image, distortedCoord);
      vec4 shiftedColorR = texture2D(u_image, distortedCoord + vec2(intensity * 0.01, 0.0));
      vec4 shiftedColorB = texture2D(u_image, distortedCoord - vec2(intensity * 0.01, 0.0));
      
      // Apply scan lines with time-based jitter
      float scanLineIntensity = 0.9 + 0.1 * noise;
      if (mod(scanLine * 100.0 + u_time, 2.0) < 1.0) {
        scanLineIntensity *= 0.9;
      }
      
      // Combine all effects
      vec4 finalColor = vec4(
        baseColor.r * 0.8 + shiftedColorR.r * 0.2,
        baseColor.g,
        baseColor.b * 0.8 + shiftedColorB.b * 0.2,
        baseColor.a
      ) * scanLineIntensity;
      
      gl_FragColor = finalColor;
    }
  `
};

interface ShaderUniforms {
  [key: string]: number | number[] | Float32Array;
}

export interface ShaderLayer {
  fragmentShader: string;
  uniforms: ShaderUniforms;
  intensity: number;
  enabled: boolean;
  customCode?: string;
  name?: string; // Optional name for the shader layer
  opacity?: number; // Blend opacity with previous layer
}

export interface ShaderOptions {
  layers: ShaderLayer[]; // Array of shader layers
  enabled: boolean;
}

export const useShaderEffect = () => {
  const [options, setOptions] = useState<ShaderOptions>({
    layers: [{
      fragmentShader: SHADER_PRESETS.none,
      uniforms: {},
      intensity: 0.5,
      enabled: true,
      customCode: '',
      opacity: 1.0
    }],
    enabled: false
  });
  
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programsRef = useRef<Map<string, WebGLProgram>>(new Map());
  const timeRef = useRef<number>(0);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Ensure we have a temporary canvas for multi-pass rendering
  useEffect(() => {
    // Create a temporary canvas for multi-pass rendering if it doesn't exist
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
    }
    
    return () => {
      // Cleanup
      tempCanvasRef.current = null;
    };
  }, []);
  
  // Create shader program with current shaders
  const createShaderProgram = useCallback((fragmentShaderSource: string) => {
    const gl = glRef.current;
    if (!gl) return null;
    
    // Check if we already have this program compiled
    const hash = hashString(fragmentShaderSource);
    if (programsRef.current.has(hash)) {
      return programsRef.current.get(hash) || null;
    }
    
    try {
      // Compile vertex shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) throw new Error('Failed to create vertex shader');
      
      gl.shaderSource(vertexShader, DEFAULT_VERTEX_SHADER);
      gl.compileShader(vertexShader);
      
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(`Vertex shader compilation error: ${gl.getShaderInfoLog(vertexShader)}`);
      }
      
      // Compile fragment shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) throw new Error('Failed to create fragment shader');
      
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(`Fragment shader compilation error: ${gl.getShaderInfoLog(fragmentShader)}`);
      }
      
      // Create and link program
      const program = gl.createProgram();
      if (!program) throw new Error('Failed to create shader program');
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Shader program linking error: ${gl.getProgramInfoLog(program)}`);
      }
      
      // Store the program for reuse
      programsRef.current.set(hash, program);
      return program;
    } catch (err) {
      console.error('Shader program creation error:', err);
      return null;
    }
  }, []);
  
  // Simple hash function for shader source code
  const hashString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  };
  
  // Initialize WebGL context
  const initWebGL = useCallback((canvas: HTMLCanvasElement) => {
    console.log("Initializing WebGL context");
    
    try {
      // Try to get WebGL context
      const gl = canvas.getContext('webgl', {
        preserveDrawingBuffer: true
      }) || canvas.getContext('experimental-webgl', {
        preserveDrawingBuffer: true
      });
      
      if (!gl) {
        console.error("WebGL not supported");
        return false;
      }
      
      console.log("WebGL context created successfully");
      glRef.current = gl as WebGLRenderingContext;
      
      // Pre-compile all shader programs
      options.layers.forEach(layer => {
        const shaderSource = layer.customCode && layer.customCode.length > 0 
          ? layer.customCode 
          : layer.fragmentShader;
        createShaderProgram(shaderSource);
      });
      
      return true;
    } catch (err) {
      console.error("Error initializing WebGL:", err);
      return false;
    }
  }, [options.layers, createShaderProgram]);
  
  // Apply a single shader effect
  const applySingleShader = useCallback((
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    layer: ShaderLayer,
    uniforms: ShaderUniforms = {}
  ): boolean => {
    const gl = glRef.current;
    if (!gl) return false;
    
    // Use custom code if provided, otherwise use the fragment shader
    const shaderSource = layer.customCode && layer.customCode.length > 0
      ? layer.customCode
      : layer.fragmentShader;
      
    const program = createShaderProgram(shaderSource);
    if (!program) return false;
    
    try {
      // Ensure same size on target canvas
      targetCanvas.width = sourceCanvas.width;
      targetCanvas.height = sourceCanvas.height;
      
      // Setup viewport
      gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
      
      // Clear canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Use the program
      gl.useProgram(program);
      
      // Setup position attribute
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Setup texture coordinate attribute
      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([
        0, 1,  // Bottom left (corrected coordinates for WebGL)
        1, 1,  // Bottom right 
        0, 0,  // Top left
        1, 0   // Top right
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      
      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Create and bind texture from source canvas
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      // Set texture parameters
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      // Upload the image into the texture
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
      
      // Set the texture unit
      gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
      
      // Set time uniform
      const currentTime = performance.now() * 0.001; // Convert to seconds
      timeRef.current = currentTime;
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), currentTime);
      
      // Set intensity uniform
      gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), layer.intensity);
      
      // Set opacity uniform if the shader supports it
      const opacityLocation = gl.getUniformLocation(program, 'u_opacity');
      if (opacityLocation) {
        gl.uniform1f(opacityLocation, layer.opacity || 1.0);
      }
      
      // Set resolution uniform
      gl.uniform2f(
        gl.getUniformLocation(program, 'u_resolution'),
        sourceCanvas.width,
        sourceCanvas.height
      );
      
      // Set custom uniforms
      const combinedUniforms = { ...layer.uniforms, ...uniforms };
      Object.entries(combinedUniforms).forEach(([name, value]) => {
        const location = gl.getUniformLocation(program, name);
        if (location) {
          if (Array.isArray(value) || value instanceof Float32Array) {
            switch (value.length) {
              case 2:
                gl.uniform2fv(location, value);
                break;
              case 3:
                gl.uniform3fv(location, value);
                break;
              case 4:
                gl.uniform4fv(location, value);
                break;
              default:
                gl.uniform1fv(location, value);
            }
          } else {
            gl.uniform1f(location, value);
          }
        }
      });
      
      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      return true;
    } catch (err) {
      console.error('Error applying shader:', err);
      return false;
    }
  }, [createShaderProgram]);
  
  // Apply all shader layers
  const applyShader = useCallback((
    sourceCanvas: HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    uniforms: ShaderUniforms = {}
  ) => {
    if (!options.enabled || options.layers.length === 0) return false;
    
    // Get enabled layers
    const enabledLayers = options.layers.filter(layer => layer.enabled);
    if (enabledLayers.length === 0) return false;
    
    const gl = glRef.current;
    
    if (!gl) {
      const initiated = initWebGL(targetCanvas);
      if (!initiated) return false;
    }
    
    if (!gl) return false; // Double-check after init
    
    try {
      console.log(`Applying ${enabledLayers.length} shader layers`);
      
      // If we don't have a temp canvas yet, create one
      if (!tempCanvasRef.current) {
        tempCanvasRef.current = document.createElement('canvas');
      }
      
      const tempCanvas = tempCanvasRef.current;
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;
      
      // Draw the source canvas to temp canvas as starting point
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return false;
      
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(sourceCanvas, 0, 0);
      
      // Track if we need to ping-pong between canvases
      let currentSourceCanvas = tempCanvas;
      let currentTargetCanvas = targetCanvas;
      
      // Apply each shader layer in sequence
      for (let i = 0; i < enabledLayers.length; i++) {
        const layer = enabledLayers[i];
        const isLastLayer = i === enabledLayers.length - 1;
        
        // For intermediate layers, we need to render to the temp canvas
        if (!isLastLayer) {
          // Swap source and target for ping-pong rendering
          const tempTargetCanvas = document.createElement('canvas');
          tempTargetCanvas.width = sourceCanvas.width;
          tempTargetCanvas.height = sourceCanvas.height;
          
          // Apply the shader
          const success = applySingleShader(
            currentSourceCanvas,
            tempTargetCanvas,
            layer,
            uniforms
          );
          
          if (!success) continue;
          
          // Update the source for the next pass
          currentSourceCanvas = tempTargetCanvas;
        } else {
          // Last layer renders directly to the target canvas
          applySingleShader(
            currentSourceCanvas,
            targetCanvas,
            layer,
            uniforms
          );
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error applying multi-layer shaders:', err);
      return false;
    }
  }, [options, initWebGL, applySingleShader]);
  
  // Add a shader layer
  const addShaderLayer = useCallback((layer: Partial<ShaderLayer> = {}) => {
    setOptions(prev => {
      const newLayer: ShaderLayer = {
        fragmentShader: layer.fragmentShader || SHADER_PRESETS.none,
        uniforms: layer.uniforms || {},
        intensity: layer.intensity ?? 0.5,
        enabled: layer.enabled ?? true,
        customCode: layer.customCode || '',
        name: layer.name || `Layer ${prev.layers.length + 1}`,
        opacity: layer.opacity ?? 1.0
      };
      
      return {
        ...prev,
        layers: [...prev.layers, newLayer]
      };
    });
  }, []);
  
  // Remove a shader layer
  const removeShaderLayer = useCallback((index: number) => {
    setOptions(prev => {
      // Don't remove the last layer
      if (prev.layers.length <= 1) return prev;
      
      const updatedLayers = [...prev.layers];
      updatedLayers.splice(index, 1);
      
      return {
        ...prev,
        layers: updatedLayers
      };
    });
  }, []);
  
  // Update a specific shader layer
  const updateShaderLayer = useCallback((index: number, updates: Partial<ShaderLayer>) => {
    setOptions(prev => {
      if (index < 0 || index >= prev.layers.length) return prev;
      
      const updatedLayers = [...prev.layers];
      const currentLayer = updatedLayers[index];
      
      // If fragment shader or custom code changed, make sure to compile it
      if ((updates.fragmentShader && updates.fragmentShader !== currentLayer.fragmentShader) ||
          (updates.customCode && updates.customCode !== currentLayer.customCode)) {
        const newShaderSource = updates.customCode && updates.customCode.length > 0
          ? updates.customCode
          : updates.fragmentShader || currentLayer.fragmentShader;
          
        if (glRef.current) {
          createShaderProgram(newShaderSource);
        }
      }
      
      updatedLayers[index] = {
        ...currentLayer,
        ...updates
      };
      
      return {
        ...prev,
        layers: updatedLayers
      };
    });
  }, [createShaderProgram]);
  
  // Reorder shader layers
  const reorderShaderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setOptions(prev => {
      if (fromIndex === toIndex) return prev;
      
      const updatedLayers = [...prev.layers];
      const [movedLayer] = updatedLayers.splice(fromIndex, 1);
      updatedLayers.splice(toIndex, 0, movedLayer);
      
      return {
        ...prev,
        layers: updatedLayers
      };
    });
  }, []);
  
  // Update shader options
  const setShaderOptions = useCallback((newOptions: Partial<ShaderOptions>) => {
    setOptions(prev => {
      const updated = { ...prev, ...newOptions };
      
      // If layers were provided, make sure to compile all shaders
      if (newOptions.layers && glRef.current) {
        newOptions.layers.forEach(layer => {
          const shaderSource = layer.customCode && layer.customCode.length > 0
            ? layer.customCode
            : layer.fragmentShader;
          createShaderProgram(shaderSource);
        });
      }
      
      return updated;
    });
  }, [createShaderProgram]);
  
  // Cleanup WebGL resources on unmount
  useEffect(() => {
    return () => {
      if (glRef.current) {
        // Delete all compiled programs
        programsRef.current.forEach(program => {
          glRef.current?.deleteProgram(program);
        });
        programsRef.current.clear();
      }
    };
  }, []);
  
  return {
    applyShader,
    setShaderOptions,
    addShaderLayer,
    removeShaderLayer,
    updateShaderLayer,
    reorderShaderLayers,
    shaderOptions: options,
    availableShaders: Object.keys(SHADER_PRESETS)
  };
}; 