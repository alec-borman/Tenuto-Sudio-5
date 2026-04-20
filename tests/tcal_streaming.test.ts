import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TCALManager } from '../src/audio/TCALManager';
import { MicroSynth } from '../src/audio/MicroSynth';

// Mock global fetch for deterministic offline testing
global.fetch = vi.fn();

describe('TDB-513: TCAL & JIT Streaming Architecture', () => {
  let tcal: TCALManager;

  beforeEach(() => {
    vi.clearAllMocks();
    tcal = new TCALManager();
  });

  it('Must execute HTTP Range requests to stream specific sample byte-ranges', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      status: 206 // Partial Content
    });

    await tcal.fetchSampleRange('salamander_grand', { start: 0, end: 1024 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('salamander_grand'),
      expect.objectContaining({ headers: { Range: 'bytes=0-1024' } })
    );
  });

  it('Must fallback to the 10kb MicroSynth instantly if the sample buffer is pending', () => {
    // Requesting Middle C (MIDI 60) before any buffer has been loaded
    const fallback = tcal.requestAudioBuffer('salamander_grand', 60); 

    // Verify it mathematically guarantees playback by returning the synth
    expect(fallback).toBeInstanceOf(MicroSynth);
    expect((fallback as MicroSynth).frequency).toBeCloseTo(261.63, 1);
  });

  it('Must successfully resolve from cache if the buffer is fully loaded', () => {
    // Manually inject a dummy buffer into the cache
    const dummyBuffer = new ArrayBuffer(128);
    tcal.cache.set('salamander_grand_60', dummyBuffer);

    const result = tcal.requestAudioBuffer('salamander_grand', 60);
    expect(result).toBe(dummyBuffer);
  });
});
