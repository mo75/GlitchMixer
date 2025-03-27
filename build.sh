#!/bin/bash

# Install wasm-pack if not installed
if ! command -v wasm-pack &> /dev/null; then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WebAssembly module
cd glitch-wasm
wasm-pack build --target web

# Install npm dependencies
cd ..
npm install

# Start the development server
npm run dev 