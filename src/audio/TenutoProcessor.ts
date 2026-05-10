// @ts-nocheck
export class TenutoProcessor extends AudioWorkletProcessor {
  private sharedBuffer: SharedArrayBuffer | null = null;
  private headerView: Uint32Array | null = null;
  private eventsView: Float64Array | null = null;
  private phase: number = 0.0;
  private readIndex: number = 0;
  private currentSample: number = 0;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'INIT_BUFFER') {
        this.sharedBuffer = event.data.buffer;
        this.headerView = new Uint32Array(this.sharedBuffer, 0, 1);
        this.eventsView = new Float64Array(this.sharedBuffer, 8); // 8-byte alignment
        
        this.readIndex = 0;
        this.currentSample = 0;
        this.phase = 0.0;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0];
    if (!output || !this.headerView || !this.eventsView) return true;

    // Read the write index 
    const numEvents = Atomics.load(this.headerView, 0);
    const rate = typeof sampleRate !== 'undefined' ? sampleRate : 48000;

    for (let i = 0; i < output[0].length; i++) {
        let sampleVal = 0.0;
        let activeFreq = 0.0;
        
        for (let e = this.readIndex; e < numEvents; e++) {
            const startSample = this.eventsView[e * 4];
            const durationSamples = this.eventsView[e * 4 + 1];
            const frequency = this.eventsView[e * 4 + 2];
            const velocity = this.eventsView[e * 4 + 3];

            const endSample = startSample + durationSamples;

            if (this.currentSample >= startSample && this.currentSample <= endSample) {
                activeFreq = frequency;
                sampleVal += Math.sin(this.phase) * velocity;
            }
            
            if (e === this.readIndex && this.currentSample > endSample) {
                this.readIndex++;
            }
        }
        
        if (activeFreq > 0) {
            this.phase += (2 * Math.PI * activeFreq) / rate;
            if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
        }

        for (let channel = 0; channel < output.length; channel++) {
            output[channel][i] = sampleVal;
        }

        this.currentSample++;
    }

    return true; 
  }
}

registerProcessor('TenutoProcessor', TenutoProcessor);
