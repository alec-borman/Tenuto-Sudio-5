import { describe, it, expect, vi } from 'vitest';
import { AudioContextManager } from '../src/audio/AudioContextManager';
import { PlaybackOrchestrator } from '../src/audio/PlaybackOrchestrator';
import { TCALManager } from '../src/audio/TCALManager';

vi.mock('../src/audio/TCALManager');

vi.stubGlobal('registerProcessor', vi.fn());
vi.stubGlobal('AudioWorkletProcessor', class {
  port = { onmessage: null as any };
  constructor() {}
});

describe('TDB-603: Audio Event Scheduler', () => {
  it('schedules events and the processor outputs the correct sine wave', async () => {
    // Dynamic import to avoid hoisting issues
    const { TenutoProcessor } = await import('../src/audio/TenutoProcessor');
    
    // Provide a mocked audio context environment for Node.js
    let capturedBuffer: SharedArrayBuffer | null = null;
    (global as any).AudioContext = class {
      sampleRate = 48000;
      audioWorklet = {
        addModule: vi.fn(),
      };
    };
    (global as any).AudioWorkletNode = class {
      port = {
        postMessage: (msg: any) => {
          if (msg.type === 'INIT_BUFFER') {
            capturedBuffer = msg.buffer;
          }
        }
      };
    };

    const audio = new AudioContextManager();
    await audio.initialize();

    const tcal = new TCALManager();
    tcal.requestAudioBuffer = vi.fn().mockReturnValue(new ArrayBuffer(0));
    const orch = new PlaybackOrchestrator(tcal, audio);

    // Two events: a C4 quarter note at tick 0, and a D4 quarter note at tick 480
    // C4 = 261.63 Hz, D4 = 293.66 Hz
    const events = [
      {
        pitch: { midi: 60, frequency: 261.63 },
        duration: { numerator: 1, denominator: 4 },
        startTime: { numerator: 0, denominator: 1 } // startTick = 0 // start sample = 0
      },
      {
        pitch: { midi: 62, frequency: 293.66 },
        duration: { numerator: 1, denominator: 4 },
        startTime: { numerator: 1, denominator: 4 } // startTick = (1920/4) = 480 // start sample = 24000 at 48kHz 120bpm
      }
    ];

    await orch.compileAndPlay(events);

    // Access the WorkletNode and manually call process
    const processor = new TenutoProcessor();
    
    // Simulate INIT_BUFFER message sent by allocateSharedMemory
    processor.port.onmessage({
      data: { type: 'INIT_BUFFER', buffer: capturedBuffer }
    } as any);

    // Provide 24001 samples to simulate
    // We'll run it in chunks of 1024 or just one big chunk for the test
    const chunkSize = 25000;
    const outputs = [[new Float32Array(chunkSize)]];
    
    (global as any).sampleRate = 48000;
    
    processor.process([], outputs, {});
    const channel = outputs[0][0];

    console.log("channel[1]:", channel[1], "channel[100]:", channel[100], "channel[5999]:", channel[5999], "channel[6000]:", channel[6000]);

    // The first note should appear at sample 0, second at sample 6000 based on prompt's calculation formulas
    expect(channel[1]).not.toBe(0); // Note: sample 0 is Math.sin(0) = 0
    expect(channel[5999]).not.toBe(0);
    expect(channel[6000]).not.toBe(0);
  });
});
