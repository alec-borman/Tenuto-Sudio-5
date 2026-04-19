import { describe, it, expect } from 'vitest';
import { calculateProjectionCoordinates } from '../src/components/WebGPUCanvas';

describe('TDB-508: WebGPU AST Projection Mapping', () => {
  it('mathematically maps AtomicEvent IR to X/Y screen coordinates', () => {
    const zScale = 100; // 100 pixels per whole note
    const rowHeight = 10; // 10 pixels per semitone

    // C4 (MIDI 60), 1/4 note duration, starting at tick 0
    const event1 = {
      pitch: { midi: 60, frequency: 261.63 },
      duration: { numerator: 1, denominator: 4 }
    };
    const startTime1 = { numerator: 0, denominator: 1 };

    const coords1 = calculateProjectionCoordinates(event1, startTime1, zScale, rowHeight);
    
    // X = 0 * 100 = 0
    expect(coords1.x).toBe(0);
    // Y = (127 - 60) * 10 = 670
    expect(coords1.y).toBe(670);
    // Width = (1/4) * 100 = 25
    expect(coords1.width).toBe(25);

    // E4 (MIDI 64), 1/8 note duration, starting at 1/4
    const event2 = {
      pitch: { midi: 64, frequency: 329.63 },
      duration: { numerator: 1, denominator: 8 }
    };
    const startTime2 = { numerator: 1, denominator: 4 };

    const coords2 = calculateProjectionCoordinates(event2, startTime2, zScale, rowHeight);
    
    // Starts exactly where event1 ends (1/4 * 100 = 25)
    expect(coords2.x).toBe(25); 
    // (127 - 64) * 10 = 630
    expect(coords2.y).toBe(630); 
    // Width = (1/8) * 100 = 12.5
    expect(coords2.width).toBe(12.5); 
  });
});
