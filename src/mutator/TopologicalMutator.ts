import { TemporalEngine } from '../parser/TemporalEngine';

export class TopologicalMutator {
  private temporalEngine: TemporalEngine;

  constructor() {
    this.temporalEngine = new TemporalEngine();
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  private approximateFraction(val: number, maxDenominator: number = 128) {
    let bestNum = 1;
    let bestDen = 1;
    let minError = Infinity;

    for (let den = 1; den <= maxDenominator; den++) {
      const num = Math.round(val * den);
      const error = Math.abs(val - (num / den));
      if (error < minError) {
        minError = error;
        bestNum = num;
        bestDen = den;
      }
    }
    return { numerator: bestNum, denominator: bestDen };
  }

  public resizeDuration(rawToken: string, deltaWidth: number, zScale: number): string {
    const [pitchStr, durationRawStr] = rawToken.split(':');
    
    if (!durationRawStr) {
      throw new Error(`Invalid token format, missing duration: ${rawToken}`);
    }

    const { numerator: N1, denominator: D1 } = this.temporalEngine.parseDuration(':' + durationRawStr);

    const dragRatio = deltaWidth / zScale;
    const { numerator: N2, denominator: D2 } = this.approximateFraction(dragRatio, 128);

    let newNum = (N1 * D2) + (N2 * D1);
    let newDen = (D1 * D2);

    const divisor = this.gcd(Math.abs(newNum), Math.abs(newDen));
    newNum /= divisor;
    newDen /= divisor;

    let newDurationSignature = '';
    if (newNum === 1) {
      newDurationSignature = `:${newDen}`;
    } else {
      newDurationSignature = `:${newNum}/${newDen}`;
    }

    return `${pitchStr}${newDurationSignature}`;
  }
}
