export enum TokenType {
    Identifier = 'IDENTIFIER', // e.g., "and", "or", "eq", "like"
    StringLiteral = 'STRING_LITERAL', // e.g., '"foo"', '"bar"'
    LParen = 'LPAREN', // '('
    RParen = 'RPAREN', // ')'
    Comma = 'COMMA', // ','
    Whitespace = 'WHITESPACE', // Space, tab, newline (ignored by parser)
    EOF = 'EOF', // End of file
    Unknown = 'UNKNOWN', // For unrecognized characters
}

/**
 * Represents a single token produced by the lexer.
 */
export interface Token {
    type: TokenType;
    value: string;
    position: number; // Starting position of the token in the original string
}

/**
 * The Lexer class is responsible for taking an input string and
 * breaking it down into a sequence of tokens.
 */
export class Lexer {
    private input: string;
    private currentPosition: number;

    constructor(input: string) {
        this.input = input
        this.currentPosition = 0
    }

    /**
     * Resets the lexer's position to the beginning of the input
     */
    public reset(): void {
        this.currentPosition = 0
    }

    public nextToken(): Token {
        this.skipWhitespace();
        if (this.currentPosition >= this.input.length) {
            return this.createToken(TokenType.EOF, '', this.currentPosition)
        }

        const char = this.input[this.currentPosition]!
        switch (char) {
            case '(':
                return this.advanceAndCreateToken(TokenType.LParen, char)
            case ')':
                return this.advanceAndCreateToken(TokenType.RParen, char)
            case ',':
                return this.advanceAndCreateToken(TokenType.Comma, char)
            case '"':
                return this.readStringLiteral();
            default:
                if (this.isLetter(char)) {
                    return this.readIdentifier();
                }
                // Handle other unknown characters or numbers if needed later
                return this.advanceAndCreateToken(TokenType.Unknown, char);
        }
    }

    /**
     * Reads a string literal (e.g., "value") including the quotes.
     */
    private readStringLiteral(): Token {
        const startPos = this.currentPosition;
        this.currentPosition++; // Consume the opening quote
        let value = '';
        while (
            this.currentPosition < this.input.length &&
            this.input[this.currentPosition] !== '"'
        ) {
            // Basic escape sequence handling if neede (e.g., '\"')
            if (this.input[this.currentPosition] === '\\' && this.currentPosition + 1 < this.input.length) {
                value += this.input[this.currentPosition]; // Add backslash
                this.currentPosition++;
                value += this.input[this.currentPosition]; // Add escaped char
            } else {
                value += this.input[this.currentPosition];
            }
            this.currentPosition++;
        }

        if (this.currentPosition >= this.input.length) {
            // Unclosed string literal
            throw new Error(`Unclosed string literal starting at position ${startPos}`)
        }

        this.currentPosition++; // Consume the closing quote
        return this.createToken(TokenType.StringLiteral, value, startPos)
    }

    /**
     * Reads an identifier (e.g., "and", "eq").
     */
    private readIdentifier(): Token {
        const startPos = this.currentPosition;
        while (
            this.currentPosition < this.input.length &&
            this.isLetter(this.input[this.currentPosition]!)
        ) {
            this.currentPosition++;
        }
        const value = this.input.substring(startPos, this.currentPosition);
        return this.createToken(TokenType.Identifier, value, startPos)
    }

    /**
     * Skips over whitespace characters
     */
    private skipWhitespace(): void {
        while (
            this.currentPosition < this.input.length &&
            this.isWhitespace(this.input[this.currentPosition]!)
        ) {
            this.currentPosition++;
        }
    }

    /**
     * Checks if a character is a letter.
     */
    private isLetter(char: string): boolean {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    /**
     * Checks if a character is whitespace.
     */
    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }

    /**
     * Creates a token and advances the current position.
     */
    private advanceAndCreateToken(type: TokenType, value: string): Token {
        const token = this.createToken(type, value, this.currentPosition);
        this.currentPosition++; // Move past the current character
        return token;
    }

    /**
     * Helper to create a token object.
     */
    private createToken(type: TokenType, value: string, position: number): Token {
        return { type, value, position };
    }
}