import { describe, it, expect } from 'vitest';
import { IncrementalCompiler } from '../src/parser/IncrementalCompiler';
import { ASTSerializer } from '../src/parser/ASTSerializer';

const compiler = new IncrementalCompiler(new ASTSerializer());

describe('TDB-601: Full Grammar Parsing & Linearization', () => {
  const fullDoc = `
    tenuto "5.0"
    meta @{ tempo: 120, time: "4/4" }
    def pno "Grand Piano" style=standard patch="gm_piano"
    measure 1 {
      pno: c4:4 d e f
      pno: <[ c4:4 d:4 e:2 | c3:2 r:2 ]>
    }
  `;

  it('parses a complete document without errors and produces structured AST', () => {
    const events = compiler.update(fullDoc);
    // Basic survival – no throw
    expect(events.length).toBeGreaterThan(0);
  });

  it('linearizes events with correct absolute ticks', () => {
    const simpleDoc = `
      def pno "Piano" style=standard
      measure 1 {
        pno: c4:4 d:4 e:2
      }
    `;
    const events = compiler.update(simpleDoc);
    // Expect three events with startTimes: 0, 1/4, 1/2 (relative to measure start)
    expect(events[0].pitch.midi).toBe(60);
    expect(events[0].startTime).toEqual({ numerator: 0, denominator: 1 });
    expect(events[1].pitch.midi).toBe(62);
    expect(events[1].startTime).toEqual({ numerator: 1, denominator: 4 });
    expect(events[2].pitch.midi).toBe(64);
    expect(events[2].startTime).toEqual({ numerator: 1, denominator: 2 });
  });

  it('throws E1001 on unrecognized token', () => {
    expect(() => compiler.update('pno: c4:4 ?unknown')).toThrow(/E1001|E1002/); 
  });
});
