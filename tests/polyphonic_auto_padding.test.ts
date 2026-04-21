import { describe, it, expect, beforeEach } from 'vitest';
import { PolyphonicEngine } from '../src/parser/PolyphonicEngine';
import { ASTSerializer } from '../src/parser/ASTSerializer';

describe('TDB-535: Generative Ergonomics & Polyphonic Auto-Padding', () => {
  let engine: PolyphonicEngine;
  let serializer: ASTSerializer;

  beforeEach(() => {
    serializer = new ASTSerializer();
    engine = new PolyphonicEngine(serializer);
  });

  it('MUST auto-pad shorter voices with terminal rests to prevent E3002 crashes', () => {
    const voices = [
      ['c4:4', 'd:4', 'e:2'], // Total Duration: 1
      ['c3:2']                // Total Duration: 1/2 (Missing 1/2)
    ];

    // Standard strict mode would normally throw E3002 here.
    // With autoPadVoices enabled, it must dynamically inject a 1/2 rest.
    const result = engine.parseVoices(voices, { strict: true, autoPadVoices: true });

    expect(result.voices.length).toBe(2);

    // Architectural Constraint 1: Total duration must now be mathematically identical
    expect((result.voices as any).totalDuration).toBe(1);
    expect(result.voices[1].totalDuration).toBe(1);

    // Architectural Constraint 2: The shorter voice MUST have received an injected rest event
    const paddedVoice = result.voices[1].events;
    expect(paddedVoice.length).toBe(2); // Originally 1 event, now 2
    
    // Validate the injected padding logic (the missing 1/2 duration)
    const injectedRest = paddedVoice[1];
    expect(injectedRest.duration.numerator).toBe(1);
    expect(injectedRest.duration.denominator).toBe(2);
  });
});
