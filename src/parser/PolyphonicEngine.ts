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
  autoPadVoices?: boolean;
}

export class PolyphonicEngine {
  constructor(private __baseSerializer?: ASTSerializer) {}

  public parseVoices(voices: string[][], options?: PolyphonicOptions): PolyphonicResult {
    const resultVoices: VoiceResult[] = [];
    let maxDuration = 0;

    // Pass 1: Parse and structurally evaluate max bounding volume metrics
    for (const voiceTokens of voices) {
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

      if (totalVoiceDuration > maxDuration) {
          maxDuration = totalVoiceDuration;
      }

      resultVoices.push({
        events,
        totalDuration: totalVoiceDuration
      });
    }

    // Pass 2: Strict Mode Sync Evaluation and Boundary Padding
    if (options?.strict) {
      for (const voice of resultVoices) {
        const diff = maxDuration - voice.totalDuration;
        
        if (diff > 1e-9) { 
          if (options.autoPadVoices) {
            // Dynamically inject Rest Token matching fractional delta natively satisfying strict metrics
            let bestNum = 1;
            let bestDen = 1;
            let minError = Infinity;

            for (let den = 1; den <= 256; den++) {
              const num = Math.round(diff * den);
              const error = Math.abs(diff - (num / den));
              if (error < minError) {
                minError = error;
                bestNum = num;
                bestDen = den;
              }
            }
            
            voice.events.push({
              pitch: { midi: 0, frequency: 0 },
              duration: { numerator: bestNum, denominator: bestDen },
              rawToken: `r:${bestDen}`
            } as AtomicEvent);

            voice.totalDuration = maxDuration;
          } else {
             throw new Error('E3002: Voice Sync Failure. Parallel voices must have identical durations in strict mode.');
          }
        }
      }
    }

    return { 
      voices: Object.assign(resultVoices, { totalDuration: maxDuration })
    } as any;
  }
}
