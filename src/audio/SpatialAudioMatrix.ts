export interface AudioBus {
  id: string;
  targets: string[];
}

export interface FXChainInstruction {
  type: string;
  parameters: Record<string, any>;
  length: number;
}

export class SpatialAudioMatrix {
  private buses: Map<string, AudioBus> = new Map();

  public createBus(id: string): void {
    if (!id.startsWith('bus://')) {
      throw new Error(`Invalid bus URI schema: ${id}. Must prepend with bus://`);
    }
    if (!this.buses.has(id)) {
      this.buses.set(id, { id, targets: [] });
    }
  }

  public getBus(id: string): AudioBus | undefined {
    return this.buses.get(id);
  }

  public route(sourceId: string, targetId: string): void {
    const source = this.buses.get(sourceId);
    const target = this.buses.get(targetId);

    if (!source || !target) {
      throw new Error('Routing missing registered valid origin or target vertex.');
    }

    // Speculative insertion to assess recursive cycles via Topo-DFS
    source.targets.push(targetId);

    if (this.detectCycle()) {
      // Revert if cycle breaks determinism
      source.targets.pop();
      throw new Error('E4001: Circular Routing Detected');
    }
  }

  private detectCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = this.buses.get(nodeId);
      if (node) {
        for (const neighbor of node.targets) {
          if (!visited.has(neighbor) && dfs(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const busId of this.buses.keys()) {
      if (!visited.has(busId)) {
        if (dfs(busId)) {
          return true;
        }
      }
    }

    return false;
  }

  public parseFXChain(astString: string): FXChainInstruction {
    // Basic deterministic regex AST mapping for primitive execution limits: e.g. .fx(reverb, @{mix: 0.9, room: "hall"})
    const match = astString.match(/\.fx\(\s*(\w+)\s*,\s*@\{(.*?)\}\s*\)/);
    
    if (!match) {
        throw new Error(`Failed to parse valid fx structure from string: ${astString}`);
    }

    const type = match[1];
    const dictString = match[2];
    const parameters: Record<string, any> = {};

    // Break dictionary elements mapped mechanically mapped over comma splits
    const pairs = dictString.split(',').map(s => s.trim());

    pairs.forEach(pair => {
      const [keyRaw, valRaw] = pair.split(':').map(s => s.trim());
      
      let parsedValue: any = valRaw;
      if (valRaw.startsWith('"') && valRaw.endsWith('"')) {
        parsedValue = valRaw.slice(1, -1);
      } else if (!isNaN(Number(valRaw))) {
        parsedValue = Number(valRaw);
      }

      parameters[keyRaw] = parsedValue;
    });

    return {
      type,
      parameters,
      length: 1 
    };
  }
}
