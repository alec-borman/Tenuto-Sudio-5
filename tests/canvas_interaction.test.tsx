import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebGPUCanvas from '../src/components/WebGPUCanvas';
import * as PIXI from 'pixi.js';

// Mock PIXI to capture event listener attachments
const mockOn = vi.fn();
const mockRoundRect = vi.fn().mockReturnThis();
const mockFill = vi.fn().mockReturnThis();

vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(function() { return {
    init: vi.fn().mockResolvedValue(true),
    canvas: document.createElement('canvas'),
    stage: { removeChildren: vi.fn(), addChild: vi.fn() },
    destroy: vi.fn(),
  }}),
  Graphics: vi.fn().mockImplementation(function() { return {
    roundRect: mockRoundRect,
    fill: mockFill,
    on: mockOn,
    clear: vi.fn().mockReturnThis(),
    eventMode: 'none',
    cursor: 'default'
  }}),
}));

describe('TDB-518: Canvas Interaction & Topological Mutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must attach pointer interaction events to the projected AST graphics', async () => {
    const mockEvents = [
      { pitch: { midi: 60 }, duration: { numerator: 1, denominator: 4 }, startTime: { numerator: 0, denominator: 4 }, rawToken: 'c4:4' }
    ];
    
    render(<WebGPUCanvas events={mockEvents} onMutation={vi.fn()} />);

    // Defer to macro-task queue to allow PIXI async init to resolve
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify pointer events were mapped to the object
    expect(mockOn).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('globalpointermove', expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });
});
