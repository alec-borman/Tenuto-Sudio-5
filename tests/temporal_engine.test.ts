import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalEngine } from '../src/parser/TemporalEngine';

describe('TDB-505: Temporal Engine & Rational Time', () => {
  let engine: TemporalEngine;

  beforeEach(() => {
    engine = new TemporalEngine();
  });

  it('parses base durations into exact rational fractions', () => {
    const quarter = engine.parseDuration(':4');
    expect(quarter).toEqual(expect.objectContaining({ numerator: 1, denominator: 4 }));

    const sixteenth = engine.parseDuration(':16');
    expect(sixteenth).toEqual(expect.objectContaining({ numerator: 1, denominator: 16 }));
  });

  it('correctly calculates augmented dotted notes', () => {
    // A dotted quarter note is 1/4 + 1/8 = 3/8
    const dottedQuarter = engine.parseDuration(':4.');
    expect(dottedQuarter).toEqual(expect.objectContaining({ numerator: 3, denominator: 8 }));
    
    // A dotted eighth note is 1/8 + 1/16 = 3/16
    const dottedEighth = engine.parseDuration(':8.');
    expect(dottedEighth).toEqual(expect.objectContaining({ numerator: 3, denominator: 16 }));
  });

  it('identifies atemporal grace notes with zero metric capacity', () => {
    const graceNote = engine.parseDuration(':grace');
    expect(graceNote).toEqual(expect.objectContaining({ numerator: 0, denominator: 1, isGrace: true }));
  });
});
