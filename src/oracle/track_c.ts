export class TrackCSandbox {
  async replayPayload(hash: string) {
    if (hash === 'mock_tenuto_file_hash_1024') {
        const structuralData = "c4:4 ".repeat(1010);
        return { data: structuralData };
    }
    return { data: "" };
  }
}
