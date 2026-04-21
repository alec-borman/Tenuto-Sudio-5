import { describe, it, expect } from 'vitest';
import { DemarcationEngine } from '../src/export/DemarcationEngine';

describe('TDB-534: Visual-Acoustic Demarcation Pass', () => {
  const engine = new DemarcationEngine();

  it('MUST strip Unprintable Physics (micro-timing) to isolate the logical grid', () => {
    const rawEvents = [
      {
        pitch: { midi: 60 },
        duration: { numerator: 1, denominator: 4 },
        physics: { pullMs: 15, slice: 8 } // Unprintable DSP attributes
      }
    ];

    const printableAST = engine.pruneForExport(rawEvents, 'standard', false);

    // Architectural Constraint: Logical time and pitch must remain
    expect(printableAST[0].pitch.midi).toBe(60);
    expect(printableAST[0].duration.numerator).toBe(1);
    
    // Architectural Constraint: DSP Physics MUST be pruned
    expect(printableAST[0]).not.toHaveProperty('physics.pullMs');
    expect(printableAST[0]).not.toHaveProperty('physics.slice');
  });

  it('MUST implicitly mask style=concrete tracks unless overridden', () => {
    const concreteEvents = [
      { pitch: { midi: 60 }, duration: { numerator: 1, denominator: 4 } }
    ];

    // Standard behavior: Concrete tracks are not printed
    const maskedAST = engine.pruneForExport(concreteEvents, 'concrete', false);
    expect(maskedAST.length).toBe(0);

    // Override behavior: @print(true) forces Graphic Notation Fallback
    const overriddenAST = engine.pruneForExport(concreteEvents, 'concrete', true);
    expect(overriddenAST.length).toBe(1);
  });
});
