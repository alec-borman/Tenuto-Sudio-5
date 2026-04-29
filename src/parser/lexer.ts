export enum TokenType {
  PITCH = 'PITCH',
  DURATION = 'DURATION',
  BRACKET = 'BRACKET',
  PIPE = 'PIPE',
  IDENTIFIER = 'IDENTIFIER',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN'
}

export interface Token {
  type: TokenType;
  value: string;
}

export class Lexer {
  private input: string;
  private position: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  private peek(): string {
    if (this.position >= this.input.length) return '\0';
    return this.input[this.position];
  }

  private advance(): string {
    const char = this.peek();
    this.position++;
    return char;
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  public nextToken(): Token {
    while (this.isWhitespace(this.peek())) {
      this.advance();
    }

    if (this.peek() === '\0') {
      return { type: TokenType.EOF, value: '' };
    }

    const startChar = this.peek();

    if (startChar === '<' || startChar === '[' || startChar === ']' || startChar === '>') {
      let val = this.advance();
      if (startChar === '<' && this.peek() === '[') {
        val += this.advance();
      } else if (startChar === ']' && this.peek() === '>') {
        val += this.advance();
      }
      return { type: TokenType.BRACKET, value: val };
    }

    if (startChar === '|') {
      return { type: TokenType.PIPE, value: this.advance() };
    }

    let value = '';
    while (
      this.peek() !== '\0' && 
      !this.isWhitespace(this.peek()) && 
      this.peek() !== '<' && 
      this.peek() !== '[' && 
      this.peek() !== ']' && 
      this.peek() !== '>' && 
      this.peek() !== '|'
    ) {
      value += this.advance();
    }

    return { type: TokenType.IDENTIFIER, value };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.nextToken();
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.nextToken();
    }
    return tokens;
  }
}
