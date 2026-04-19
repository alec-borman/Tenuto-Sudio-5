import { PitchEngine, PitchResult } from './PitchEngine';
import { TemporalEngine, TemporalResult } from './TemporalEngine';

export interface AtomicEvent {
  pitch: PitchResult;
  duration: TemporalResult;
}

export class ASTSerializer {
  private pitchEngine: PitchEngine;
  private temporalEngine: TemporalEngine;

  constructor() {
    this.pitchEngine = new PitchEngine();
    this.temporalEngine = new TemporalEngine();
  }

  public parseToken(token: string): AtomicEvent {
    const [pitchStr, durationRawStr] = token.split(':');
    
    if (durationRawStr === undefined) {
      throw new Error(`Invalid token format, missing duration: ${token}`);
    }
    
    const durationStr = ':' + durationRawStr;

    const pitch = this.pitchEngine.parsePitch(pitchStr);
    const duration = this.temporalEngine.parseDuration(durationStr);

    return { pitch, duration };
  }
}
