import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CodeEditor from '../src/components/CodeEditor';
import '@testing-library/jest-dom';

// Mock Monaco Editor for deterministic JSDOM testing to avoid Web Worker crashes
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, defaultLanguage }: any) => (
      <textarea
        data-testid="monaco-mock"
        aria-label="Tenuto Source Editor"
        data-language={defaultLanguage}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  };
});

describe('TDB-532: The Monaco Editor Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MUST render the Monaco Editor component mapped to the Tenuto language', () => {
    render(<CodeEditor code="pno: c4:4" onChange={vi.fn()} />);
    
    const editor = screen.getByTestId('monaco-mock');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-language', 'tenuto');
    expect(editor).toHaveValue('pno: c4:4');
  });

  it('MUST trigger the onChange callback deterministically upon editor mutation', () => {
    const mockOnChange = vi.fn();
    render(<CodeEditor code="pno: c4:4" onChange={mockOnChange} />);
    
    const editor = screen.getByTestId('monaco-mock');

    // Simulate user typing in the Monaco instance
    fireEvent.change(editor, { target: { value: 'pno: c4:8' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('pno: c4:8');
  });
});
