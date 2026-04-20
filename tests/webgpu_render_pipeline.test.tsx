import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebGPUCanvas from '../src/components/WebGPUCanvas';

// Mock PIXI Application to test GPU instructions deterministically
const mockClear = vi.fn();
const mockAddChild = vi.fn();
const mockRoundRect = vi.fn().mockReturnThis();
const mockFill = vi.fn().mockReturnThis();
const mockOn = vi.fn().mockReturnThis();

vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(function() {
    return {
      init: vi.fn().mockResolvedValue(true),
      canvas: document.createElement('canvas'),
      stage: { removeChildren: mockClear, addChild: mockAddChild },
      destroy: vi.fn(),
    }
  }),
  Graphics: vi.fn().mockImplementation(function() {
    return {
      roundRect: mockRoundRect,
      fill: mockFill,
      on: mockOn,
      eventMode: 'none',
      cursor: 'default'
    }
  })
}));

describe('TDB-517: The Pixi.js Render Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must clear the GPU stage and map AST events to physical Pixi.js Graphics instructions', async () => {
    // Mock an AtomicEvent representing Middle C (MIDI 60) lasting 1/4 note
    const mockEvents = [
      { 
        pitch: { midi: 60, frequency: 261.63 }, 
        duration: { numerator: 1, denominator: 4 }, 
        startTime: { numerator: 0, denominator: 4 } 
      }
    ];

    render(<WebGPUCanvas events={mockEvents} />);

    // Defer to macro-task queue to allow PIXI async init to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    // Mathematical verification of the graphics pipeline
    expect(mockClear).toHaveBeenCalled();
    expect(mockRoundRect).toHaveBeenCalledWith(
      0,   // X: startTime 0 * 100
      670, // Y: (127 - 60) * 10
      25,  // Width: duration 1/4 * 100
      expect.any(Number), // Height
      expect.any(Number)  // Border Radius
    );
    expect(mockFill).toHaveBeenCalled();
    expect(mockAddChild).toHaveBeenCalled();
  });
});
