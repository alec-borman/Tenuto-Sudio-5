export interface PitchResult {
  midi: number;
  frequency: number;
}

export class PitchEngine {
  private currentOctave: number = 4;

  private noteOffsets: Record<string, number> = {
    'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11
  };

  public parsePitch(token: string): PitchResult {
    const match = token.toLowerCase().match(/^([a-g])([#b]*)([0-9]*)$/);
    
    if (!match) {
      throw new Error(`Invalid PitchLit token: ${token}`);
    }

    const note = match[1];
    const accidentals = match[2];
    const octaveStr = match[3];

    if (octaveStr !== '') {
      this.currentOctave = parseInt(octaveStr, 10);
    }

    let offset = this.noteOffsets[note];
    
    for (const char of accidentals) {
      if (char === '#') offset += 1;
      if (char === 'b') offset -= 1;
    }

    const midi = (this.currentOctave + 1) * 12 + offset;
    const frequency = 440.0 * Math.pow(2, (midi - 69) / 12);

    return { midi, frequency };
  }
}
