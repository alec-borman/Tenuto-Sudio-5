import { describe, it, expect, beforeEach } from 'vitest';
import { NeuralSynthesisEngine } from '../src/ai/NeuralSynthesisEngine';

describe('TDB-516: Neural Acoustic Synthesis Hooks', () => {
  let engine: NeuralSynthesisEngine;

  beforeEach(() => {
    engine = new NeuralSynthesisEngine();
  });

  it('Must generate a secure API payload from a declarative prompt attribute', () => {
    const payload = engine.generatePayload('ai_choir', 'A haunting gregorian chant');
    
    expect(payload.trackId).toBe('ai_choir');
    expect(payload.prompt).toBe('A haunting gregorian chant');
    expect(payload.timestamp).toBeDefined();
  });

  it('Must deterministically map a returned audio buffer to a logical timeline tick', () => {
    // Mock an asynchronous Latent Diffusion audio buffer
    const mockBuffer = new ArrayBuffer(128);
    
    // Map the buffer to Measure 2, Beat 1 (assuming 1920 PPQ, so tick 1920)
    const mappedEvent = engine.mapBufferToTimeline(mockBuffer, 1920);

    expect(mappedEvent.buffer).toBe(mockBuffer);
    expect(mappedEvent.startTick).toBe(1920);
    expect(mappedEvent.isNeural).toBe(true);
  });
});
