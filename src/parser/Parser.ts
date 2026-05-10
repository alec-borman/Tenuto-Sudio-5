import { Token, TokenType } from './lexer';

export abstract class ASTNode {
  astNodeId: string;
  constructor() {
    this.astNodeId = Math.random().toString(36).substring(2, 11);
  }
  abstract serialize(): string;
}

export class Score extends ASTNode {
  header: Header | null = null;
  topLevels: ASTNode[] = [];
  serialize(): string {
    const parts: string[] = [];
    if (this.header) parts.push(this.header.serialize());
    parts.push(...this.topLevels.map(t => t.serialize()));
    return parts.join('\n');
  }
}

export class Header extends ASTNode {
  version: string | null = null;
  serialize(): string {
    return 'tenuto' + (this.version ? ` "${this.version}"` : '');
  }
}

export abstract class TopLevel extends ASTNode {}

export class MetaBlock extends TopLevel {
  dict: KeyValue[] = [];
  serialize(): string {
    return `meta @{ ${this.dict.map(kv => kv.serialize()).join(', ')} }`;
  }
}

export class KeyValue extends ASTNode {
  key: string = '';
  value: string = ''; // Can be literal or mapped
  serialize(): string {
    return `${this.key}: ${this.value}`;
  }
}

export class Definition extends TopLevel {
  trackId: string = '';
  desc: string | null = null;
  attrs: DefAttr[] = [];
  serialize(): string {
    return `def ${this.trackId}${this.desc ? ` "${this.desc}"` : ''} ${this.attrs.map(a => a.serialize()).join(' ')}`;
  }
}

export class DefAttr extends ASTNode {
  key: string = '';
  value: string = '';
  serialize(): string {
    return `${this.key}=${this.value}`;
  }
}

export class VariableDecl extends TopLevel {
  name: string = '';
  value: string = '';
  serialize(): string {
    return `var ${this.name} = ${this.value}`;
  }
}

export class MacroDef extends TopLevel {
  name: string = '';
  params: string[] = [];
  body: Voice = new Voice();
  serialize(): string {
    const p = this.params.length ? `(${this.params.join(', ')})` : '';
    return `macro ${this.name}${p} { ${this.body.serialize()} }`;
  }
}

export class Measure extends TopLevel {
  number: string = '';
  meta: MetaBlock | null = null;
  logic: BlockLogic[] = [];
  serialize(): string {
    let s = `measure ${this.number} `;
    if (this.meta) s += this.meta.serialize() + ' ';
    s += `{\n`;
    s += this.logic.map(l => '  ' + l.serialize()).join('\n');
    s += `\n}`;
    return s;
  }
}

export abstract class BlockLogic extends ASTNode {}

export class Assignment extends BlockLogic {
  trackId: string = '';
  voiceGroup: VoiceGroup | null = null;
  singleVoice: Voice | null = null;
  serialize(): string {
    const pfx = this.trackId ? `${this.trackId}: ` : '';
    if (this.voiceGroup) {
      return `${pfx}${this.voiceGroup.serialize()}`;
    }
    return `${pfx}${this.singleVoice?.serialize()}`;
  }
}

export class VoiceGroup extends ASTNode {
  voices: Voice[] = [];
  serialize(): string {
    return `<[ ${this.voices.map(v => v.serialize()).join(' | ')} ]>`;
  }
}

export class Voice extends ASTNode {
  events: VoiceEvent[] = [];
  serialize(): string {
    return this.events.map(e => e.serialize()).join(' ');
  }
}

export abstract class VoiceEvent extends ASTNode {}

export class EventNode extends VoiceEvent {
  pitchLit: string = '';
  duration: Duration | null = null;
  modifiers: Modifier[] = [];
  serialize(): string {
    let s = this.pitchLit;
    if (this.duration) s += this.duration.serialize();
    s += this.modifiers.map(m => m.serialize()).join('');
    return s;
  }
}

export class Chord extends VoiceEvent {
  notes: string[] = [];
  duration: Duration | null = null;
  modifiers: Modifier[] = [];
  serialize(): string {
    let s = `[${this.notes.join(' ')}]`;
    if (this.duration) s += this.duration.serialize();
    s += this.modifiers.map(m => m.serialize()).join('');
    return s;
  }
}

export class Tuplet extends VoiceEvent {
  voice: Voice = new Voice();
  numerator: string = '';
  denominator: string = '';
  serialize(): string {
    return `(${this.voice.serialize()}):${this.numerator}/${this.denominator}`;
  }
}

export class Euclidean extends VoiceEvent {
  identifier: string = '';
  numerator: string = '';
  denominator: string = '';
  serialize(): string {
    return `(${this.identifier}):${this.numerator}/${this.denominator}`;
  }
}

export class MacroCall extends VoiceEvent {
  identifier: string = '';
  args: string[] = [];
  transposition: string | null = null;
  serialize(): string {
    let s = `$${this.identifier}`;
    if (this.args.length) s += `(${this.args.join(', ')})`;
    if (this.transposition) s += this.transposition;
    return s;
  }
}

export class Duration extends ASTNode {
  raw: string = '';
  serialize(): string {
    return `:${this.raw}`;
  }
}

export abstract class Modifier extends ASTNode {}

export class AttributeModifier extends Modifier {
  attribute: string = '';
  args: string[] = [];
  serialize(): string {
    let s = `.${this.attribute}`;
    if (this.args.length > 0) s += `(${this.args.join(', ')})`;
    return s;
  }
}

export class TieModifier extends Modifier {
  serialize(): string {
    return `~`;
  }
}

export class Parser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset: number = 0): Token {
    if (this.position + offset >= this.tokens.length) {
      return { type: TokenType.EOF, value: '' };
    }
    return this.tokens[this.position + offset];
  }

  private advance(): Token {
    const token = this.peek();
    this.position++;
    return token;
  }

  private isEOF(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private throwError(message: string): never {
    throw new Error(`E1002: Syntax Error - ${message} at token '${this.peek().value}'`);
  }

  private match(type: TokenType, value?: string): boolean {
    const token = this.peek();
    if (token.type === type && (value === undefined || token.value === value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.peek();
    if (token.type === type && (value === undefined || token.value === value)) {
      return this.advance();
    }
    this.throwError(`Expected ${type}${value ? ` '${value}'` : ''} but got ${token.type} '${token.value}'`);
  }

  public parse(): Score {
    const score = new Score();

    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'tenuto') {
      score.header = this.parseHeader();
    }

    while (!this.isEOF()) {
      score.topLevels.push(this.parseTopLevel());
    }

    return score;
  }

  private parseHeader(): Header {
    this.expect(TokenType.KEYWORD, 'tenuto');
    const header = new Header();
    if (this.peek().type === TokenType.STRING_LIT) {
      header.version = this.advance().value;
    }
    return header;
  }

  private parseTopLevel(): TopLevel {
    const token = this.peek();
    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case 'def': return this.parseDefinition();
        case 'macro': return this.parseMacroDef();
        case 'measure': return this.parseMeasure();
        case 'meta': return this.parseMetaBlock();
        case 'var': return this.parseVariableDecl();
      }
    }
    
    // In Sketch Mode, assignments can float at top-level. 
    // We parse an assignment and wrap it in a pseudo-measure structurally if needed
    if (token.type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.COLON) {
       return this.parseAssignment();
    }
    
    // Legacy Sketch Mode: purely bare voices without track IDs `c4:4 d4:4`
    if (token.type === TokenType.IDENTIFIER || token.type === TokenType.LBRACKET || token.type === TokenType.LPAREN || (token.type === TokenType.BRACKET && token.value === '<[')) {
       const assignment = new Assignment();
       assignment.trackId = ""; // anonymous track
       if (token.type === TokenType.BRACKET && token.value === '<[') {
          assignment.voiceGroup = this.parseVoiceGroup();
       } else {
          assignment.singleVoice = this.parseVoice();
       }
       return assignment;
    }
    
    this.throwError(`Unexpected top level declaration`);
  }

  private parseMetaBlock(): MetaBlock {
    this.expect(TokenType.KEYWORD, 'meta');
    const meta = new MetaBlock();
    this.expect(TokenType.AT);
    this.expect(TokenType.LBRACE);
    
    while (!this.match(TokenType.RBRACE) && !this.isEOF()) {
      const kv = new KeyValue();
      const idToken = this.advance(); // Usually IDENTIFIER
      kv.key = idToken.value;
      if (this.match(TokenType.COLON)) {
         kv.value = this.advance().value;
      }
      meta.dict.push(kv);
      this.match(TokenType.COMMA);
    }
    return meta;
  }

  private parseDefinition(): Definition {
    this.expect(TokenType.KEYWORD, 'def');
    const def = new Definition();
    def.trackId = this.expect(TokenType.IDENTIFIER).value;
    
    if (this.peek().type === TokenType.STRING_LIT) {
      def.desc = this.advance().value;
    }

    while (!this.isEOF() && (this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.KEYWORD) && this.peek(1).type === TokenType.ASSIGN) {
      const attr = new DefAttr();
      attr.key = this.advance().value;
      this.advance(); // =
      attr.value = this.advance().value; 
      def.attrs.push(attr);
    }
    return def;
  }

  private parseVariableDecl(): VariableDecl {
    this.expect(TokenType.KEYWORD, 'var');
    const decl = new VariableDecl();
    decl.name = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ASSIGN);
    decl.value = this.advance().value;
    return decl;
  }

  private parseMacroDef(): MacroDef {
    this.expect(TokenType.KEYWORD, 'macro');
    const m = new MacroDef();
    m.name = this.expect(TokenType.IDENTIFIER).value;
    if (this.match(TokenType.LPAREN)) {
      while (!this.match(TokenType.RPAREN) && !this.isEOF()) {
        m.params.push(this.advance().value);
        this.match(TokenType.COMMA);
      }
    }
    if (this.match(TokenType.ASSIGN)) {
      // Optional '='
    }
    this.expect(TokenType.LBRACE);
    m.body = this.parseVoice();
    this.expect(TokenType.RBRACE);
    return m;
  }

  private parseMeasure(): Measure {
    this.expect(TokenType.KEYWORD, 'measure');
    const measure = new Measure();
    
    if (this.peek().type === TokenType.INTEGER || this.peek().type === TokenType.IDENTIFIER) {
      measure.number = this.advance().value;
    }

    if (this.peek().type === TokenType.KEYWORD && this.peek().value === 'meta') {
      measure.meta = this.parseMetaBlock();
    }

    this.expect(TokenType.LBRACE);
    while (!this.match(TokenType.RBRACE) && !this.isEOF()) {
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.COLON) {
        measure.logic.push(this.parseAssignment());
      } else {
        this.throwError(`Expected logic inside measure`);
      }
    }
    return measure;
  }

  private parseAssignment(): Assignment {
    const a = new Assignment();
    a.trackId = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.COLON);

    if (this.match(TokenType.BRACKET, '<[')) {
       a.voiceGroup = this.parseVoiceGroup();
    } else {
       a.singleVoice = this.parseVoice();
    }
    return a;
  }

  private parseVoiceGroup(): VoiceGroup {
    const vg = new VoiceGroup();
    vg.voices.push(this.parseVoice());
    
    while (this.match(TokenType.PIPE)) {
       vg.voices.push(this.parseVoice());
    }

    this.expect(TokenType.BRACKET, ']>');
    return vg;
  }

  private parseVoice(): Voice {
    const voice = new Voice();
    while (
      !this.isEOF() && 
      this.peek().type !== TokenType.PIPE && 
      this.peek().value !== ']>' && 
      this.peek().type !== TokenType.RBRACE
    ) {
      // Lookahead to break for a new Assignment (only if it's a bare Voice, not in a VoiceGroup)
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.COLON) {
         // Is it a duration? A duration usually has INTEGER, or 'ms' (IDENTIFIER, but after a number usually?).
         // If peek(2) is '<[' or an Event starting token, it might be an assignment.
         // Actually, duration is often an INTEGER (`4`) after `:` or IDENTIFIER if it's just a raw number? No, INTEGER.
         // But what if it's just PitchLit without duration, and then the next token is an Assignment?
         // Example: `pno: c4 vln: d4`. `c4` inside `pno` voice. Next is `vln:`.
         // If we are at `vln:`, peek() is IDENTIFIER, peek(1) is COLON. Wait, what if we are at `c4:`? peek() is `c4` (IDENTIFIER), peek(1) is COLON.
         // Next after `c4:` is duration `4` (INTEGER). Next after `vln:` is `d4` (IDENTIFIER) or `<[`.
         const p2 = this.peek(2);
         // If after COLON we see an INTEGER, it's definitely a duration.
         // If after COLON we see a STRING or IDENTIFIER, it's likely an Assignment starting.
         if (p2.type === TokenType.IDENTIFIER || p2.type === TokenType.BRACKET || p2.type === TokenType.DOLLAR || p2.type === TokenType.LPAREN || p2.type === TokenType.LBRACKET) {
             // It's a new assignment! Break out.
             break;
         }
      }
      voice.events.push(this.parseVoiceEvent());
    }
    return voice;
  }

  private parseVoiceEvent(): VoiceEvent {
    let ev: VoiceEvent;

    if (this.peek().type === TokenType.LPAREN) {
      this.advance(); // (
      if (this.peek(1).type === TokenType.RPAREN || this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.RPAREN && this.peek(3).type === TokenType.COLON) {
        // Tuplet or Euclidean. If inside voice it's a tuplet, but if it's (IDENTIFIER): it's euclidean
        // A single token inside could be Euclidean if identified as such, or a Voice that contains 1 element.
        // Actually, just parse a Voice inside:
        const innerVoice = this.parseVoice();
        this.expect(TokenType.RPAREN);
        this.expect(TokenType.COLON);
        const num = this.expect(TokenType.INTEGER).value;
        this.expect(TokenType.SLASH);
        const den = this.expect(TokenType.INTEGER).value;

        if (innerVoice.events.length === 1 && innerVoice.events[0] instanceof EventNode && !innerVoice.events[0].duration && innerVoice.events[0].modifiers.length===0) {
           const euc = new Euclidean();
           euc.identifier = (innerVoice.events[0] as EventNode).pitchLit;
           euc.numerator = num;
           euc.denominator = den;
           ev = euc;
        } else {
           const tup = new Tuplet();
           tup.voice = innerVoice;
           tup.numerator = num;
           tup.denominator = den;
           ev = tup;
        }
      } else {
        // Nested Tuplet
        const innerVoice = this.parseVoice();
        this.expect(TokenType.RPAREN);
        if (this.match(TokenType.COLON)) {
            const tup = new Tuplet();
            tup.voice = innerVoice;
            tup.numerator = this.expect(TokenType.INTEGER).value;
            this.expect(TokenType.SLASH);
            tup.denominator = this.expect(TokenType.INTEGER).value;
            ev = tup;
        } else {
           this.throwError(`Expected : for tuplet grouping`);
        }
      }
    } else if (this.match(TokenType.DOLLAR)) {
      const mac = new MacroCall();
      mac.identifier = this.expect(TokenType.IDENTIFIER).value;
      if (this.match(TokenType.LPAREN)) {
         while (!this.match(TokenType.RPAREN) && !this.isEOF()) {
            mac.args.push(this.advance().value);
            this.match(TokenType.COMMA);
         }
      }
      if (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS) {
         const sign = this.advance().value;
         mac.transposition = sign + this.expect(TokenType.INTEGER).value;
      }
      ev = mac;
    } else if (this.match(TokenType.LBRACKET)) {
      const chord = new Chord();
      while (!this.match(TokenType.RBRACKET) && !this.isEOF()) {
         chord.notes.push(this.advance().value);
      }
      ev = chord;
      this.parseDurationAndModifiers(chord);
    } else {
      const node = new EventNode();
      let rawVal = this.advance().value;
      
      if (rawVal.includes(':')) {
         const parts = rawVal.split(':');
         node.pitchLit = parts[0];
         const dur = new Duration();
         dur.raw = parts[1];
         node.duration = dur;
      } else {
         node.pitchLit = rawVal;
      }
      ev = node;
      this.parseDurationAndModifiers(node);
    }
    
    return ev;
  }

  private parseDurationAndModifiers(ev: EventNode | Chord) {
    if (this.match(TokenType.COLON)) {
      const dur = new Duration();
      const valToken = this.advance();
      dur.raw = valToken.value; 
      
      if (this.match(TokenType.SLASH)) {
         dur.raw += '/' + this.advance().value;
      }
      
      // If the next token is a dot but NOT followed by an identifier (or if we just safely peek identifier)
      if (this.peek().type === TokenType.DOT && this.peek(1).type !== TokenType.IDENTIFIER) {
         this.advance(); // consume dot
         dur.raw += '.';
      }

      ev.duration = dur;
    }

    while (this.peek().type === TokenType.DOT || this.peek().type === TokenType.TILDE) {
      if (this.match(TokenType.TILDE)) {
        ev.modifiers.push(new TieModifier());
      } else if (this.match(TokenType.DOT)) {
        if (this.peek().type === TokenType.IDENTIFIER) {
          const mod = new AttributeModifier();
          mod.attribute = this.advance().value;
          if (this.match(TokenType.LPAREN)) {
            while (!this.match(TokenType.RPAREN) && !this.isEOF()) {
               const peekToken = this.peek();
               if (peekToken.type === TokenType.STRING_LIT || peekToken.type === TokenType.INTEGER || peekToken.type === TokenType.IDENTIFIER) {
                 mod.args.push(this.advance().value);
                 if (this.peek().type === TokenType.LBRACKET) { // array
                   mod.args.push(this.advance().value);
                   while(!this.match(TokenType.RBRACKET) && !this.isEOF()) {
                      mod.args.push(this.advance().value);
                   }
                 }
               } else if (peekToken.type === TokenType.LBRACKET) { // start of array
                 let arrArgs = "[";
                 this.advance(); // consume LBRACKET
                 while(!this.match(TokenType.RBRACKET) && !this.isEOF()) {
                    arrArgs += this.advance().value;
                    if (this.peek().type === TokenType.COMMA) {
                       arrArgs += this.advance().value; // consume comma
                       arrArgs += " ";
                    }
                 }
                 arrArgs += "]";
                 mod.args.push(arrArgs);
               }
               this.match(TokenType.COMMA);
            }
          }
          ev.modifiers.push(mod);
        } else {
          // If a dot manages to be here without an identifier, just break
          break;
        }
      }
    }
  }
}
