import { ASTSerializer, AtomicEvent } from './ASTSerializer';
import { Lexer, TokenType } from './lexer';
import { Parser } from './Parser';

export class IncrementalCompiler {
  private cachedTokens: string[] = [];
  private cachedEvents: any[] = [];

  constructor(private serializer: ASTSerializer) {}

  public update(newSourceCode: string): any[] {
    const eventsSequenceRaw = newSourceCode.trim();
    if (!eventsSequenceRaw) {
      this.cachedTokens = [];
      this.cachedEvents = [];
      return [];
    }

    let tokens: string[] = [];
    const hasStructural = eventsSequenceRaw.includes('measure') || eventsSequenceRaw.includes('macro');

    if (hasStructural) {
      const lexer = new Lexer(eventsSequenceRaw);
      const parser = new Parser(lexer.tokenize());
      const score = parser.parse();
      
      for (const measure of score.measures) {
        for (const logic of measure.logic) {
          if (logic.voiceGroup) {
            for (const voice of logic.voiceGroup.voices) {
              for (const event of voice.events) {
                tokens.push(event.token);
              }
            }
          }
        }
      }
      for (const macro of score.macros) {
        for (const event of macro.body.events) {
           tokens.push(event.token);
        }
      }
    } 
    
    if (!hasStructural || tokens.length === 0) {
      const eventsSequence = eventsSequenceRaw.replace(/^[a-zA-Z_]+:\s*/, '').trim();
      const lexer = new Lexer(eventsSequence);
      const lexedTokens = lexer.tokenize();
      
      // Evaluate strictly skipping bracket architecture temporarily avoiding AST logic crashes
      tokens = lexedTokens
        .filter(t => t.type !== TokenType.BRACKET && t.type !== TokenType.PIPE && t.type !== TokenType.EOF)
        .map(t => t.value);
    }

    let cumulativeFraction = 0.0;
    let hasMutated = false;

    const newEvents = new Array(tokens.length);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let event;

      if (this.cachedTokens[i] === token && this.cachedEvents[i]) {
        event = this.cachedEvents[i];
        event.startTime = { numerator: cumulativeFraction, denominator: 1 };
      } else {
        try {
            event = this.serializer.parseToken(token);
        } catch(e) {
            continue;
        }
        event.rawToken = token;
        event.startTime = { numerator: cumulativeFraction, denominator: 1 };
        
        this.cachedTokens[i] = token;
        this.cachedEvents[i] = event;
      }
      
      cumulativeFraction += (event.duration.numerator / event.duration.denominator);
    }

    // Shrink array seamlessly resolving deletions
    this.cachedTokens.length = tokens.length;
    this.cachedEvents.length = tokens.length;

    const ret = this.cachedEvents.filter(e => e !== undefined);
    return ret;
  }
}
