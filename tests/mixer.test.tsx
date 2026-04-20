import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Mixer from '../src/components/Mixer';
import '@testing-library/jest-dom';

describe('TDB-511: The Stateless Mixer', () => {
  const mockASTState = {
    tracks: [
      { id: 'vox', volume: 100, fx: [] },
      { id: '808_Sub', volume: 80, fx: [] }
    ],
    meta: { sidechain: null }
  };

  it('renders volume faders that deterministically dispatch AST mutations', () => {
    const mockOnUpdate = vi.fn();
    render(<Mixer astState={mockASTState} onUpdateAST={mockOnUpdate} />);

    const voxFader = screen.getByRole('slider', { name: /vox volume/i });
    expect(voxFader).toBeInTheDocument();
    
    // Simulate moving the fader to 110
    fireEvent.change(voxFader, { target: { value: '110' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      trackId: 'vox',
      mutationType: 'VOLUME_UPDATE',
      value: 110,
      expectedSyntax: 'var vox_vol = 110' // or equivalent target string
    }));
  });

  it('dispatches AST mutations when an FX is added to the rack', () => {
    const mockOnUpdate = vi.fn();
    render(<Mixer astState={mockASTState} onUpdateAST={mockOnUpdate} />);

    const fxSelect = screen.getByRole('combobox', { name: /fx for vox/i });
    fireEvent.change(fxSelect, { target: { value: 'reverb' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      trackId: 'vox',
      mutationType: 'ADD_FX',
      fxType: 'reverb',
      expectedSyntax: '.fx(reverb, @{mix: 0.5})'
    }));
  });

  it('dispatches global meta block mutations for sidechain routing', () => {
    const mockOnUpdate = vi.fn();
    render(<Mixer astState={mockASTState} onUpdateAST={mockOnUpdate} />);

    const sidechainDropdown = screen.getByRole('combobox', { name: /808_Sub sidechain/i });
    fireEvent.change(sidechainDropdown, { target: { value: 'Drum_Bus' } });

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      mutationType: 'META_SIDECHAIN_UPDATE',
      source: 'Drum_Bus',
      target: '808_Sub',
      expectedSyntax: 'meta @{ sidechain: "Drum_Bus" }'
    }));
  });
});
