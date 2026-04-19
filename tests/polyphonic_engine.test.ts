import { describe, it, expect, beforeEach } from 'vitest';
import { PolyphonicEngine } from '../src/parser/PolyphonicEngine';
import { ASTSerializer } from '../src/parser/ASTSerializer';

describe('TDB-507: Polyphonic Engine & Voice Isolation', () => {
  let engine: PolyphonicEngine;
  let serializer: ASTSerializer;

  beforeEach(() => {
    serializer = new ASTSerializer();
    engine = new PolyphonicEngine(serializer);
  });

  it('evaluates parallel voices and calculates total rational durations', () => {
    const voices = [
      ['c4:4', 'd:4', 'e:2'], // Total: 1/4 + 1/4 + 1/2 = 1
      ['c3:1'] // Total: 1
    ];

    const result = engine.parseVoices(voices);
    expect(result.voices.length).toBe(2);
    expect((result.voices as any).totalDuration).toBe(1);
    expect(result.voices[1].totalDuration).toBe(1);
  });

  it('throws VoiceSyncError (E3002) in strict mode if durations mismatch', () => {
    const mismatchVoices = [
      ['c4:4', 'd:4', 'e:2'], // Total: 1
      ['c3:2'] // Total: 1/2
    ];

    expect(() => engine.parseVoices(mismatchVoices, { strict: true })).toThrowError(/E3002: Voice Sync Failure/);
  });

  it('isolates Sticky State between parallel voices', () => {
    const voices = [
      ['c4:4', 'e:4'], // Inherits octave 4
      ['c3:4', 'g:4']  // Inherits octave 3
    ];
    
    const result = engine.parseVoices(voices);
    // Verify voice 0 inherited octave 4
    expect(result.voices[0].events[1].pitch.midi).toBe(64); // E4
    // Verify voice 1 isolated its sticky state and inherited octave 3
    expect(result.voices[1].events[1].pitch.midi).toBe(55); // G3
  });
});
