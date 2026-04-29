import { ASTSerializer, AtomicEvent } from './ASTSerializer';
import { Lexer, TokenType } from './lexer';

export class IncrementalCompiler {
  private cachedTokens: string[] = [];
  private cachedEvents: any[] = [];

  constructor(private serializer: ASTSerializer) {}

  public update(newSourceCode: string): any[] {
    const eventsSequence = newSourceCode.replace(/^[a-zA-Z_]+:\s*/, '').trim();
    
    if (!eventsSequence) {
      this.cachedTokens = [];
      this.cachedEvents = [];
      return [];
    }

    const lexer = new Lexer(eventsSequence);
    const lexedTokens = lexer.tokenize();
    
    // Evaluate strictly skipping bracket architecture temporarily avoiding AST logic crashes
    const tokens = lexedTokens
      .filter(t => t.type !== TokenType.BRACKET && t.type !== TokenType.PIPE)
      .map(t => t.value);

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
        event = this.serializer.parseToken(token);
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

    // React requires a native isolated pointer reference for array tracking states to compute paint diffs
    return [...this.cachedEvents];
  }
}
