use wasm_bindgen::prelude::*;
use web_sys::ImageData;
use rand::{Rng, SeedableRng};
use rand::rngs::SmallRng;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct PixelSortOptions {
    intensity: f64,
    threshold: f64,
    vertical: bool,
    channel: Option<usize>, // 0=R, 1=G, 2=B, None=brightness
}

#[derive(Serialize, Deserialize)]
pub struct DataBendOptions {
    amount: f64,
    mode: Option<usize>, // 0=duplicate, 1=reverse, 2=shift, 3=scramble, None=random
    chunk_size: Option<f64>, // Relative chunk size 0.0-1.0
    channel: Option<usize>, // 0=R, 1=G, 2=B, 3=A, None=all
}

#[derive(Serialize, Deserialize)]
pub struct ChannelShiftOptions {
    amount: f64,
    channels: Option<Vec<usize>>, // Which channels to shift
    direction: Option<i32>, // -1=left, 1=right, 0=random, None=random
}

#[derive(Serialize, Deserialize)]
pub struct GlitchOptions {
    pixel_sort: Option<PixelSortOptions>,
    data_bend: Option<DataBendOptions>,
    channel_shift: Option<ChannelShiftOptions>,
    noise: Option<f64>,
    invert: Option<Vec<usize>>, // Which channels to invert (0=R, 1=G, 2=B, 3=A)
    quantize: Option<usize>, // Color depth reduction
}

#[wasm_bindgen]
pub struct GlitchEffect {
    rng: SmallRng,
}

#[wasm_bindgen]
impl GlitchEffect {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let rng = SmallRng::from_entropy();
        Self { rng }
    }

    // Note: These internal functions are not exposed directly to JavaScript
    fn pixel_sort_internal(&mut self, data: &mut [u8], width: u32, options: &PixelSortOptions) {
        let height = (data.len() / 4) as u32 / width;
        let threshold = (options.threshold * 255.0) as u8;
        let min_segment = (options.intensity * 100.0) as usize; // Minimum segment size scales with intensity
        
        if options.vertical {
            // Vertical sorting
            for x in 0..width {
                let mut segments = Vec::new();
                let mut start = (x * 4) as usize;
                
                for y in 0..height {
                    let idx = (y * width * 4 + x * 4) as usize;
                    let value = match options.channel {
                        Some(0) => data[idx],
                        Some(1) => data[idx + 1],
                        Some(2) => data[idx + 2],
                        _ => ((data[idx] as u16 + data[idx + 1] as u16 + data[idx + 2] as u16) / 3) as u8
                    };
                    
                    if value > threshold || y == height - 1 {
                        let y_pos = (y * width * 4) as usize;
                        if y_pos > start && y_pos - start >= min_segment * 4 {
                            segments.push((start, idx));
                        }
                        start = ((y + 1) * width * 4 + x * 4) as usize;
                    }
                }
                
                // Sort each vertical segment
                for (start_idx, end_idx) in segments {
                    let mut pixels = Vec::new();
                    let mut i = start_idx;
                    while i <= end_idx {
                        let pixel = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                        pixels.push(pixel);
                        i += (width * 4) as usize;
                    }
                    
                    pixels.sort_by_key(|pixel| {
                        match options.channel {
                            Some(0) => pixel[0],
                            Some(1) => pixel[1],
                            Some(2) => pixel[2],
                            _ => ((pixel[0] as u16 + pixel[1] as u16 + pixel[2] as u16) / 3) as u8
                        }
                    });
                    
                    // Write back sorted pixels
                    let mut i = start_idx;
                    for pixel in pixels {
                        data[i] = pixel[0];
                        data[i + 1] = pixel[1];
                        data[i + 2] = pixel[2];
                        data[i + 3] = pixel[3];
                        i += (width * 4) as usize;
                    }
                }
            }
        } else {
            // Horizontal sorting
            for y in 0..height {
                let row_start = (y * width * 4) as usize;
                let row_end = row_start + (width * 4) as usize;
                let mut segments = Vec::new();
                let mut start = row_start;
                
                // First, collect segments to sort
                for x in (row_start..row_end).step_by(4) {
                    let value = match options.channel {
                        Some(0) => data[x],
                        Some(1) => data[x + 1],
                        Some(2) => data[x + 2],
                        _ => ((data[x] as u16 + data[x + 1] as u16 + data[x + 2] as u16) / 3) as u8
                    };
                    
                    if value > threshold || x + 4 >= row_end {
                        if x > start && x - start >= min_segment * 4 {
                            segments.push((start, x));
                        }
                        start = x + 4;
                    }
                }
                
                // Then sort each segment
                for (start, end) in segments {
                    let mut pixels: Vec<_> = (start..end)
                        .step_by(4)
                        .map(|i| [data[i], data[i + 1], data[i + 2], data[i + 3]])
                        .collect();
                    
                    pixels.sort_by_key(|pixel| {
                        match options.channel {
                            Some(0) => pixel[0],
                            Some(1) => pixel[1],
                            Some(2) => pixel[2],
                            _ => ((pixel[0] as u16 + pixel[1] as u16 + pixel[2] as u16) / 3) as u8
                        }
                    });
                    
                    // Write back sorted pixels
                    for (idx, pixel) in pixels.iter().enumerate() {
                        let pos = start + idx * 4;
                        data[pos] = pixel[0];
                        data[pos + 1] = pixel[1];
                        data[pos + 2] = pixel[2];
                        data[pos + 3] = pixel[3];
                    }
                }
            }
        }
    }

    fn data_bend_internal(&mut self, data: &mut [u8], options: &DataBendOptions) {
        let len = data.len();
        let iterations = (options.amount * 200.0) as usize;
        let max_chunk_size = (options.chunk_size.unwrap_or(0.5) * 500.0) as usize;
        let min_chunk = 16;
        
        for _ in 0..iterations {
            // Generate random chunk size
            let chunk_size = self.rng.gen_range(min_chunk..max_chunk_size.max(min_chunk + 1));
            let chunk_size = chunk_size - (chunk_size % 4); // Ensure it's a multiple of 4
            
            // Generate random position ensuring we don't go out of bounds
            let max_start = len.saturating_sub(chunk_size * 2);
            if max_start < 4 { continue; }
            
            let pos = self.rng.gen_range(0..max_start);
            let pos = pos - (pos % 4); // Ensure we start at a pixel boundary
            
            // Determine which channels to affect
            let channels = match options.channel {
                Some(0) => vec![0],  // Red
                Some(1) => vec![1],  // Green
                Some(2) => vec![2],  // Blue
                Some(3) => vec![3],  // Alpha
                _ => vec![0, 1, 2, 3], // All channels
            };
            
            // Choose an effect type
            let mode = options.mode.unwrap_or_else(|| self.rng.gen_range(0..4));
            
            match mode {
                0 => {
                    // Duplicate chunk
                    let mut temp = vec![0; chunk_size];
                    for i in 0..chunk_size/4 {
                        for &ch in &channels {
                            temp[i*4 + ch] = data[pos + i*4 + ch];
                        }
                    }
                    
                    let dest = pos + chunk_size;
                    if dest + chunk_size <= len {
                        for i in 0..chunk_size/4 {
                            for &ch in &channels {
                                data[dest + i*4 + ch] = temp[i*4 + ch];
                            }
                        }
                    }
                }
                1 => {
                    // Reverse chunk
                    for i in 0..chunk_size/8 {
                        let a = pos + i * 4;
                        let b = pos + chunk_size - 4 - i * 4;
                        for &ch in &channels {
                            data.swap(a + ch, b + ch);
                        }
                    }
                }
                2 => {
                    // Shift chunk
                    let shift = self.rng.gen_range(4..chunk_size);
                    let shift = shift - (shift % 4); // Ensure shift is multiple of 4
                    
                    let mut temp = vec![0; chunk_size];
                    for i in 0..chunk_size/4 {
                        for &ch in &channels {
                            temp[i*4 + ch] = data[pos + i*4 + ch];
                        }
                    }
                    
                    // Shift data
                    for i in 0..(chunk_size-shift)/4 {
                        for &ch in &channels {
                            data[pos + i*4 + ch] = data[pos + shift + i*4 + ch];
                        }
                    }
                    
                    // Copy back the beginning part to the end
                    let dest = pos + chunk_size - shift;
                    for i in 0..shift/4 {
                        for &ch in &channels {
                            data[dest + i*4 + ch] = temp[i*4 + ch];
                        }
                    }
                }
                3 | _ => {
                    // Scramble pixels within chunk
                    let mut pixel_indices: Vec<usize> = (0..chunk_size/4).collect();
                    
                    // Fisher-Yates shuffle
                    for i in (1..pixel_indices.len()).rev() {
                        let j = self.rng.gen_range(0..i+1);
                        pixel_indices.swap(i, j);
                    }
                    
                    // Create copy of the chunk
                    let mut temp = vec![0; chunk_size];
                    for i in 0..chunk_size/4 {
                        for &ch in &channels {
                            temp[i*4 + ch] = data[pos + i*4 + ch];
                        }
                    }
                    
                    // Write back scrambled
                    for (i, &scrambled_idx) in pixel_indices.iter().enumerate() {
                        for &ch in &channels {
                            data[pos + i*4 + ch] = temp[scrambled_idx*4 + ch];
                        }
                    }
                }
            }
        }
    }

    fn channel_shift_internal(&mut self, data: &mut [u8], options: &ChannelShiftOptions) {
        let shift_amount = (options.amount * 30.0) as i32;
        let len = data.len();
        
        let channels = match &options.channels {
            Some(ch) => ch.clone(),
            None => vec![0, 1, 2] // Default to RGB
        };
        
        let direction = match options.direction {
            Some(dir) if dir == 0 => if self.rng.gen_bool(0.5) { 1 } else { -1 },
            Some(dir) => dir,
            None => if self.rng.gen_bool(0.5) { 1 } else { -1 }
        };
        
        for &channel in &channels {
            if channel >= 3 { continue; } // Skip alpha
            
            let shift = shift_amount * direction;
            
            // Make a copy of the channel
            let mut channel_data = Vec::with_capacity(len / 4);
            for i in (0..len).step_by(4) {
                channel_data.push(data[i + channel]);
            }
            
            // Shift and place back
            let channel_len = channel_data.len();
            for i in 0..channel_len {
                let shifted_idx = (i as i32 + shift).rem_euclid(channel_len as i32) as usize;
                data[i * 4 + channel] = channel_data[shifted_idx];
            }
        }
    }
    
    fn add_noise_internal(&mut self, data: &mut [u8], amount: f64) {
        let noise_amount = (amount * 255.0) as u8;
        
        for i in (0..data.len()).step_by(4) {
            // Skip alpha channel
            for j in 0..3 {
                let noise = self.rng.gen_range(0..noise_amount);
                let add_noise = self.rng.gen_bool(0.5);
                
                if add_noise {
                    data[i + j] = data[i + j].saturating_add(noise);
                } else {
                    data[i + j] = data[i + j].saturating_sub(noise);
                }
            }
        }
    }
    
    fn invert_channels_internal(&self, data: &mut [u8], channels: &[usize]) {
        for i in (0..data.len()).step_by(4) {
            for &ch in channels {
                if ch < 4 {
                    data[i + ch] = 255 - data[i + ch];
                }
            }
        }
    }
    
    fn quantize_internal(&self, data: &mut [u8], levels: usize) {
        if levels <= 1 { return; }
        
        let divisor = 255.0 / (levels - 1) as f64;
        
        for i in (0..data.len()).step_by(4) {
            // Skip alpha channel
            for j in 0..3 {
                let value = data[i + j] as f64;
                let quantized = (((value / divisor).round() * divisor) as u8).min(255);
                data[i + j] = quantized;
            }
        }
    }

    // JavaScript-exposed functions
    #[wasm_bindgen]
    pub fn pixel_sort(&mut self, data: &mut [u8], width: u32, intensity: f64, threshold: f64, vertical: bool, channel: Option<usize>) {
        let options = PixelSortOptions {
            intensity,
            threshold,
            vertical,
            channel,
        };
        self.pixel_sort_internal(data, width, &options);
    }
    
    #[wasm_bindgen]
    pub fn data_bend(&mut self, data: &mut [u8], amount: f64, mode: Option<usize>, chunk_size: Option<f64>, channel: Option<usize>) {
        let options = DataBendOptions {
            amount,
            mode,
            chunk_size,
            channel,
        };
        self.data_bend_internal(data, &options);
    }
    
    #[wasm_bindgen]
    pub fn channel_shift(&mut self, data: &mut [u8], amount: f64, channels: Option<Box<[usize]>>, direction: Option<i32>) {
        let channels_vec = channels.map(|ch| ch.to_vec());
        let options = ChannelShiftOptions {
            amount,
            channels: channels_vec,
            direction,
        };
        self.channel_shift_internal(data, &options);
    }
    
    #[wasm_bindgen]
    pub fn add_noise(&mut self, data: &mut [u8], amount: f64) {
        self.add_noise_internal(data, amount);
    }
    
    #[wasm_bindgen]
    pub fn invert_channels(&mut self, data: &mut [u8], channels: Box<[usize]>) {
        self.invert_channels_internal(data, &channels);
    }
    
    #[wasm_bindgen]
    pub fn quantize(&mut self, data: &mut [u8], levels: usize) {
        self.quantize_internal(data, levels);
    }

    #[wasm_bindgen]
    pub fn apply_effects(&mut self, image_data: ImageData, options_js: JsValue) -> Result<ImageData, JsValue> {
        let options: GlitchOptions = serde_wasm_bindgen::from_value(options_js)?;
        let width = image_data.width();
        
        // Create a copy of the data since we can't get mutable access
        let mut data = image_data.data().to_vec();
        
        if let Some(pixel_sort_options) = &options.pixel_sort {
            self.pixel_sort_internal(&mut data, width, pixel_sort_options);
        }
        
        if let Some(data_bend_options) = &options.data_bend {
            self.data_bend_internal(&mut data, data_bend_options);
        }
        
        if let Some(channel_shift_options) = &options.channel_shift {
            self.channel_shift_internal(&mut data, channel_shift_options);
        }
        
        if let Some(noise_amount) = options.noise {
            self.add_noise_internal(&mut data, noise_amount);
        }
        
        if let Some(channels) = &options.invert {
            self.invert_channels_internal(&mut data, channels);
        }
        
        if let Some(levels) = options.quantize {
            self.quantize_internal(&mut data, levels);
        }

        // Create new ImageData with modified data
        ImageData::new_with_u8_clamped_array_and_sh(
            wasm_bindgen::Clamped(&data),
            width,
            image_data.height()
        )
    }
} 