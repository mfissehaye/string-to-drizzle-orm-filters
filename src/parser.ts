import { CallExpression, Program, StringLiteral } from "./ast";
import { Lexer, Token, TokenType } from "./lexer";

export class ParserError extends Error {
    constructor(message: string, public token?: Token) {
        super(message);
        this.name = 'ParserError';
    }
}

/**
 * The Parser class takes a Lexer instance and constructs an Abstraact Syntax Tree (AST)
 * from the stream of tokens
 */
export class Parser {
    private lexer: Lexer
    private lookahead: Token | null = null; // The next token to be consumed

    constructor(lexer: Lexer) {
        this.lexer = lexer;
    }

    public parse(): Program {
        this.lookahead = this.lexer.nextToken(); // Initialize lookahead
        const expression = this.parseExpression();

        if (this.lookahead.type !== TokenType.EOF) {
            throw new ParserError(
                `Unexpected token '${this.lookahead.value}' at position ${this.lookahead.position}. Expected end of input.`,
                this.lookahead,
            )
        }
        return { kind: 'Program', expression }
    }

    private consume(expectedType: TokenType, errorMessage?: string): Token {
        const token = this.lookahead;
        if (!token || token.type !== expectedType) {
            throw new ParserError(
                errorMessage ||
                `Unexpected token '${token?.value}' (type ${token?.type}). Expected ${expectedType}.`,
                token!,
            )
        }
        this.lookahead = this.lexer.nextToken(); // Move to the next token
        return token;
    }

    /**
     * Checks if the current lookahead matches the given type without consuming it.
     */
    private match(type: TokenType): boolean {
        return this.lookahead?.type === type
    }

    /**
     * @Parses a general expression.
     * Currently, this only delegates to logical expressions.
     */
    private parseExpression(): CallExpression {
        return this.parseLogicalExpression();
    }

    private parseLogicalExpression(): CallExpression {
        let expression = this.parsePrimaryExpression();
        while (
            this.match(TokenType.Identifier) &&
            (this.lookahead?.value === 'and' || this.lookahead?.value === 'or')
        ) {
            const operatorToken = this.consume(TokenType.Identifier)
            // const rightExpression = this.parsePrimaryExpression(); // this will be the second argument after a comma
            throw new ParserError(`Unexpected logical operator '${operatorToken.value}' not in a function call.`, operatorToken)
        }
        return expression
    }

    /**
     * Parses a primary expression, which can be a CallExpression or a parenthesized expression.
     */
    private parsePrimaryExpression(): CallExpression {
        if (this.match(TokenType.LParen)) {
            this.consume(TokenType.LParen);
            const expression = this.parseLogicalExpression(); // Recursively parse the expression inside the parentheses
            this.consume(
                TokenType.RParen,
                `Expected ')' to close expression started at position ${expression.kind === 'CallExpression' ? this.lookahead?.position : 'unknown'}.`
            )
            return expression;
        } else if (this.match(TokenType.Identifier)) {
            return this.parseCallExpression();
        } else {
            throw new ParserError(
                `Unexpected token '${this.lookahead?.value}' (type ${this.lookahead?.type}). Expected a function call or a '('.`,
                this.lookahead!,
            )
        }
    }

    /**
     * Parses a function call expression (e.g., `eq("col", "val")`).
     */
    private parseCallExpression(): CallExpression {
        const functionNameToken = this.consume(
            TokenType.Identifier,
            `Expected a function name (identifier) but got '${this.lookahead?.value}' (type ${this.lookahead?.type}).`,
        );
        this.consume(
            TokenType.LParen,
            `Expected '(' after function name '${functionNameToken.value}'.`
        )

        const args: (StringLiteral | CallExpression)[] = this.parseArguments();

        this.consume(
            TokenType.RParen,
            `Expected ')' to close function call '${functionNameToken.value}'.`,
        )

        return {
            kind: 'CallExpression',
            functionName: functionNameToken.value,
            args,
        }
    }

    /**
     * Parses the arguments within a function call.
     * Arguments can be string literals or nested call expressions.
     */
    private parseArguments(): (StringLiteral | CallExpression)[] {
        const args: (StringLiteral | CallExpression)[] = [];

        // Check for empty arguments (.e.g., `func()`)
        if (this.match(TokenType.RParen)) {
            return args;
        }

        // Parse the first argument
        args.push(this.parseArgument());

        // Parse subsequent arguments separated by commas
        while (this.match(TokenType.Comma)) {
            this.consume(TokenType.Comma);
            args.push(this.parseArgument());
        }

        return args;
    }

    private parseArgument(): StringLiteral | CallExpression {
        if (this.match(TokenType.StringLiteral)) {
            const stringToken = this.consume(
                TokenType.StringLiteral,
                `Expected a staring literal but got '${this.lookahead?.value}' (type ${this.lookahead?.type}).`,
            );
            return {
                kind: 'StringLiteral',
                value: stringToken.value,
            }
        } else if (this.match(TokenType.Identifier)) {
            // Allow nested function calls as arguments (e.g., `and(eq(...), or(...))`)
            return this.parseCallExpression();
        } else {
            throw new ParserError(
                `Unexpected token '${this.lookahead?.value}' (type ${this.lookahead?.type}). Expected a string literal or a nested function call as an argument.`,
                this.lookahead!,
            )
        }
    }
}