export interface TemporalResult {
  numerator: number;
  denominator: number;
  isGrace?: boolean;
}

export class TemporalEngine {
  public parseDuration(token: string): TemporalResult {
    if (token === ':grace') {
      return { numerator: 0, denominator: 1, isGrace: true };
    }

    const match = token.match(/^:([0-9]+)(\.?)$/);
    
    if (!match) {
      throw new Error(`Invalid duration token: ${token}`);
    }

    const baseDenominator = parseInt(match[1], 10);
    const isDotted = match[2] === '.';

    if (isDotted) {
      return { numerator: 3, denominator: baseDenominator * 2 };
    } else {
      return { numerator: 1, denominator: baseDenominator };
    }
  }
}
