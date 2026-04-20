import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Mixer from '../src/components/Mixer';
import '@testing-library/jest-dom';

describe('TDB-531: Debounced Commits & Optimistic UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MUST NOT flood the history stack on continuous fader drags and MUST commit atomically onMouseUp', () => {
    const mockOnUpdate = vi.fn();
    const astState = { tracks: [{ id: 'vox', volume: 80, fx: [] }], meta: { sidechain: null } };
    
    render(<Mixer astState={astState} onUpdateAST={mockOnUpdate} />);
    
    const fader = screen.getByRole('slider');
    
    // Simulate a continuous sweeping drag (e.g., moving the mouse fast)
    fireEvent.change(fader, { target: { value: '85' } });
    fireEvent.change(fader, { target: { value: '90' } });
    fireEvent.change(fader, { target: { value: '95' } });
    
    // The fader visually reflects the optimistic state immediately
    expect(fader).toHaveValue('95');
    
    // Architectural Constraint: 
    // The compiler MUST NOT be flooded during the continuous visual sweep
    expect(mockOnUpdate).not.toHaveBeenCalled();
    
    // The user physically releases the mouse (commit)
    fireEvent.mouseUp(fader);
    
    // Exactly ONE atomic mutation is dispatched to the AST Command Manager
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    
    // Verify the payload contains the final resolved value
    const updatePayload = mockOnUpdate.mock.calls;
    expect(JSON.stringify(updatePayload)).toContain('95');
  });
});
