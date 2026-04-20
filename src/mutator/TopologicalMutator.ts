import { TemporalEngine } from '../parser/TemporalEngine';

export class TopologicalMutator {
  private temporalEngine: TemporalEngine;

  constructor() {
    this.temporalEngine = new TemporalEngine();
  }

  public resizeDuration(rawToken: string, deltaWidth: number, zScale: number): string {
    const [pitchStr, durationRawStr] = rawToken.split(':');
    
    if (!durationRawStr) {
      throw new Error(`Invalid token format, missing duration: ${rawToken}`);
    }

    // 1. Calculate original rational duration
    const originalTemporal = this.temporalEngine.parseDuration(':' + durationRawStr);
    const originalFraction = originalTemporal.numerator / originalTemporal.denominator;

    // 2. Calculate fractional time added by the drag (ΔX / zScale)
    const addedFraction = deltaWidth / zScale;

    // 3. Accumulate complete logical capacity
    const newTotalFraction = originalFraction + addedFraction;

    // 4. Deterministic Translation to Syntax
    // Tenuto Standard Dotted Formats (assuming base power-of-2 structures):
    // 3/8 -> :4.
    // 3/16 -> :8.
    // 1/4 -> :4
    
    // Quick precision tolerance check to account for IEEE 754 floating-point drift
    const isClose = (val: number, target: number) => Math.abs(val - target) < 1e-6;

    let newDurationSignature = '';

    if (isClose(newTotalFraction, 1.0)) newDurationSignature = ':1';
    else if (isClose(newTotalFraction, 0.75)) newDurationSignature = ':2.';
    else if (isClose(newTotalFraction, 0.5)) newDurationSignature = ':2';
    else if (isClose(newTotalFraction, 0.375)) newDurationSignature = ':4.';
    else if (isClose(newTotalFraction, 0.25)) newDurationSignature = ':4';
    else if (isClose(newTotalFraction, 0.1875)) newDurationSignature = ':8.';
    else if (isClose(newTotalFraction, 0.125)) newDurationSignature = ':8';
    else if (isClose(newTotalFraction, 0.09375)) newDurationSignature = ':16.';
    else if (isClose(newTotalFraction, 0.0625)) newDurationSignature = ':16';
    else {
      // Fallback for irrational drifts (should not occur in snapped grids)
      throw new Error(`Unsupported irregular mathematical bounds for topological mutation: ${newTotalFraction}`);
    }

    return `${pitchStr}${newDurationSignature}`;
  }
}
