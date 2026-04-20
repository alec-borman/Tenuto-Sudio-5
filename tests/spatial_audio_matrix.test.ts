import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialAudioMatrix } from '../src/audio/SpatialAudioMatrix';

describe('TDB-514: The Spatial Audio Matrix & DSP Routing', () => {
  let matrix: SpatialAudioMatrix;

  beforeEach(() => {
    matrix = new SpatialAudioMatrix();
  });

  it('Must securely register and retrieve isolated audio buses via bus:// URI', () => {
    matrix.createBus('bus://drum_group');
    const bus = matrix.getBus('bus://drum_group');
    expect(bus).toBeDefined();
    expect(bus!.id).toBe('bus://drum_group');
  });

  it('Must detect circular routing dependencies and throw E4001', () => {
    matrix.createBus('bus://a');
    matrix.createBus('bus://b');
    matrix.createBus('bus://c');
    
    // Valid routing A -> B -> C
    matrix.route('bus://a', 'bus://b');
    matrix.route('bus://b', 'bus://c');
    
    // Attempt to route C -> A (Creates a circular loop)
    expect(() => matrix.route('bus://c', 'bus://a')).toThrowError(/E4001: Circular Routing Detected/);
  });

  it('Must serialize .fx() AST blocks into deterministic DSP chain instructions', () => {
    const fxChain = matrix.parseFXChain('.fx(reverb, @{mix: 0.9, room: "hall"})');
    expect(fxChain.length).toBe(1);
    expect(fxChain.type).toBe('reverb');
    expect(fxChain.parameters.mix).toBe(0.9);
    expect(fxChain.parameters.room).toBe('hall');
  });
});
