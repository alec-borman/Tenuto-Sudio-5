import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaybackOrchestrator } from '../src/audio/PlaybackOrchestrator';
import { TCALManager } from '../src/audio/TCALManager';
import { AudioContextManager } from '../src/audio/AudioContextManager';

vi.mock('../src/audio/TCALManager');
vi.mock('../src/audio/AudioContextManager');

describe('TDB-525: JIT Streaming & Audio Buffer Dispatch (Refactored)', () => {
  let orchestrator: PlaybackOrchestrator;
  let mockAudioCtx: any;
  let mockTcal: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioCtx = new AudioContextManager();
    mockTcal = new TCALManager();
    mockTcal.requestAudioBuffer.mockReturnValue(new ArrayBuffer(128));

    // The PlaybackOrchestrator constructor must be adjusted to not require ASTSerializer.
    // For this test, we use a minimal mock.
    orchestrator = new PlaybackOrchestrator(mockTcal, mockAudioCtx);
  });

  it('Must process linearized IR events, request TCAL buffers, and allocate Shared Memory', async () => {
    const mockEvents = [
      {
        pitch: { midi: 60, frequency: 261.63 },
        duration: { numerator: 1, denominator: 4 },
        startTime: { numerator: 0, denominator: 1 },
        rawToken: 'c4:4'
      }
    ];

    await orchestrator.compileAndPlay(mockEvents);

    expect(mockTcal.requestAudioBuffer).toHaveBeenCalledWith(expect.any(String), 60);
    expect(mockAudioCtx.allocateSharedMemory).toHaveBeenCalled();
  });

  it('Must skip events with non‑exact ticks and log a warning', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockEvents = [
      {
        pitch: { midi: 60, frequency: 261.63 },
        duration: { numerator: 1, denominator: 7 },
        startTime: { numerator: 1, denominator: 7 },
        rawToken: 'c4:7'
      }
    ];

    await orchestrator.compileAndPlay(mockEvents);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Non‑exact tick'));
    // TCAL should not be called for non‑exact events in this sprint
    expect(mockTcal.requestAudioBuffer).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });
});
