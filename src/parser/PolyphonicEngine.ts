import { ASTSerializer, AtomicEvent } from './ASTSerializer';

export interface VoiceResult {
  events: AtomicEvent[];
  totalDuration: number;
}

export interface PolyphonicResult {
  voices: VoiceResult[];
}

export interface PolyphonicOptions {
  strict?: boolean;
}

export class PolyphonicEngine {
  constructor(private __baseSerializer?: ASTSerializer) {}

  public parseVoices(voices: string[][], options?: PolyphonicOptions): PolyphonicResult {
    const resultVoices: VoiceResult[] = [];
    let initialDuration: number | null = null;

    for (const voiceTokens of voices) {
      // 1. State Sandboxing: Spin up a completely isolated serializer instance per voice
      const localSerializer = new ASTSerializer();
      const events: AtomicEvent[] = [];
      let totalVoiceDuration = 0;

      for (const token of voiceTokens) {
        const event = localSerializer.parseToken(token);
        events.push(event);

        if (!event.duration.isGrace) {
          totalVoiceDuration += event.duration.numerator / event.duration.denominator;
        }
      }

      resultVoices.push({
        events,
        totalDuration: totalVoiceDuration
      });

      // 2. Strict Mode Constraints
      if (options?.strict) {
        if (initialDuration === null) {
          initialDuration = totalVoiceDuration;
        } else if (Math.abs(initialDuration - totalVoiceDuration) > 1e-9) { // Floating point safety gap
          throw new Error('E3002: Voice Sync Failure. Parallel voices must have identical durations in strict mode.');
        }
      }
    }

    // Attach length directly to voices array for legacy test compatibility mapping
    return { 
      voices: Object.assign(resultVoices, { totalDuration: resultVoices[0]?.totalDuration || 0 })
    } as any;
  }
}
