export class AudioContextManager {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;

  public async initialize(): Promise<void> {
    this.context = new AudioContext();
    await this.context.audioWorklet.addModule('TenutoProcessor.js');
    this.workletNode = new AudioWorkletNode(this.context, 'TenutoProcessor');
  }

  public allocateSharedMemory(size: number): void {
    if (!this.workletNode) {
      throw new Error('AudioWorkletNode is not initialized.');
    }
    const sharedBuffer = new SharedArrayBuffer(size);
    this.workletNode.port.postMessage({
      type: 'INIT_BUFFER',
      buffer: sharedBuffer,
    });
  }
}
