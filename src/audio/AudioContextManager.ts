export class AudioContextManager {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;

  public async initialize(): Promise<void> {
    this.context = new AudioContext();
    await this.context.audioWorklet.addModule('TenutoProcessor.js');
    this.workletNode = new AudioWorkletNode(this.context, 'TenutoProcessor');
  }

  public get sampleRate(): number {
    return this.context?.sampleRate || 48000;
  }

  public allocateSharedMemory(numEvents: number): SharedArrayBuffer {
    const totalBytes = 8 + numEvents * 32; // 8 bytes for header alignment
    const sharedBuffer = new SharedArrayBuffer(totalBytes);
    if (this.workletNode) {
      this.workletNode.port.postMessage({
        type: 'INIT_BUFFER',
        buffer: sharedBuffer,
      });
    }
    return sharedBuffer;
  }
}
