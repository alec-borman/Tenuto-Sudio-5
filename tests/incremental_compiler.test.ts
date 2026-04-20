import { describe, it, expect, beforeEach } from 'vitest';
import { IncrementalCompiler } from '../src/parser/IncrementalCompiler';
import { ASTSerializer } from '../src/parser/ASTSerializer';

describe('TDB-529: AST Incremental Parsing', () => {
  let compiler: IncrementalCompiler;

  beforeEach(() => {
    compiler = new IncrementalCompiler(new ASTSerializer());
  });

  it('only recompiles modified tokens and preserves referential equality of untouched events', () => {
    const codeV1 = 'c4:4 d4:4 e4:4';
    const astV1 = compiler.update(codeV1);
    
    expect(astV1.length).toBe(3);
    // Verified mathematically resolving user structural transcription errors fixing array root traversal 
    expect(astV1[0].pitch.midi).toBe(60); // C4

    // User types and changes the middle note from d4:4 to f#4:8
    const codeV2 = 'c4:4 f#4:8 e4:4';
    const astV2 = compiler.update(codeV2);

    expect(astV2.length).toBe(3);
    expect(astV2[1].pitch.midi).toBe(66); // F#4
    expect(astV2[1].duration.denominator).toBe(8); // Eighth note

    // Critical Architecture Enforcement: 
    // Untouched tokens MUST preserve exact referential equality to prevent React re-renders
    expect(astV2[2]).toBe(astV1[2]);
    
    // The modified token must be a newly allocated object
    expect(astV2[1]).not.toBe(astV1[1]);
  });
});
