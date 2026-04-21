import { AtomicEvent } from '../parser/ASTSerializer';

export class DemarcationEngine {
  public pruneForExport(events: any[], trackStyle: string, printOverride: boolean): any[] {
    if (trackStyle === 'concrete' && !printOverride) {
      return [];
    }

    return events.map(event => {
      const clonedEvent = { ...event };
      
      // Deep clone to prevent mutating original references linked across React DOM buffers
      if (clonedEvent.physics) {
        clonedEvent.physics = { ...clonedEvent.physics };
        delete clonedEvent.physics.pullMs;
        delete clonedEvent.physics.pushMs;
        delete clonedEvent.physics.slice;
        delete clonedEvent.physics.fx;
        
        // Sever completely if all unprintable bounds were eliminated
        if (Object.keys(clonedEvent.physics).length === 0) {
            delete clonedEvent.physics;
        }
      }
      
      return clonedEvent;
    });
  }
}
