import { ASTSerializer } from '../parser/ASTSerializer';
import { TCALManager } from './TCALManager';
import { AudioContextManager } from './AudioContextManager';

export class PlaybackOrchestrator {
  constructor(
    private serializer: ASTSerializer,
    private tcal: TCALManager,
    private audioCtx: AudioContextManager
  ) {}

  public async compileAndPlay(sourceCode: string): Promise<void> {
    // 1. Primitive topological isolation removing definition label prefixing logically
    const eventsSequence = sourceCode.replace(/^[a-zA-Z_]+:\s*/, '').trim();
    
    // Fallback block skip 
    if (!eventsSequence) return;

    // Split discrete events logically matching deterministic parser spacing constraints
    const tokens = eventsSequence.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      // 2. Linear semantic token parsing iteration
      const atomicEvent = this.serializer.parseToken(token);

      // 3. JIT Asset streaming interpolation wrapper logic
      // Bypasses React main thread delays safely executing HTTP block requests
      await this.tcal.requestAudioBuffer('salamander_grand', atomicEvent.pitch.midi);
    }

    // 4. Matrix memory block registration bridging hardware layer rendering execution 
    this.audioCtx.allocateSharedMemory(1024);
  }
}
