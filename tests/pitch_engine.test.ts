import { describe, it, expect, beforeEach } from 'vitest';
import { PitchEngine } from '../src/parser/PitchEngine';

describe('TDB-504: Pitch Engine & Sticky Octaves', () => {
  let engine: PitchEngine;

  beforeEach(() => {
    engine = new PitchEngine();
  });

  it('determines the correct MIDI and Frequency for A4', () => {
    const result = engine.parsePitch('a4');
    expect(result.midi).toBe(69);
    expect(result.frequency).toBeCloseTo(440.0, 2);
  });

  it('correctly handles accidentals (sharps and flats)', () => {
    const sharpResult = engine.parsePitch('c#4');
    expect(sharpResult.midi).toBe(61);
    
    const flatResult = engine.parsePitch('eb4');
    expect(flatResult.midi).toBe(63);
  });

  it('implements the Sticky Octave state machine', () => {
    const firstNote = engine.parsePitch('c4');
    expect(firstNote.midi).toBe(60); // C4
    
    // The next note 'd' lacks an explicit octave, so it must inherit octave 4
    const stickyNote = engine.parsePitch('d');
    expect(stickyNote.midi).toBe(62); // D4
    
    // Explicit override
    const overrideNote = engine.parsePitch('e5');
    expect(overrideNote.midi).toBe(76); // E5
    
    // Inherits the new octave 5
    const nextStickyNote = engine.parsePitch('f');
    expect(nextStickyNote.midi).toBe(77); // F5
  });
});
