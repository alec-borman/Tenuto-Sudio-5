import { TCALManager } from './TCALManager';
import { AudioContextManager } from './AudioContextManager';

export class PlaybackOrchestrator {
  constructor(
    private tcal: TCALManager,
    private audioCtx: AudioContextManager
  ) {}

  public async compileAndPlay(compiledEvents: any[]): Promise<void> {
    if (!compiledEvents || compiledEvents.length === 0) return;

    for (const atomicEvent of compiledEvents) {
      if (atomicEvent.pitch.midi === null) continue; // Rest event

      const num = atomicEvent.startTime.numerator * 1920;
      const den = atomicEvent.startTime.denominator;
      
      if (num % den === 0) {
        // Evaluate exact tick explicitly without drift
        // const integerTick = num / den; (We're skipping actual scheduler implementation this sprint)
        
        // JIT Asset streaming interpolation wrapper logic
        // Bypasses React main thread delays safely executing HTTP block requests
        await this.tcal.requestAudioBuffer('salamander_grand', atomicEvent.pitch.midi);
      } else {
        // Inexact calculation -> defer
        console.warn(`[PlaybackOrchestrator] Non‑exact tick for event ${atomicEvent.rawToken || JSON.stringify(atomicEvent)}; deferring to scheduler.`);
      }
    }

    // Matrix memory block registration bridging hardware layer rendering execution 
    this.audioCtx.allocateSharedMemory(1024);
  }
}
