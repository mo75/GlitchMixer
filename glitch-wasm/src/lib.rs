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
pub struct ByteCorruptOptions {
    amount: f64,               // Corruption intensity (0.0-1.0)
    mode: Option<usize>,       // 0=random bytes, 1=bit flip, 2=zero out, 3=max out, None=random
    block_size: Option<usize>, // Size of corruption blocks (default: 1)
    structured: bool,          // Use structured patterns vs random
}

#[derive(Serialize, Deserialize)]
pub struct ChunkSwapOptions {
    amount: f64,                // How many chunks to swap (0.0-1.0)
    chunk_size: Option<f64>,    // Relative chunk size (0.0-1.0)
    preserve_alpha: bool,       // Whether to preserve alpha channel
}

#[derive(Serialize, Deserialize)]
pub struct BinaryXorOptions {
    pattern: Option<Vec<u8>>,  // Pattern to XOR with (if None, will use random pattern)
    strength: f64,             // Strength of the effect (0.0-1.0)
    mode: Option<usize>,       // 0=full image, 1=horizontal bands, 2=vertical bands, 3=blocks
}

#[derive(Serialize, Deserialize)]
pub struct ImageBlendOptions {
    secondary_data: Vec<u8>,   // Raw pixel data of secondary image
    width: u32,                // Width of secondary image
    height: u32,               // Height of secondary image
    blend_mode: usize,         // 0=mix, 1=difference, 2=multiply, 3=screen, 4=overlay
    amount: f64,               // Blend intensity (0.0-1.0)
    offset_x: i32,             // Horizontal offset
    offset_y: i32,             // Vertical offset
}

#[derive(Serialize, Deserialize)]
pub struct GlitchOptions {
    pixel_sort: Option<PixelSortOptions>,
    data_bend: Option<DataBendOptions>,
    channel_shift: Option<ChannelShiftOptions>,
    noise: Option<f64>,
    invert: Option<Vec<usize>>, // Which channels to invert (0=R, 1=G, 2=B, 3=A)
    quantize: Option<usize>,    // Color depth reduction
    byte_corrupt: Option<ByteCorruptOptions>,
    chunk_swap: Option<ChunkSwapOptions>,
    binary_xor: Option<BinaryXorOptions>,
    image_blend: Option<ImageBlendOptions>,
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

    fn byte_corrupt_internal(&mut self, data: &mut [u8], options: &ByteCorruptOptions) {
        let len = data.len();
        let corruption_intensity = (options.amount * 0.1).min(0.05); // Cap to avoid completely destroying the image
        let num_corruptions = (len as f64 * corruption_intensity) as usize;
        let block_size = options.block_size.unwrap_or(1).max(1);
        
        if options.structured {
            // Create structured corruption patterns
            let stride = (len as f64 / num_corruptions as f64).max(1.0) as usize;
            let mode = options.mode.unwrap_or_else(|| self.rng.gen_range(0..4));
            
            // Fix: clone the range to avoid borrowing issues
            let positions: Vec<usize> = (0..num_corruptions)
                .filter(|_| {
                    // Generate random boolean outside of closure to avoid borrow issues
                    self.rng.gen_bool(0.7)
                })
                .map(|i| (i * stride) % len) // Calculate positions up front
                .collect();
            
            for start_pos in positions {
                let end_pos = (start_pos + block_size).min(len);
                
                for pos in start_pos..end_pos {
                    match mode {
                        0 => data[pos] = self.rng.gen(), // Random bytes
                        1 => data[pos] ^= 1 << self.rng.gen_range(0..8), // Bit flip
                        2 => data[pos] = 0, // Zero out
                        3 => data[pos] = 255, // Max out
                        _ => data[pos] = self.rng.gen(), // Default to random
                    }
                }
            }
        } else {
            // Random corruption
            for _ in 0..num_corruptions {
                let pos = self.rng.gen_range(0..len);
                let end_pos = (pos + block_size).min(len);
                let mode = options.mode.unwrap_or_else(|| self.rng.gen_range(0..4));
                
                for p in pos..end_pos {
                    match mode {
                        0 => data[p] = self.rng.gen(), // Random bytes
                        1 => data[p] ^= 1 << self.rng.gen_range(0..8), // Bit flip
                        2 => data[p] = 0, // Zero out
                        3 => data[p] = 255, // Max out
                        _ => data[p] = self.rng.gen(), // Default to random
                    }
                }
            }
        }
    }

    fn chunk_swap_internal(&mut self, data: &mut [u8], width: u32, options: &ChunkSwapOptions) {
        let len = data.len();
        let height = (len / 4) as u32 / width;
        
        // Fix: Convert height to usize first, then calculate base chunk size
        let base_chunk_size = (width as usize * (height as usize) / 20); // Base chunk is 5% of image
        let chunk_size_factor = options.chunk_size.unwrap_or(0.5);
        let chunk_size = (base_chunk_size as f64 * chunk_size_factor) as usize;
        let chunk_size = chunk_size.max(16).min(len / 8); // Reasonable bounds
        
        let num_swaps = (options.amount * 10.0) as usize;
        
        for _ in 0..num_swaps {
            // Ensure we don't go out of bounds and chunks are pixel-aligned
            let max_start = len.saturating_sub(chunk_size * 2);
            if max_start < 4 { continue; }
            
            let pos1 = self.rng.gen_range(0..max_start);
            let pos1 = pos1 - (pos1 % 4); // Ensure pixel alignment
            
            let pos2 = self.rng.gen_range(0..max_start);
            let pos2 = pos2 - (pos2 % 4); // Ensure pixel alignment
            
            // Swap chunks
            for i in 0..chunk_size {
                if pos1 + i < len && pos2 + i < len {
                    // If preserving alpha, don't swap the alpha channel
                    if options.preserve_alpha && i % 4 == 3 {
                        continue;
                    }
                    data.swap(pos1 + i, pos2 + i);
                }
            }
        }
    }

    fn binary_xor_internal(&mut self, data: &mut [u8], width: u32, options: &BinaryXorOptions) {
        let len = data.len();
        let height = len / 4 / width as usize;
        
        // Create or use the provided XOR pattern
        let pattern = match &options.pattern {
            Some(p) => p.clone(),
            None => {
                // Generate a random pattern based on the strength
                let pattern_size = (8.0 * options.strength) as usize + 1; // 1-9 bytes
                let mut pattern = Vec::with_capacity(pattern_size);
                for _ in 0..pattern_size {
                    pattern.push(self.rng.gen());
                }
                pattern
            }
        };
        
        if pattern.is_empty() { return; }
        
        let mode = options.mode.unwrap_or(0);
        let strength = (options.strength * 255.0) as u8;
        
        match mode {
            0 => {
                // Full image XOR
                for (i, byte) in data.iter_mut().enumerate() {
                    let pattern_byte = pattern[i % pattern.len()];
                    let xor_value = ((pattern_byte as u16 * strength as u16) / 255) as u8;
                    *byte ^= xor_value;
                }
            },
            1 => {
                // Horizontal bands
                let band_height = height / pattern.len().max(1);
                for y in 0..height {
                    let band = y / band_height;
                    let pattern_byte = pattern[band % pattern.len()];
                    let xor_value = ((pattern_byte as u16 * strength as u16) / 255) as u8;
                    
                    let row_start = (y * width as usize * 4) as usize;
                    let row_end = row_start + (width as usize * 4);
                    
                    for i in (row_start..row_end).step_by(4) {
                        // Apply to RGB but not alpha
                        for j in 0..3 {
                            if i + j < len {
                                data[i + j] ^= xor_value;
                            }
                        }
                    }
                }
            },
            2 => {
                // Vertical bands
                let band_width = width / pattern.len().max(1) as u32;
                for x in 0..width {
                    let band = x / band_width;
                    let pattern_byte = pattern[band as usize % pattern.len()];
                    let xor_value = ((pattern_byte as u16 * strength as u16) / 255) as u8;
                    
                    for y in 0..height {
                        let i = (y * width as usize * 4 + x as usize * 4) as usize;
                        // Apply to RGB but not alpha
                        for j in 0..3 {
                            if i + j < len {
                                data[i + j] ^= xor_value;
                            }
                        }
                    }
                }
            },
            3 => {
                // Blocks
                let block_width = width / 8;
                let block_height = height as u32 / 8;
                
                for y in 0..height as u32 {
                    let block_y = y / block_height;
                    for x in 0..width {
                        let block_x = x / block_width;
                        let block_idx = (block_y * 8 + block_x) as usize;
                        let pattern_byte = pattern[block_idx % pattern.len()];
                        let xor_value = ((pattern_byte as u16 * strength as u16) / 255) as u8;
                        
                        let i = (y as usize * width as usize * 4 + x as usize * 4) as usize;
                        // Apply to RGB but not alpha
                        for j in 0..3 {
                            if i + j < len {
                                data[i + j] ^= xor_value;
                            }
                        }
                    }
                }
            },
            _ => {} // Invalid mode, do nothing
        }
    }

    fn image_blend_internal(&mut self, data: &mut [u8], width: u32, options: &ImageBlendOptions) {
        let primary_height = data.len() / 4 / width as usize;
        let secondary_width = options.width;
        let secondary_height = options.height;
        
        // Check if the secondary image data is valid
        if options.secondary_data.len() != (secondary_width * secondary_height * 4) as usize {
            return; // Invalid secondary image data
        }
        
        let amount = options.amount;
        let inverse_amount = 1.0 - amount;
        
        for y in 0..primary_height {
            for x in 0..width as usize {
                let primary_idx = (y * width as usize + x) * 4;
                
                // Calculate position in secondary image with offset
                let sec_x = (x as i32 + options.offset_x).rem_euclid(secondary_width as i32) as usize;
                let sec_y = (y as i32 + options.offset_y).rem_euclid(secondary_height as i32) as usize;
                let secondary_idx = (sec_y * secondary_width as usize + sec_x) * 4;
                
                if primary_idx + 3 < data.len() && secondary_idx + 3 < options.secondary_data.len() {
                    // Get pixel values
                    let p_r = data[primary_idx];
                    let p_g = data[primary_idx + 1];
                    let p_b = data[primary_idx + 2];
                    
                    let s_r = options.secondary_data[secondary_idx];
                    let s_g = options.secondary_data[secondary_idx + 1];
                    let s_b = options.secondary_data[secondary_idx + 2];
                    
                    // Apply blend based on mode
                    match options.blend_mode {
                        0 => {
                            // Mix blend (linear interpolation)
                            data[primary_idx] = ((p_r as f64 * inverse_amount) + (s_r as f64 * amount)) as u8;
                            data[primary_idx + 1] = ((p_g as f64 * inverse_amount) + (s_g as f64 * amount)) as u8;
                            data[primary_idx + 2] = ((p_b as f64 * inverse_amount) + (s_b as f64 * amount)) as u8;
                        },
                        1 => {
                            // Difference blend
                            data[primary_idx] = ((p_r as i16 - s_r as i16).abs() as f64 * amount + p_r as f64 * inverse_amount) as u8;
                            data[primary_idx + 1] = ((p_g as i16 - s_g as i16).abs() as f64 * amount + p_g as f64 * inverse_amount) as u8;
                            data[primary_idx + 2] = ((p_b as i16 - s_b as i16).abs() as f64 * amount + p_b as f64 * inverse_amount) as u8;
                        },
                        2 => {
                            // Multiply blend
                            data[primary_idx] = ((p_r as f64 * s_r as f64 / 255.0) * amount + p_r as f64 * inverse_amount) as u8;
                            data[primary_idx + 1] = ((p_g as f64 * s_g as f64 / 255.0) * amount + p_g as f64 * inverse_amount) as u8;
                            data[primary_idx + 2] = ((p_b as f64 * s_b as f64 / 255.0) * amount + p_b as f64 * inverse_amount) as u8;
                        },
                        3 => {
                            // Screen blend
                            let screen_r = 255 - ((255 - p_r as u16) * (255 - s_r as u16) / 255) as u8;
                            let screen_g = 255 - ((255 - p_g as u16) * (255 - s_g as u16) / 255) as u8;
                            let screen_b = 255 - ((255 - p_b as u16) * (255 - s_b as u16) / 255) as u8;
                            
                            data[primary_idx] = (screen_r as f64 * amount + p_r as f64 * inverse_amount) as u8;
                            data[primary_idx + 1] = (screen_g as f64 * amount + p_g as f64 * inverse_amount) as u8;
                            data[primary_idx + 2] = (screen_b as f64 * amount + p_b as f64 * inverse_amount) as u8;
                        },
                        4 => {
                            // Overlay blend
                            let overlay = |a: u8, b: u8| -> u8 {
                                if a < 128 {
                                    ((2 * a as u16 * b as u16) / 255) as u8
                                } else {
                                    (255 - 2 * (255 - a as u16) * (255 - b as u16) / 255) as u8
                                }
                            };
                            
                            let o_r = overlay(p_r, s_r);
                            let o_g = overlay(p_g, s_g);
                            let o_b = overlay(p_b, s_b);
                            
                            data[primary_idx] = (o_r as f64 * amount + p_r as f64 * inverse_amount) as u8;
                            data[primary_idx + 1] = (o_g as f64 * amount + p_g as f64 * inverse_amount) as u8;
                            data[primary_idx + 2] = (o_b as f64 * amount + p_b as f64 * inverse_amount) as u8;
                        },
                        _ => {} // Invalid mode, do nothing
                    }
                }
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
    pub fn byte_corrupt(&mut self, data: &mut [u8], amount: f64, mode: Option<usize>, block_size: Option<usize>, structured: bool) {
        let options = ByteCorruptOptions {
            amount,
            mode,
            block_size,
            structured,
        };
        self.byte_corrupt_internal(data, &options);
    }

    #[wasm_bindgen]
    pub fn chunk_swap(&mut self, data: &mut [u8], width: u32, amount: f64, chunk_size: Option<f64>, preserve_alpha: bool) {
        let options = ChunkSwapOptions {
            amount,
            chunk_size,
            preserve_alpha,
        };
        self.chunk_swap_internal(data, width, &options);
    }

    #[wasm_bindgen]
    pub fn binary_xor(&mut self, data: &mut [u8], width: u32, pattern: Option<Box<[u8]>>, strength: f64, mode: Option<usize>) {
        let pattern = pattern.map(|p| p.to_vec());
        let options = BinaryXorOptions {
            pattern,
            strength,
            mode,
        };
        self.binary_xor_internal(data, width, &options);
    }

    #[wasm_bindgen]
    pub fn image_blend(&mut self, data: &mut [u8], width: u32, secondary_data: &[u8], 
                        secondary_width: u32, secondary_height: u32,
                        blend_mode: usize, amount: f64, offset_x: i32, offset_y: i32) {
        let options = ImageBlendOptions {
            secondary_data: secondary_data.to_vec(),
            width: secondary_width,
            height: secondary_height,
            blend_mode,
            amount,
            offset_x,
            offset_y,
        };
        self.image_blend_internal(data, width, &options);
    }

    #[wasm_bindgen]
    pub fn apply_effects(&mut self, image_data: ImageData, options_js: JsValue) -> Result<ImageData, JsValue> {
        let options: GlitchOptions = serde_wasm_bindgen::from_value(options_js)?;
        let width = image_data.width();
        let height = image_data.height();
        
        // Create a copy of the data for processing
        let original_data = image_data.data();
        let mut data = original_data.to_vec();
        
        // Apply pixel sort effect if requested
        if let Some(pixel_sort_options) = &options.pixel_sort {
            self.pixel_sort_internal(&mut data, width, &pixel_sort_options);
        }
        
        // Apply data bend effect if requested
        if let Some(data_bend_options) = &options.data_bend {
            self.data_bend_internal(&mut data, &data_bend_options);
        }
        
        // Apply channel shift effect if requested
        if let Some(channel_shift_options) = &options.channel_shift {
            self.channel_shift_internal(&mut data, &channel_shift_options);
        }
        
        // Apply noise if requested
        if let Some(amount) = options.noise {
            self.add_noise_internal(&mut data, amount);
        }
        
        // Apply invert if requested
        if let Some(channels) = &options.invert {
            self.invert_channels_internal(&mut data, channels);
        }
        
        // Apply quantize if requested
        if let Some(levels) = options.quantize {
            self.quantize_internal(&mut data, levels);
        }
        
        // Apply byte corruption if requested
        if let Some(byte_corrupt_options) = &options.byte_corrupt {
            self.byte_corrupt_internal(&mut data, &byte_corrupt_options);
        }
        
        // Apply chunk swap if requested
        if let Some(chunk_swap_options) = &options.chunk_swap {
            self.chunk_swap_internal(&mut data, width, &chunk_swap_options);
        }
        
        // Apply binary XOR if requested
        if let Some(binary_xor_options) = &options.binary_xor {
            self.binary_xor_internal(&mut data, width, &binary_xor_options);
        }
        
        // Apply image blend if requested
        if let Some(image_blend_options) = &options.image_blend {
            self.image_blend_internal(&mut data, width, &image_blend_options);
        }
        
        // Create new ImageData
        // Convert Vec<u8> to slice &[u8] to match expected type
        let data_slice = data.as_slice();
        ImageData::new_with_u8_clamped_array_and_sh(wasm_bindgen::Clamped(data_slice), width, height)
    }
} 