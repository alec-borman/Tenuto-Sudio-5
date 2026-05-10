import { describe, it, expect } from 'vitest';
import { Lexer } from '../src/parser/lexer';
import { Parser } from '../src/parser/Parser';

describe('TDB-545: Grammar Parser & Hierarchical AST', () => {
  it('parses a multi-voice measure into nested AST nodes', () => {
    const source = `
      measure 1 {
        pno: <[ c4:4 d e | c3:2 r:2 ]>
      }
    `;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const score = parser.parse();

    expect(score.measures).toHaveLength(1);
    const measure = score.measures[0];
    expect(measure.number).toBe(1);

    const assignment = measure.logic[0];
    expect(assignment.trackId).toBe('pno');
    expect(assignment.voiceGroup).toBeDefined();
    expect(assignment.voiceGroup.voices).toHaveLength(2);
    expect(assignment.voiceGroup.voices[0].events).toHaveLength(3); // c4:4, d, e
    expect(assignment.voiceGroup.voices[1].events).toHaveLength(2); // c3:2, r:2
  });

  it('parses a macro definition', () => {
    const source = `macro Motif(a) { c4:4 d e }`;
    const lexer = new Lexer(source);
    const parser = new Parser(lexer.tokenize());
    const score = parser.parse();
    expect(score.macros).toHaveLength(1);
    expect(score.macros[0].name).toBe('Motif');
  });
});
