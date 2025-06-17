import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from '../src/lexer.js';

describe('Lexer', () => {
    it('should correctly tokenize a simple expression', () => {
        const input = 'eq("a", "b")';
        const lexer = new Lexer(input);

        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'eq', position: 0 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 2 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'a', position: 3 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 6 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'b', position: 8 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 11 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 12 })
    })

    it('should correctly tokenize a complex logical expression', () => {
        const input = 'and(or(eq("a", "b"), like("c", "d")), gt("e", "f"))';
        const lexer = new Lexer(input);

        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'and', position: 0 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 3 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'or', position: 4 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 6 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'eq', position: 7 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 9 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'a', position: 10 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 13 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'b', position: 15 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 18 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 19 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'like', position: 21 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 25 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'c', position: 26 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 29 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'd', position: 31 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 34 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 35 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 36 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'gt', position: 38 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 40 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'e', position: 41 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 44 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'f', position: 46 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 49 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 50 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 51 });
    })

    it('should ignore whitespace', () => {
        const input = '  eq ( "test" , "value" )  ';
        const lexer = new Lexer(input);

        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'eq', position: 2 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 5 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'test', position: 7 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 14 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'value', position: 16 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 24 });
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 27 });
    });

    it('should throw an error for unclosed string literal', () => {
        const input = 'eq("a, "b")';
        const lexer = new Lexer(input);

        lexer.nextToken(); // eq, 0
        lexer.nextToken(); // (, 2
        lexer.nextToken(); // STRING_LITERAL "a, ", 3
        lexer.nextToken(); // IDENTIFIER b, 7
        expect(() => lexer.nextToken()).toThrowError('Unclosed string literal starting at position 9');
    })

    it('should handle empty input', () => {
        const input = ''
        const lexer = new Lexer(input);
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 0 });
    })

    it('should handle input with only whitespace', () => {
        const input = '   \t\n'
        const lexer = new Lexer(input);
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 5 });
    })

    it('should return UNKNOWN token for unsupported characters', () => {
        const input = 'eq(123)';
        const lexer = new Lexer(input);

        lexer.nextToken(); // eq
        lexer.nextToken(); // (
        expect(lexer.nextToken()).toEqual({ type: TokenType.Unknown, value: '1', position: 3 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.Unknown, value: '2', position: 4 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.Unknown, value: '3', position: 5 })
    })

    it('should correctly tokenize expression with numbers as part of identifiers or arguments if allowed', () => {
        const input = 'gt("user123", "value42")';
        const lexer = new Lexer(input);

        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'gt', position: 0 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.LParen, value: '(', position: 2 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'user123', position: 3 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.Comma, value: ',', position: 12 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.StringLiteral, value: 'value42', position: 14 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.RParen, value: ')', position: 23 })
        expect(lexer.nextToken()).toEqual({ type: TokenType.EOF, value: '', position: 24 })
    })

    it('should reset position correctly', () => {
        const input = 'eq("a", "b")';
        const lexer = new Lexer(input);

        lexer.nextToken(); // eq
        lexer.nextToken(); // (
        lexer.reset();
        expect(lexer.nextToken()).toEqual({ type: TokenType.Identifier, value: 'eq', position: 0 })
    })
})