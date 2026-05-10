import { describe, it, expect } from 'vitest';
import { IncrementalCompiler } from '../src/parser/IncrementalCompiler';
import { ASTSerializer } from '../src/parser/ASTSerializer';

const compiler = new IncrementalCompiler(new ASTSerializer());

describe('TDB-602: Rational-Time Linearization', () => {
  it('assigns exact reduced rational startTimes without floating-point drift', () => {
    const source = `
      def pno "Piano" style=standard
      measure 1 {
        pno: c4:4 d:8 e:8 f:4
      }
    `;
    const events = compiler.update(source);
    expect(events).toHaveLength(4);

    expect(events[0].startTime).toEqual({ numerator: 0, denominator: 1 });
    expect(events[1].startTime).toEqual({ numerator: 1, denominator: 4 });
    expect(events[2].startTime).toEqual({ numerator: 3, denominator: 8 });
    expect(events[3].startTime).toEqual({ numerator: 1, denominator: 2 });

    for (const e of events) {
      expect(Number.isInteger(e.startTime.numerator)).toBe(true);
      expect(Number.isInteger(e.startTime.denominator)).toBe(true);
    }
  });

  it('handles denominators that are not factors of 1920 gracefully', () => {
    // Simulate an exotic n‑tuplet by manually inserting a non‑standard duration.
    // The linearization must still produce a reduced rational startTime,
    // and the orchestrator should not crash.
    const source = `
      def pno "Piano" style=standard
      measure 1 {
        pno: c4:7  %% septuplet whole note (denominator 7)
      }
    `;
    const events = compiler.update(source);
    expect(events.length).toBeGreaterThan(0);
    const start = events[0].startTime;
    expect(start.denominator).toBe(1); // first event always at 0/1
    // The septuplet event itself will have a duration of 1/7; its startTime should be rational
    // and the tick will be non‑exact.
  });
});
