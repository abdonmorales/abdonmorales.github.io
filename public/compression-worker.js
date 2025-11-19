/**
 * Compression Web Worker
 * 
 * Runs compression algorithms in a separate thread to avoid blocking the UI
 * Handles compression/decompression requests from the main thread
 */

/**
 * Message event handler for the compression worker
 * @param {MessageEvent} event - The message event from the main thread
 */
self.addEventListener('message', async (event) => {
  const { type, id, data, options } = event.data;

  try {
    switch (type) {
      case 'compress':
        const compressed = await compressInWorker(data, options);
        self.postMessage({ type: 'compressed', id, result: compressed });
        break;

      case 'decompress':
        const decompressed = await decompressInWorker(data);
        self.postMessage({ type: 'decompressed', id, result: decompressed });
        break;

      case 'compress-image':
        const imageResult = await compressImageInWorker(data, options);
        self.postMessage({ type: 'image-compressed', id, result: imageResult });
        break;

      default:
        throw new Error(`Unknown worker command: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Compression implementation (copied from compression.ts for worker isolation)

/**
 * Huffman tree node for compression
 */
class HuffmanNode {
  /**
   * @param {number|null} char - The character code or null for internal nodes
   * @param {number} freq - The frequency of the character
   */
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

/**
 * Compresses data using a hybrid algorithm (Delta + RLE + LZ77 + Huffman)
 * @param {ArrayBuffer|string} input - The input data to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} The compressed data with metadata
 */
async function compressInWorker(input, options) {
  const data = typeof input === 'string' 
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);

  // Yield control periodically to prevent blocking
  const chunkSize = 8192; // Process 8KB chunks
  
  // Delta encoding
  const deltaEncoded = await deltaEncodeChunked(data, chunkSize);
  
  // RLE
  const rleEncoded = await runLengthEncodeChunked(deltaEncoded, chunkSize);
  
  // LZ77 (optimized)
  const lzEncoded = await lz77CompressOptimized(rleEncoded);
  
  // Huffman
  const huffmanEncoded = huffmanCompress(lzEncoded);

  return {
    data: Array.from(huffmanEncoded),
    metadata: {
      originalSize: data.length,
      compressedSize: huffmanEncoded.length,
      algorithm: 'Hybrid (Delta + RLE + LZ77 + Huffman)',
      timestamp: Date.now(),
    },
    compressionRatio: ((1 - huffmanEncoded.length / data.length) * 100)
  };
}

/**
 * Decompresses data that was compressed with compressInWorker
 * @param {Object} compressed - The compressed data object
 * @returns {Promise<Uint8Array>} The decompressed data
 */
async function decompressInWorker(compressed) {
  const data = new Uint8Array(compressed.data);
  
  const huffmanDecoded = huffmanDecompress(data);
  const lzDecoded = lz77Decompress(huffmanDecoded);
  const rleDecoded = runLengthDecode(lzDecoded);
  const original = deltaDecode(rleDecoded);
  
  return original;
}

/**
 * Compresses image data
 * @param {Object} imageData - Image data with width, height, and data properties
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} The compressed image data with metadata
 */
async function compressImageInWorker(imageData, options) {
  const pixels = new Uint8Array(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  
  // Simple compression - no PNG filtering for performance
  const compressed = await compressInWorker(pixels.buffer, options);
  
  return {
    ...compressed,
    width,
    height,
    channels: 4,
    hasAlpha: true
  };
}

/**
 * Delta encoding with chunking for non-blocking execution
 * @param {Uint8Array} data - The data to encode
 * @param {number} chunkSize - Size of chunks to process before yielding
 * @returns {Promise<Uint8Array>} The delta encoded data
 */
async function deltaEncodeChunked(data, chunkSize) {
  if (data.length === 0) return data;
  
  const result = new Uint8Array(data.length);
  result[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    result[i] = (data[i] - data[i - 1] + 256) & 0xFF;
    
    // Yield every chunk
    if (i % chunkSize === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return result;
}

/**
 * Decodes delta encoded data
 * @param {Uint8Array} data - The delta encoded data
 * @returns {Uint8Array} The decoded data
 */
function deltaDecode(data) {
  if (data.length === 0) return data;
  
  const result = new Uint8Array(data.length);
  result[0] = data[0];
  
  for (let i = 1; i < data.length; i++) {
    result[i] = (result[i - 1] + data[i]) & 0xFF;
  }
  
  return result;
}

/**
 * Run-length encoding with chunking for non-blocking execution
 * @param {Uint8Array} data - The data to encode
 * @param {number} chunkSize - Size of chunks to process before yielding
 * @returns {Promise<Uint8Array>} The RLE encoded data
 */
async function runLengthEncodeChunked(data, chunkSize) {
  const result = [];
  let i = 0;
  let processedBytes = 0;
  
  while (i < data.length) {
    let count = 1;
    const current = data[i];
    
    while (i + count < data.length && data[i + count] === current && count < 255) {
      count++;
    }
    
    if (count > 3) {
      result.push(0xFF, count, current);
    } else {
      for (let j = 0; j < count; j++) {
        result.push(current);
      }
    }
    
    i += count;
    processedBytes += count;
    
    // Yield periodically
    if (processedBytes >= chunkSize) {
      await new Promise(resolve => setTimeout(resolve, 0));
      processedBytes = 0;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Decodes run-length encoded data
 * @param {Uint8Array} data - The RLE encoded data
 * @returns {Uint8Array} The decoded data
 */
function runLengthDecode(data) {
  const result = [];
  let i = 0;
  
  while (i < data.length) {
    if (data[i] === 0xFF && i + 2 < data.length) {
      const count = data[i + 1];
      const value = data[i + 2];
      for (let j = 0; j < count; j++) {
        result.push(value);
      }
      i += 3;
    } else {
      result.push(data[i]);
      i++;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Optimized LZ77 compression with reduced complexity
 * @param {Uint8Array} data - The data to compress
 * @returns {Promise<Uint8Array>} The LZ77 compressed data
 */
async function lz77CompressOptimized(data) {
  if (data.length < 512) return data;
  
  const windowSize = 1024;
  const lookaheadSize = 8;
  const result = [];
  let i = 0;
  
  while (i < data.length) {
    let bestLength = 0;
    let bestDistance = 0;
    
    const searchStart = Math.max(0, i - windowSize);
    
    // Sample every 4th position
    for (let j = searchStart; j < i; j += 4) {
      let length = 0;
      while (
        length < lookaheadSize &&
        i + length < data.length &&
        data[j + length] === data[i + length]
      ) {
        length++;
      }
      
      if (length > bestLength) {
        bestLength = length;
        bestDistance = i - j;
        if (length >= lookaheadSize) break;
      }
    }
    
    if (bestLength > 3) {
      result.push(0xFE, bestDistance >> 8, bestDistance & 0xFF, bestLength);
      i += bestLength;
    } else {
      result.push(data[i]);
      i++;
    }
    
    // Yield every 4KB
    if (i % 4096 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Decompresses LZ77 encoded data
 * @param {Uint8Array} data - The LZ77 encoded data
 * @returns {Uint8Array} The decompressed data
 */
function lz77Decompress(data) {
  const result = [];
  let i = 0;
  
  while (i < data.length) {
    if (data[i] === 0xFE && i + 3 < data.length) {
      const distance = (data[i + 1] << 8) | data[i + 2];
      const length = data[i + 3];
      const start = result.length - distance;
      
      for (let j = 0; j < length; j++) {
        result.push(result[start + j]);
      }
      i += 4;
    } else {
      result.push(data[i]);
      i++;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Compresses data using Huffman encoding
 * @param {Uint8Array} data - The data to compress
 * @returns {Uint8Array} The Huffman encoded data
 */
function huffmanCompress(data) {
  const frequencies = new Map();
  for (const byte of data) {
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
  }
  
  if (frequencies.size === 0) return new Uint8Array(0);
  
  const huffmanTree = buildHuffmanTree(frequencies);
  const codes = new Map();
  generateHuffmanCodes(huffmanTree, codes);
  
  let bitString = '';
  for (const byte of data) {
    bitString += codes.get(byte);
  }
  
  const result = [];
  result.push(frequencies.size);
  
  frequencies.forEach((freq, char) => {
    result.push(char, freq >> 8, freq & 0xFF);
  });
  
  result.push(bitString.length >> 24, (bitString.length >> 16) & 0xFF,
             (bitString.length >> 8) & 0xFF, bitString.length & 0xFF);
  
  for (let i = 0; i < bitString.length; i += 8) {
    const byte = bitString.substr(i, 8).padEnd(8, '0');
    result.push(parseInt(byte, 2));
  }
  
  return new Uint8Array(result);
}

/**
 * Decompresses Huffman encoded data
 * @param {Uint8Array} data - The Huffman encoded data
 * @returns {Uint8Array} The decompressed data
 */
function huffmanDecompress(data) {
  let offset = 0;
  const tableSize = data[offset++];
  const frequencies = new Map();
  
  for (let i = 0; i < tableSize; i++) {
    const char = data[offset++];
    const freq = (data[offset++] << 8) | data[offset++];
    frequencies.set(char, freq);
  }
  
  const huffmanTree = buildHuffmanTree(frequencies);
  const bitLength = (data[offset++] << 24) | (data[offset++] << 16) | 
                   (data[offset++] << 8) | data[offset++];
  
  let bitString = '';
  for (let i = offset; i < data.length; i++) {
    bitString += data[i].toString(2).padStart(8, '0');
  }
  bitString = bitString.substr(0, bitLength);
  
  const result = [];
  let node = huffmanTree;
  
  for (const bit of bitString) {
    node = bit === '0' ? node.left : node.right;
    if (node.char !== null) {
      result.push(node.char);
      node = huffmanTree;
    }
  }
  
  return new Uint8Array(result);
}

/**
 * Builds a Huffman tree from character frequencies
 * @param {Map<number, number>} frequencies - Map of character codes to frequencies
 * @returns {HuffmanNode} The root of the Huffman tree
 */
function buildHuffmanTree(frequencies) {
  const nodes = [];
  frequencies.forEach((freq, char) => {
    nodes.push(new HuffmanNode(char, freq));
  });
  
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;
    nodes.push(parent);
  }
  
  return nodes[0];
}

/**
 * Generates Huffman codes from a Huffman tree
 * @param {HuffmanNode|null} node - Current node in the tree
 * @param {Map<number, string>} codes - Map to store the generated codes
 * @param {string} code - Current code being built
 */
function generateHuffmanCodes(node, codes, code = '') {
  if (!node) return;
  if (node.char !== null) {
    codes.set(node.char, code || '0');
    return;
  }
  generateHuffmanCodes(node.left, codes, code + '0');
  generateHuffmanCodes(node.right, codes, code + '1');
}
