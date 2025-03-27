declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '../glitch-wasm/pkg' {
  export class GlitchEffect {
    constructor();
    apply_effects(imageData: ImageData, effects: {
      pixel_sort?: number;
      data_bend?: number;
      channel_shift?: number;
    }): ImageData;
  }
  export default function init(): Promise<void>;
}

// Add GIF.js type declarations
declare module 'gif.js' {
  export interface GIFOptions {
    workers?: number;
    quality?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    repeat?: number;
    transparent?: number | null;
    background?: string;
    dither?: boolean | string;
    debug?: boolean;
  }

  export default class GIF {
    constructor(options: GIFOptions);
    addFrame(imageElement: CanvasImageSource, options?: { delay: number, copy?: boolean }): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (percent: number) => void): void;
    render(): void;
    abort(): void;
  }
} 