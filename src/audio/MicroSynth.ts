export class MicroSynth {
  public readonly midiNote: number;
  public readonly frequency: number;

  constructor(midiNote: number) {
    this.midiNote = midiNote;
    this.frequency = 440.0 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Future hook to execute programmatic 10kb fallback wave generation within processor
  generateBasicWaveform(): void {
    // Pure mathematical sine/triangle evaluation
  }
}
