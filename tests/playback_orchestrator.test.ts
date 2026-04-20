import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaybackOrchestrator } from '../src/audio/PlaybackOrchestrator';
import { TCALManager } from '../src/audio/TCALManager';
import { AudioContextManager } from '../src/audio/AudioContextManager';
import { ASTSerializer } from '../src/parser/ASTSerializer';

// Mock dependencies to isolate Orchestrator logic
vi.mock('../src/audio/TCALManager');
vi.mock('../src/audio/AudioContextManager');
vi.mock('../src/parser/ASTSerializer');

describe('TDB-525: JIT Streaming & Audio Buffer Dispatch', () => {
  let orchestrator: PlaybackOrchestrator;
  let mockAudioCtx: any;
  let mockTcal: any;
  let mockSerializer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioCtx = new AudioContextManager();
    mockTcal = new TCALManager();
    mockSerializer = new ASTSerializer();
    
    // Simulate AST returning a single Middle C event
    mockSerializer.parseToken.mockReturnValue({
      pitch: { midi: 60, frequency: 261.63 },
      duration: { numerator: 1, denominator: 4 }
    });
    
    mockTcal.requestAudioBuffer.mockReturnValue(new ArrayBuffer(128));
    
    orchestrator = new PlaybackOrchestrator(mockSerializer, mockTcal, mockAudioCtx);
  });

  it('Must parse source code, request TCAL buffers, and allocate Shared Memory', async () => {
    const rawCode = "pno: c4:4";
    
    await orchestrator.compileAndPlay(rawCode);

    // 1. Verify AST compilation
    expect(mockSerializer.parseToken).toHaveBeenCalledWith('c4:4');
    
    // 2. Verify JIT Streaming Interrogation
    expect(mockTcal.requestAudioBuffer).toHaveBeenCalledWith(expect.any(String), 60);
    
    // 3. Verify Hardware Dispatch
    expect(mockAudioCtx.allocateSharedMemory).toHaveBeenCalled();
  });
});
