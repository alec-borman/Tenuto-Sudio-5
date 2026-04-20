import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebGPUCanvas from '../src/components/WebGPUCanvas';
import * as PIXI from 'pixi.js';

// Spy on the Graphics constructor to track object allocations
const graphicsSpy = vi.fn().mockImplementation(() => ({
  roundRect: vi.fn().mockReturnThis(),
  fill: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  eventMode: 'none',
  cursor: 'default',
  visible: true,
  x: 0,
  y: 0,
  width: 0,
}));

vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(function() {
    return {
      init: vi.fn().mockResolvedValue(true),
      canvas: document.createElement('canvas'),
      stage: { removeChildren: vi.fn(), addChild: vi.fn(), children: [] },
      destroy: vi.fn(),
    }
  }),
  Graphics: function() { return graphicsSpy(); }
}));

describe('TDB-530: WebGPU Object Pooling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MUST recycle PIXI.Graphics geometry and prevent new allocations during re-renders', async () => {
    const eventsV1 = [
      { pitch: { midi: 60 }, duration: { numerator: 1, denominator: 4 }, startTime: { numerator: 0, denominator: 4 }, rawToken: 'c4:4' },
      { pitch: { midi: 62 }, duration: { numerator: 1, denominator: 4 }, startTime: { numerator: 1, denominator: 4 }, rawToken: 'd4:4' }
    ];

    const { rerender } = render(<WebGPUCanvas events={eventsV1} />);

    // Give PIXI time to mount and allocate the initial pool
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const initialAllocations = graphicsSpy.mock.calls.length;
    
    // The pool should have allocated at least the 2 objects we needed
    expect(initialAllocations).toBeGreaterThanOrEqual(2); 

    // Act: The user drags the second note to E4 (MIDI 64)
    const eventsV2 = [
      { pitch: { midi: 60 }, duration: { numerator: 1, denominator: 4 }, startTime: { numerator: 0, denominator: 4 }, rawToken: 'c4:4' },
      { pitch: { midi: 64 }, duration: { numerator: 1, denominator: 4 }, startTime: { numerator: 1, denominator: 4 }, rawToken: 'e4:4' } // Mutated
    ];

    rerender(<WebGPUCanvas events={eventsV2} />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const finalAllocations = graphicsSpy.mock.calls.length;

    // The Architectural Constraint: 
    // Zero new objects should be instantiated when simply mutating coordinates.
    // The Garbage Collector must remain completely dormant.
    expect(finalAllocations).toBe(initialAllocations);
  });
});
