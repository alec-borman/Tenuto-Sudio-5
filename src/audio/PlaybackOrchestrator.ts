import { TCALManager } from './TCALManager';
import { AudioContextManager } from './AudioContextManager';

export class PlaybackOrchestrator {
  constructor(
    private tcal: TCALManager,
    private audioCtx: AudioContextManager
  ) {}

  public async compileAndPlay(compiledEvents: any[]): Promise<void> {
    if (!compiledEvents || compiledEvents.length === 0) return;

    const validEvents = [];
    const sampleRate = this.audioCtx.sampleRate;
    const tempo = 120;
    const ticksPerSecond = 1920 * (tempo / 60);

    for (const atomicEvent of compiledEvents) {
      if (atomicEvent.pitch.midi === null) continue; // Rest event

      const num = atomicEvent.startTime.numerator * 1920;
      const den = atomicEvent.startTime.denominator;
      
      if (num % den === 0) {
        const startTick = num / den;
        validEvents.push({ startTick, atomicEvent });
        await this.tcal.requestAudioBuffer('salamander_grand', atomicEvent.pitch.midi);
      } else {
        console.warn(`[PlaybackOrchestrator] Non‑exact tick for event ${atomicEvent.rawToken || JSON.stringify(atomicEvent)}; deferring to scheduler.`);
      }
    }

    if (validEvents.length > 255) {
      throw new Error("Exceeded maximum of 255 events.");
    }

    const buffer = this.audioCtx.allocateSharedMemory(validEvents.length);
    const writeIndexView = new Uint32Array(buffer, 0, 1);
    const eventsView = new Float64Array(buffer, 8); // 8-byte alignment offset

    let enqueued = 0;
    for (const { startTick, atomicEvent } of validEvents) {
      const startSample = sampleRate * (startTick / ticksPerSecond);
      
      const durNum = atomicEvent.duration.numerator * 1920;
      const durDen = atomicEvent.duration.denominator;
      const durationSamples = sampleRate * ((durNum / durDen) / ticksPerSecond);

      const offset = enqueued * 4;
      eventsView[offset] = startSample;
      eventsView[offset + 1] = durationSamples;
      eventsView[offset + 2] = atomicEvent.pitch.frequency;
      eventsView[offset + 3] = 1.0; // velocity
      
      enqueued++;
    }

    Atomics.store(writeIndexView, 0, enqueued);
  }
}
