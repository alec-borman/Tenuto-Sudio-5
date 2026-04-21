import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanceDBOrchestrator } from '../src/ai/LanceDBOrchestrator';
import { ASTCommand } from '../src/commands/ASTCommand';

// Mock LanceDB to prevent actual WASM/file-system operations during isolated testing
vi.mock('@lancedb/lancedb', () => ({
  connect: vi.fn().mockResolvedValue({
    openTable: vi.fn().mockResolvedValue({
      search: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{ text: 'mock tenuto documentation' }])
    })
  })
}));

describe('TDB-515: The LanceDB Orchestrator & Ghost Patching', () => {
  let orchestrator: LanceDBOrchestrator;

  beforeEach(() => {
    orchestrator = new LanceDBOrchestrator();
  });

  it('Must package user prompts with the active AST selection and LanceDB context', async () => {
    const payload = await orchestrator.queryContext('Refactor to Euclidean', 'c4:4 d e');
    expect(payload).toContain('Refactor to Euclidean');
    expect(payload).toContain('c4:4 d e');
    expect(payload).toContain('mock tenuto documentation');
  });

  it('Must generate a temporary ghost patch IR without mutating the root text', () => {
    const ghostAST = orchestrator.applyGhostPatch('c4:4 d e', 'c4:8 d:8 e:4');
    expect(ghostAST.isTemporary).toBe(true);
    expect(ghostAST.prospectiveText).toBe('c4:8 d:8 e:4');
  });

  it('Must solidify a ghost patch into an actionable ASTCommand upon acceptance', () => {
    const command = orchestrator.commitPatch('c4:8 d:8 e:4');
    expect(command).toBeInstanceOf(ASTCommand);
    expect((command as ASTCommand).payload).toBe('c4:8 d:8 e:4');
  });
});
