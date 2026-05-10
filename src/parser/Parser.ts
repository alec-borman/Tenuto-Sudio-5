import { Token, TokenType } from './lexer';

export class Event {
  token: string = '';
}

export class Voice {
  events: Event[] = [];
}

export class VoiceGroup {
  voices: Voice[] = [];
}

export class Assignment {
  trackId: string = '';
  voiceGroup: VoiceGroup = new VoiceGroup();
}

export class Measure {
  number: number = 0;
  logic: Assignment[] = [];
}

export class MacroDef {
  name: string = '';
  body: Voice = new Voice();
}

export class Score {
  measures: Measure[] = [];
  macros: MacroDef[] = [];
}

export class Parser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    if (this.position >= this.tokens.length) {
      return { type: TokenType.EOF, value: '' };
    }
    return this.tokens[this.position];
  }

  private match(value: string): boolean {
    if (this.peek().value === value) {
      this.position++;
      return true;
    }
    return false;
  }

  private advance(): Token {
    const token = this.peek();
    this.position++;
    return token;
  }

  public parse(): Score {
    const score = new Score();

    while (this.peek().type !== TokenType.EOF) {
      const token = this.peek();
      if (token.type === TokenType.IDENTIFIER && token.value === 'measure') {
        score.measures.push(this.parseMeasure());
      } else if (token.type === TokenType.IDENTIFIER && token.value === 'macro') {
        score.macros.push(this.parseMacro());
      } else {
        this.advance();
      }
    }

    return score;
  }

  private parseMeasure(): Measure {
    this.advance(); // 'measure'
    const measure = new Measure();
    
    if (this.peek().type === TokenType.IDENTIFIER && this.peek().value !== '{') {
      measure.number = parseInt(this.advance().value, 10) || 0;
    }
    
    if (this.match('{')) {
      while (this.peek().type !== TokenType.EOF && this.peek().value !== '}') {
        const val = this.peek().value;
        if (val.endsWith(':')) {
          measure.logic.push(this.parseAssignment());
        } else {
          this.advance();
        }
      }
      this.match('}');
    }
    
    return measure;
  }

  private parseAssignment(): Assignment {
    const assignment = new Assignment();
    const token = this.advance();
    assignment.trackId = token.value.replace(':', '');

    if (this.peek().value === '<[') {
        assignment.voiceGroup = this.parseVoiceGroup();
    } else {
        const vg = new VoiceGroup();
        vg.voices.push(this.parseVoice());
        assignment.voiceGroup = vg;
    }

    return assignment;
  }

  private parseVoiceGroup(): VoiceGroup {
    this.advance(); // '<['
    const vg = new VoiceGroup();
    
    vg.voices.push(this.parseVoice());
    
    while (this.match('|')) {
        vg.voices.push(this.parseVoice());
    }

    this.match(']>');
    return vg;
  }

  private parseVoice(): Voice {
    const voice = new Voice();
    while (
        this.peek().type !== TokenType.EOF && 
        this.peek().value !== '|' && 
        this.peek().value !== ']>' && 
        this.peek().value !== '}' &&
        !(this.peek().type === TokenType.IDENTIFIER && this.peek().value.endsWith(':'))
    ) {
        if (this.peek().type === TokenType.IDENTIFIER) {
             const ev = new Event();
             ev.token = this.advance().value;
             voice.events.push(ev);
        } else {
             this.advance();
        }
    }
    return voice;
  }

  private parseMacro(): MacroDef {
    this.advance(); // 'macro'
    const macro = new MacroDef();
    
    let nameToken = this.advance().value;
    if (nameToken.includes('(')) {
        macro.name = nameToken.substring(0, nameToken.indexOf('('));
    } else {
        macro.name = nameToken;
        if (this.peek().value.startsWith('(')) {
             this.advance();
        }
    }

    this.match('{');
    macro.body = this.parseVoice();
    this.match('}');

    return macro;
  }
}
