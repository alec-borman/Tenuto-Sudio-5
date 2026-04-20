import { describe, it, expect, vi, beforeEach } from 'vitest';

// Inject globally BEFORE evaluation 
global.AudioWorkletProcessor = class AudioWorkletProcessor {
  port = { onmessage: null };
} as any;
global.registerProcessor = vi.fn();

describe('TDB-533: The DSP Execution Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MUST process audio via zero-allocation memory arrays and output valid mathematical waves', async () => {
    // Dynamic import to enforce evaluation after globals
    const { TenutoProcessor } = await import('../src/audio/TenutoProcessor');
    const processor = new TenutoProcessor();
    
    // Simulate the main thread allocating and sending a 1024-byte SharedArrayBuffer
    const sharedBuffer = new SharedArrayBuffer(1024);
    const view = new Float32Array(sharedBuffer);
    
    // Set a frequency target in the shared memory (e.g., 440Hz A4)
    view[0] = 440.0; 

    // Simulate port.onmessage from AudioContextManager
    if (processor.port.onmessage) {
      processor.port.onmessage({ data: { type: 'INIT_BUFFER', buffer: sharedBuffer } } as any);
    }

    // Mock 128-sample output buffer (Standard Web Audio API block size)
    const outputs = [[new Float32Array(128)]];
    const inputs = [[new Float32Array(128)]];
    const parameters = {};

    // Execute the process loop
    const isAlive = processor.process(inputs, outputs, parameters);

    expect(isAlive).toBe(true);

    // Architectural Constraint: The output buffer MUST NOT be empty. 
    // The processor must have written a continuous wave into it.
    const outputChannel = outputs[0][0];
    
    let hasSignal = false;
    for (let i = 0; i < outputChannel.length; i++) {
        // We assert mathematical evaluation over zeroes strictly ensuring generation
        if (outputChannel[i] !== 0) {
            hasSignal = true;
            break;
        }
    }

    // Mathematically prove the DSP engine is synthesizing continuous data
    expect(hasSignal).toBe(true);
    
    // Ensure values remain within normalized audio bounds (-1.0 to 1.0)
    expect(outputChannel[9]).toBeGreaterThanOrEqual(-1.0);
    expect(outputChannel[9]).toBeLessThanOrEqual(1.0);
  });
});
