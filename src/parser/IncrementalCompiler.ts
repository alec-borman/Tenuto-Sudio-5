import { ASTSerializer, AtomicEvent } from './ASTSerializer';
import { Lexer, TokenType } from './lexer';
import { Parser, Score, TopLevel, Measure, Assignment, EventNode, Chord, Tuplet, MacroCall, VoiceEvent, Euclidean } from './Parser';

export class IncrementalCompiler {
  private cachedTokens: string[] = [];
  private cachedEvents: any[] = [];
  public lastScore: Score | null = null;

  constructor(private serializer: ASTSerializer) {}

  public update(newSourceCode: string): any[] {
    const lexer = new Lexer(newSourceCode);
    const parser = new Parser(lexer.tokenize());
    const score = parser.parse();
    this.lastScore = score;
    return this.linearizeEvents(score);
  }

  public linearizeEvents(score: Score): any[] {
    const events: any[] = [];
    const newCachedEvents: any[] = [];
    
    // We linearly process assignments across top level and measures
    const assignments: Assignment[] = [];

    for (const tl of score.topLevels) {
      if (tl instanceof Measure) {
        for (const logic of tl.logic) {
           if (logic instanceof Assignment) {
              assignments.push(logic);
           }
        }
      } else if (tl instanceof Assignment) {
        assignments.push(tl);
      }
    }

    let defaultFrac = 0.0;
    
    for (const assignment of assignments) {
      const trackId = assignment.trackId || 'default';
      
      const processVoice = (voice: any, startFrac: number): number => {
         let localFrac = startFrac;
         for (const ev of voice.events) {
            if (ev instanceof EventNode || ev instanceof Tuplet || ev instanceof Euclidean) {
               try {
                 const serializedTok = ev.serialize();
                 const cacheKey = `${trackId}-${serializedTok}`;
                 
                 let atomicRaw: any;
                 const cachedIndex = this.cachedTokens.indexOf(cacheKey);
                 if (cachedIndex !== -1) {
                    atomicRaw = this.cachedEvents[cachedIndex];
                    // Update temporal position dynamically on the cached item
                    atomicRaw.startTime = this.floatToFraction(localFrac);
                 } else {
                    const pitchLit = (ev as EventNode).pitchLit || 'r';
                    const durRaw = (ev as EventNode).duration ? ':' + (ev as EventNode).duration?.raw : ':4';
                 
                    atomicRaw = this.serializer.parseToken(pitchLit + durRaw);
                    atomicRaw.astNodeId = ev.astNodeId;
                    atomicRaw.rawToken = serializedTok;
                    atomicRaw.trackId = trackId;
                    atomicRaw.startTime = this.floatToFraction(localFrac);
                 }
                 
                 newCachedEvents.push(atomicRaw);
                 this.cachedTokens.push(cacheKey);
                 
                 // If not a grace note, increment 
                 if (!atomicRaw.duration.isGrace) {
                    localFrac += (atomicRaw.duration.numerator / atomicRaw.duration.denominator);
                 }
                 
                 events.push(atomicRaw);
               } catch (e) {
                 // Ignore unsupported serialization or parsing bounds 
               }
            }
         }
         return localFrac;
      };

      if (assignment.singleVoice) {
         defaultFrac = processVoice(assignment.singleVoice, defaultFrac);
      } else if (assignment.voiceGroup) {
         let maxVoiceFrac = defaultFrac;
         for (const voice of assignment.voiceGroup.voices) {
            const endFrac = processVoice(voice, defaultFrac);
            if (endFrac > maxVoiceFrac) maxVoiceFrac = endFrac;
         }
         defaultFrac = maxVoiceFrac; // Advance global cursor to the end of the voice group block
      }
    }

    this.cachedTokens = newCachedEvents.map(e => `${e.trackId}-${e.rawToken}`);
    this.cachedEvents = newCachedEvents;
    return events;
  }

  private floatToFraction(val: number): { numerator: number, denominator: number } {
    if (val === 0) return { numerator: 0, denominator: 1 };
    let bestNum = 0;
    let bestDen = 1;
    let minError = Infinity;
    for (let den = 1; den <= 64; den++) {
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
}
