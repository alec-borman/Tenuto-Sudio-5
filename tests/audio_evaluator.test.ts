import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioContextManager } from '../src/audio/AudioContextManager';

// Mock Web Audio API for deterministic JSDOM testing
const mockAudioWorkletAddModule = vi.fn().mockResolvedValue(undefined);
const mockPostMessage = vi.fn();

class MockAudioWorkletNode {
  port = { postMessage: mockPostMessage };
  connect = vi.fn();
}

global.AudioContext = vi.fn().mockImplementation(function() {
  return {
    audioWorklet: { addModule: mockAudioWorkletAddModule },
    state: 'suspended',
    resume: vi.fn().mockResolvedValue(undefined),
  };
}) as any;

global.AudioWorkletNode = MockAudioWorkletNode as any;
global.SharedArrayBuffer = vi.fn().mockImplementation(function(size) {
  return new ArrayBuffer(size as number);
}) as any;

describe('TDB-512: Web Audio / AudioWorklet Evaluator', () => {
  let audioManager: AudioContextManager;

  beforeEach(() => {
    vi.clearAllMocks();
    audioManager = new AudioContextManager();
  });

  it('Must instantiate an AudioContext and load the TenutoProcessor worklet', async () => {
    await audioManager.initialize();
    
    expect(global.AudioContext).toHaveBeenCalled();
    expect(mockAudioWorkletAddModule).toHaveBeenCalledWith(expect.stringContaining('TenutoProcessor'));
  });

  it('Must allocate a SharedArrayBuffer and transmit it to the AudioWorkletNode to bypass the React thread', async () => {
    await audioManager.initialize();
    audioManager.allocateSharedMemory(1024);
    
    expect(global.SharedArrayBuffer).toHaveBeenCalledWith(1024);
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INIT_BUFFER', buffer: expect.any(Object) })
    );
  });
});
