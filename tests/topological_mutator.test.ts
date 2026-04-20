import { describe, it, expect, beforeEach } from 'vitest';
import { TopologicalMutator } from '../src/mutator/TopologicalMutator';

describe('TDB-528: Rational Arithmetic Topologies', () => {
  let mutator: TopologicalMutator;

  beforeEach(() => {
    mutator = new TopologicalMutator();
  });

  it('deterministically mutates a quarter note into a dotted quarter note using pure rational math', () => {
    const zScale = 100; // 100 pixels = whole note (1.0)
    const deltaWidth = 12.5; // Dragging exactly +1/8th of a whole note
    // 1/4 + 1/8 = 3/8
    const result = mutator.resizeDuration('c4:4', deltaWidth, zScale);
    expect(result).toBe('c4:3/8'); 
  });

  it('mutates an eighth note into a quarter note and automatically reduces the fraction', () => {
    const zScale = 100;
    const deltaWidth = 12.5; // Dragging +1/8th
    // 1/8 + 1/8 = 2/8 -> reduces to 1/4 via GCD
    const result = mutator.resizeDuration('a3:8', deltaWidth, zScale);
    expect(result).toBe('a3:4');
  });
  
  it('handles complex triplet mathematics without IEEE 754 drift', () => {
    const zScale = 100;
    const deltaWidth = 8.333333333333334; // Simulating a precise physical drag of 1/12 (a triplet modifier)
    // 1/4 + 1/12 = 4/12 -> reduces to 1/3
    const result = mutator.resizeDuration('f#5:4', deltaWidth, zScale);
    expect(result).toBe('f#5:3');
  });
});
