import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SplitWorkspace from '../src/components/SplitWorkspace';
import { AudioContextManager } from '../src/audio/AudioContextManager';
import '@testing-library/jest-dom';

// Mock the AudioContextManager to track hardware initialization deterministically
const mockInitialize = vi.fn().mockResolvedValue(undefined);
vi.mock('../src/audio/AudioContextManager', () => {
  return {
    AudioContextManager: vi.fn().mockImplementation(function() { return {
      initialize: mockInitialize,
      allocateSharedMemory: vi.fn()
    }})
  };
});

// Mock surrounding heavy UI components
vi.mock('../src/components/WebGPUCanvas', () => ({ default: () => <div>Canvas</div> }));
vi.mock('../src/components/Inspector', () => ({ default: () => <div>Inspector</div> }));
vi.mock('../src/components/Mixer', () => ({ default: () => <div>Mixer</div> }));
vi.mock('../src/components/AICopilot', () => ({ default: () => <div>AICopilot</div> }));
vi.mock('../src/components/CodeEditor', () => ({ default: () => <div>CodeEditor</div> }));
describe('TDB-524: The Transport Matrix & Audio Context Binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Must render the Transport bar and respond to the Spacebar toggle', async () => {
    render(<SplitWorkspace />);
    
    // Verify the Transport bar is mounted with a Play button
    const playBtn = screen.getByRole('button', { name: /Play/i });
    expect(playBtn).toBeInTheDocument();

    // Trigger playback via the Spacebar (Keyboard Supremacy Matrix)
    fireEvent.keyDown(window, { code: 'Space' });

    // The system must initialize the AudioContextManager securely
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled();
    });

    // The UI must reflect the playing state
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  });
});
