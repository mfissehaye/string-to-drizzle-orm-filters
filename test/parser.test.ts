import { describe, it, expect } from "vitest";
import { Lexer, TokenType } from "../src/lexer";
import { Parser, ParserError } from '../src/parser'
import { CallExpression, StringLiteral } from "../src/ast";

describe('Parser', () => {
    it('should parse a simple eq expression', () => {
        const input = 'eq("a", "b")';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse();

        expect(ast).toEqual({
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'eq',
                args: [
                    { kind: 'StringLiteral', value: 'a' },
                    { kind: 'StringLiteral', value: 'b' },
                ],
            },
        })
    })

    it('should parse a simple logical expression (and)', () => {
        const input = 'and(eq("a", "b"), gt("c", "10"))';
        const lexer = new Lexer(input)
        const parser = new Parser(lexer);
        const ast = parser.parse()

        expect(ast).toEqual({
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'and',
                args: [
                    {
                        kind: 'CallExpression',
                        functionName: 'eq',
                        args: [
                            { kind: 'StringLiteral', value: 'a' },
                            { kind: 'StringLiteral', value: 'b' },
                        ]
                    },
                    {
                        kind: 'CallExpression',
                        functionName: 'gt',
                        args: [
                            { kind: 'StringLiteral', value: 'c' },
                            { kind: 'StringLiteral', value: '10' }, // Numbers are still string literals for now
                        ]
                    }
                ]
            }
        })
    })

    it('should parse a nested logical expression as per example', () => {
        const input = 'and(or(eq("a", "b"), like("c", "d")), and(gt("e", "f"), ilike("g", "h")))'
        const lexer = new Lexer(input)
        const parser = new Parser(lexer)
        const ast = parser.parse()

        expect(ast).toEqual({
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'and',
                args: [
                    {
                        kind: 'CallExpression',
                        functionName: 'or',
                        args: [
                            {
                                kind: 'CallExpression',
                                functionName: 'eq',
                                args: [
                                    { kind: 'StringLiteral', value: 'a' },
                                    { kind: 'StringLiteral', value: 'b' },
                                ]
                            },
                            {
                                kind: 'CallExpression',
                                functionName: 'like',
                                args: [
                                    { kind: 'StringLiteral', value: 'c' },
                                    { kind: 'StringLiteral', value: 'd' },
                                ]
                            }
                        ]
                    },
                    {
                        kind: 'CallExpression',
                        functionName: 'and',
                        args: [
                            {
                                kind: 'CallExpression',
                                functionName: 'gt',
                                args: [
                                    { kind: 'StringLiteral', value: 'e' },
                                    { kind: 'StringLiteral', value: 'f' },
                                ]
                            },
                            {
                                kind: 'CallExpression',
                                functionName: 'ilike',
                                args: [
                                    { kind: 'StringLiteral', value: 'g' },
                                    { kind: 'StringLiteral', value: 'h' },
                                ]
                            }
                        ]
                    }
                ]
            }
        })
    })

    it('should parse an expression with leading/trailing whitespace', () => {
        const input = '  or ( eq ( "x", "y" ) , ne ( "z", "w" ) )   ';
        const lexer = new Lexer(input)
        const parser = new Parser(lexer)
        const ast = parser.parse()

        expect(ast.expression.functionName).toBe('or')
        expect((ast.expression.args[0] as CallExpression).functionName).toBe('eq')
        expect(((ast.expression.args[0] as CallExpression).args[0] as StringLiteral).value).toBe('x')
    })

    it('should parse an expression with no arguments (e.g., `isNull`)', () => {
        const input = 'isNull("column")'
        const lexer = new Lexer(input)
        const parser = new Parser(lexer)
        const ast = parser.parse()

        expect(ast).toEqual({
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'isNull',
                args: [
                    { kind: 'StringLiteral', value: 'column' }
                ]
            }
        })
    })

    it('should throw ParseError for unexpected EOF', () => {
        const input = 'eq("a", "b"'; // Missing closing parentheses
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);

        // expect(() => parser.parse()).toThrow(ParserError)
        expect(() => parser.parse()).toThrow('Expected \')\' to close function call \'eq\'.')
    })

    it('should throw ParseError for unknown identifier where an expression is expected', () => {
        const input = 'and(eq("a", "b"), 123)'; // 123 is an unknown token type
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);

        // expect(() => parser.parse()).toThrow(ParserError);
        expect(() => parser.parse()).toThrow('Unexpected token \'1\' (type UNKNOWN). Expected a string literal or a nested function call as an argument.')
    })

    // it('should throw ParserError for unmatched parenthesis', () => {
    //     const input = '(eq("a", "b")'; // Missing closing ')'
    //     const lexer = new Lexer(input);
    //     const parser = new Parser(lexer);

    //     // expect(() => parser.parse()).toThrow(ParserError);
    //     expect(() => parser.parse()).toThrow('Expected \')\' to close expression started at position 0.')
    // })

    it('should throw ParserError for empty input', () => {
        const input = '';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);

        expect(() => parser.parse()).toThrow('Unexpected token \'\' (type EOF). Expected a function call or a \'(\'.')
    })

    it('should handle nested logical expressions deeply', () => {
        const input = 'and(eq("a", "b"), or(gt("c", "d"), not(isNull("e"))))';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const ast = parser.parse()

        expect(ast.expression.functionName).toBe('and')
        const orCall = ast.expression.args[1] as CallExpression
        expect(orCall.functionName).toBe('or')
        const notCall = orCall.args[1] as CallExpression;
        expect(notCall.functionName).toBe('not')
        const isNullCall = notCall.args[0] as CallExpression;
        expect(isNullCall.functionName).toBe('isNull')
        expect((isNullCall.args[0] as StringLiteral).value).toBe('e')
    })

    it('should throw ParseError for an identifier not followed by parenthesis (if expecting a call)', () => {
        const input = 'eq "a"';
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);

        expect(() => parser.parse()).toThrow('Expected \'(\' after function name \'eq\'.');
    })
})