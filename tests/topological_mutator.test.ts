import { describe, it, expect, beforeEach } from 'vitest';
import { TopologicalMutator } from '../src/mutator/TopologicalMutator';

describe('TDB-509: Topological Mutator & Bi-Directional Editing', () => {
  let mutator: TopologicalMutator;

  beforeEach(() => {
    mutator = new TopologicalMutator();
  });

  it('deterministically mutates a quarter note into a dotted quarter note based on pixel delta', () => {
    const zScale = 100; // 100 pixels = whole note (1.0)
    
    // Original token is a C4 Quarter Note (1/4 duration)
    // We drag the right edge of the UI block by +12.5 pixels (which equals +1/8 duration)
    // 1/4 + 1/8 = 3/8 duration. In Tenuto syntax, a 3/8 duration is a dotted quarter `:4.`
    const mutatedToken = mutator.resizeDuration('c4:4', 12.5, zScale);
    
    expect(mutatedToken).toBe('c4:4.');
  });

  it('mutates an eighth note into a quarter note', () => {
    const zScale = 100;
    
    // Start with 1/8 duration. Drag by +12.5px (+1/8 duration).
    // 1/8 + 1/8 = 1/4 duration. Token becomes `:4`.
    const mutatedToken = mutator.resizeDuration('e5:8', 12.5, zScale);
    
    expect(mutatedToken).toBe('e5:4');
  });
});
