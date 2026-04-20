import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AICopilot from '../src/components/AICopilot';
import { LanceDBOrchestrator } from '../src/ai/LanceDBOrchestrator';
import { ASTCommand } from '../src/commands/ASTCommand';
import '@testing-library/jest-dom';

describe('TDB-521: The LanceDB AI Copilot UI', () => {
  let mockOrchestrator: any;
  let mockOnCommit: any;

  beforeEach(() => {
    mockOnCommit = vi.fn();
    mockOrchestrator = {
      queryContext: vi.fn().mockResolvedValue('Mocked LLM Context'),
      applyGhostPatch: vi.fn().mockReturnValue({ isTemporary: true, prospectiveText: 'c4:8 d:8' }),
      commitPatch: vi.fn().mockReturnValue(new ASTCommand('c4:8 d:8')),
    };
  });

  it('Must accept user prompts, generate a ghost patch, and commit an ASTCommand', async () => {
    render(<AICopilot activeAST="c4:4" orchestrator={mockOrchestrator} onCommit={mockOnCommit} />);

    // 1. User types a prompt
    const input = screen.getByPlaceholderText(/Ask Tenuto AI.../i);
    fireEvent.change(input, { target: { value: 'Make it Euclidean' } });

    // 2. User clicks Generate
    const generateBtn = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateBtn);

    // 3. Verify orchestrator queried the vector DB
    await waitFor(() => {
      expect(mockOrchestrator.queryContext).toHaveBeenCalledWith('Make it Euclidean', 'c4:4');
      expect(mockOrchestrator.applyGhostPatch).toHaveBeenCalled();
    });

    // 4. Ghost patch review state should now be active
    const acceptBtn = screen.getByRole('button', { name: /Accept Patch/i });
    expect(acceptBtn).toBeInTheDocument();

    // 5. User accepts the patch
    fireEvent.click(acceptBtn);

    // 6. Verify the ASTCommand was dispatched to the parent workspace
    expect(mockOrchestrator.commitPatch).toHaveBeenCalled();
    expect(mockOnCommit).toHaveBeenCalledWith(expect.any(ASTCommand));
    expect(mockOnCommit.mock.calls[0][0].payload).toBe('c4:8 d:8');
  });
});
