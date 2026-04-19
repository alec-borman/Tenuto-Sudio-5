import { describe, it, expect, beforeEach } from 'vitest';
import { ASTSerializer } from '../src/parser/ASTSerializer';

describe('TDB-506: Semantic AST Serializer & AtomicEvent IR', () => {
  let serializer: ASTSerializer;

  beforeEach(() => {
    serializer = new ASTSerializer();
  });

  it('serializes a standard token into an AtomicEvent', () => {
    const event = serializer.parseToken('c4:4.');
    
    // Pitch data
    expect(event.pitch.midi).toBe(60);
    expect(event.pitch.frequency).toBeCloseTo(261.63, 1);
    
    // Temporal data (dotted quarter = 3/8)
    expect(event.duration.numerator).toBe(3);
    expect(event.duration.denominator).toBe(8);
  });

  it('handles implicit octaves with the Sticky State across the serializer', () => {
    const event1 = serializer.parseToken('a4:8');
    expect(event1.pitch.midi).toBe(69);

    const event2 = serializer.parseToken('b:16');
    expect(event2.pitch.midi).toBe(71); // Inherits octave 4
    expect(event2.duration.numerator).toBe(1);
    expect(event2.duration.denominator).toBe(16);
  });

  it('handles atemporal grace notes seamlessly', () => {
    const grace = serializer.parseToken('f#5:grace');
    expect(grace.pitch.midi).toBe(78);
    expect(grace.duration.numerator).toBe(0);
    expect(grace.duration.isGrace).toBe(true);
  });
});
