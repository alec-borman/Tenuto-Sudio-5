import { describe, it, expect } from 'vitest';
import { Lexer, Token } from '../src/parser/lexer';
import { IncrementalCompiler } from '../src/parser/IncrementalCompiler';
import { TrackCSandbox } from '../src/oracle/track_c';

describe('TDB-543: Formal LL(1) Lexer & Dependency Gauntlet', () => {
    
    it('MUST parse polyphonic brackets character-by-character without regex splitting', () => {
        const lexer = new Lexer('<[ c4:4 | d4:8 ]>');
        const tokens = lexer.tokenize();
        // Asserting precise lexical boundaries
        expect(tokens[0].value).toBe('<[');
        expect(tokens[1].value).toBe('c4:4');
        expect(tokens[2].value).toBe('|');
    });

    it('MUST execute the Track C Sandbox vacuum to verify hermetic deterministic payload loading', async () => {
        // Weaponizing Track C to prevent vi.mock() hallucination cheats
        process.env.TELA_TAPE_MODE = 'replay';
        const sandbox = new TrackCSandbox();
        // Load the 10,000-note symphonic payload fixture deterministically
        const payload = await sandbox.replayPayload('mock_tenuto_file_hash_1024');
        
        const lexer = new Lexer(payload.data);
        const tokens = lexer.tokenize();
        expect(tokens.length).toBeGreaterThan(1000);
    });

    it('MUST satisfy the Anti-Float Mandate when extracting temporal tokens', () => {
        // Ensure no floating point math/decimals are generated during lexical duration token extraction
        const lexer = new Lexer('c4:3/8');
        const token = lexer.nextToken();
        
        // Assert strict string components, preparing for the Rust RationalTime struct mapping
        expect(token.value).toBe('c4:3/8');
        expect(token.value).not.toContain('.'); // The lexer must not coerce into 0.375 floating-point drift
    });
});
