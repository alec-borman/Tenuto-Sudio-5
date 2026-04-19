import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Inspector from '../src/components/Inspector';
import '@testing-library/jest-dom';
import React from 'react';

describe('TDB-503: Context Inspector Topography', () => {
  const mockSelection = {
    type: 'PitchLit',
    duration: '1/4',
    velocity: 80,
    line: 1,
    col: 5
  };

  it('renders the deterministic input fields based on selection', () => {
    render(<Inspector selection={mockSelection} onUpdate={vi.fn()} />);
    
    // Verify Duration Dropdown
    const durationSelect = screen.getByRole('combobox', { name: /duration/i });
    expect(durationSelect).toBeInTheDocument();
    expect(durationSelect).toHaveValue('1/4');

    // Verify Velocity Slider
    const velocitySlider = screen.getByRole('slider', { name: /velocity/i });
    expect(velocitySlider).toBeInTheDocument();
    expect(velocitySlider).toHaveValue('80');
    
    // Verify AST Origin Footer
    const astFooter = screen.getByText(/Line: 1, Col: 5/i);
    expect(astFooter).toBeInTheDocument();
  });

  it('fires deterministic updates when interacted with', () => {
    const mockOnUpdate = vi.fn();
    render(<Inspector selection={mockSelection} onUpdate={mockOnUpdate} />);
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i });
    fireEvent.change(durationSelect, { target: { value: '1/8' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      duration: '1/8'
    }));
  });
});
