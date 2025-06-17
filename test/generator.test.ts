import { describe, it, expect, vi, beforeEach } from "vitest";
import { SQL, eq, and, or, like, ilike, gt, gte, lt, lte, isNull, isNotNull, not } from 'drizzle-orm'
import { AnyColumn } from "drizzle-orm";
import { FilterGenerator, ColumnMap } from '../src/generator'
import { Program, CallExpression, StringLiteral } from "../src/ast";
import { ParserError } from "../src/parser";

const { mockAnd, mockEq, mockOr, mockLike, mockIlike, mockGt, mockGte, mockLt, mockLte, mockIsNull, mockIsNotNull, mockNot } = vi.hoisted(() => {
    // Mock Drizzle ORM function for testing
    const mockEq = vi.fn((col: AnyColumn | string, val: string) => `eq(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockAnd = vi.fn((...args: any[]) => `and(${args.join(', ')})`);
    const mockOr = vi.fn((...args: any[]) => `or(${args.join(', ')})`);
    const mockLike = vi.fn((col: AnyColumn | string, val: string) => `like(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockIlike = vi.fn((col: AnyColumn | string, val: string) => `ilike(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockGt = vi.fn((col: AnyColumn | string, val: string) => `gt(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockGte = vi.fn((col: AnyColumn | string, val: string) => `gte(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockLt = vi.fn((col: AnyColumn | string, val: string) => `lt(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockLte = vi.fn((col: AnyColumn | string, val: string) => `lte(${typeof col === 'object' ? (col as any).__name : col}, "${val}")`);
    const mockIsNull = vi.fn((col: AnyColumn | string) => `isNull(${typeof col === 'object' ? (col as any).__name : col})`);
    const mockIsNotNull = vi.fn((col: AnyColumn | string) => `isNotNull(${typeof col === 'object' ? (col as any).__name : col})`);
    const mockNot = vi.fn((filter: SQL) => `not(${filter})`);
    return { mockAnd, mockEq, mockOr, mockLike, mockIlike, mockGt, mockGte, mockLt, mockLte, mockIsNull, mockIsNotNull, mockNot };
})


// Create mock column objects for testing
const mockUsersTable = {
    id: { __name: 'users.id' } as unknown as AnyColumn,
    name: { __name: 'users.name' } as unknown as AnyColumn,
    age: { __name: 'users.age' } as unknown as AnyColumn,
    email: { __name: 'users.email' } as unknown as AnyColumn,
};

const mockColumnMap: ColumnMap = {
    id: mockUsersTable.id,
    name: mockUsersTable.name,
    age: mockUsersTable.age,
    email: mockUsersTable.email,
    // For the example input:
    a: { __name: 'mock_table.a' } as unknown as AnyColumn,
    c: { __name: 'mock_table.c' } as unknown as AnyColumn,
    e: { __name: 'mock_table.e' } as unknown as AnyColumn,
    g: { __name: 'mock_table.g' } as unknown as AnyColumn,
    column: { __name: 'mock_table.column' } as unknown as AnyColumn,
};

// Mock Drizzle ORM imports to use our spy functions
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: mockEq,
        and: mockAnd,
        or: mockOr,
        like: mockLike,
        ilike: mockIlike,
        gt: mockGt,
        gte: mockGte,
        lt: mockLt,
        lte: mockLte,
        isNull: mockIsNull,
        isNotNull: mockIsNotNull,
        not: mockNot,
    };
});

describe('FilterGenerator', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();
    });

    it('should generate a simple eq filter', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'eq',
                args: [
                    { kind: 'StringLiteral', value: 'name' },
                    { kind: 'StringLiteral', value: 'John Doe' },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        expect(mockEq).toHaveBeenCalledWith(mockUsersTable.name, 'John Doe');
        expect(result).toBe('eq(users.name, "John Doe")');
    });

    it('should generate a simple logical AND filter', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'and',
                args: [
                    {
                        kind: 'CallExpression',
                        functionName: 'eq',
                        args: [
                            { kind: 'StringLiteral', value: 'id' },
                            { kind: 'StringLiteral', value: '123' },
                        ],
                    },
                    {
                        kind: 'CallExpression',
                        functionName: 'gt',
                        args: [
                            { kind: 'StringLiteral', value: 'age' },
                            { kind: 'StringLiteral', value: '18' },
                        ],
                    },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        expect(mockEq).toHaveBeenCalledWith(mockUsersTable.id, '123');
        expect(mockGt).toHaveBeenCalledWith(mockUsersTable.age, '18');
        expect(mockAnd).toHaveBeenCalledWith('eq(users.id, "123")', 'gt(users.age, "18")');
        expect(result).toBe('and(eq(users.id, "123"), gt(users.age, "18"))');
    });

    it('should generate the example nested filter correctly', () => {
        const ast: Program = {
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
                                ],
                            },
                            {
                                kind: 'CallExpression',
                                functionName: 'like',
                                args: [
                                    { kind: 'StringLiteral', value: 'c' },
                                    { kind: 'StringLiteral', value: 'd' },
                                ],
                            },
                        ],
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
                                ],
                            },
                            {
                                kind: 'CallExpression',
                                functionName: 'ilike',
                                args: [
                                    { kind: 'StringLiteral', value: 'g' },
                                    { kind: 'StringLiteral', value: 'h' },
                                ],
                            },
                        ],
                    },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        // Verify individual calls
        expect(mockEq).toHaveBeenCalledWith(mockColumnMap.a, 'b');
        expect(mockLike).toHaveBeenCalledWith(mockColumnMap.c, 'd');
        expect(mockGt).toHaveBeenCalledWith(mockColumnMap.e, 'f');
        expect(mockIlike).toHaveBeenCalledWith(mockColumnMap.g, 'h');

        // Verify nested logical calls
        expect(mockOr).toHaveBeenCalledWith('eq(mock_table.a, "b")', 'like(mock_table.c, "d")');
        expect(mockAnd).toHaveBeenCalledWith('gt(mock_table.e, "f")', 'ilike(mock_table.g, "h")');

        // Verify top-level call
        expect(mockAnd).toHaveBeenCalledWith(
            'or(eq(mock_table.a, "b"), like(mock_table.c, "d"))',
            'and(gt(mock_table.e, "f"), ilike(mock_table.g, "h"))'
        );

        expect(result).toBe(
            'and(or(eq(mock_table.a, "b"), like(mock_table.c, "d")), and(gt(mock_table.e, "f"), ilike(mock_table.g, "h")))'
        );
    });

    it('should handle isNull operator', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'isNull',
                args: [
                    { kind: 'StringLiteral', value: 'email' },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        expect(mockIsNull).toHaveBeenCalledWith(mockUsersTable.email);
        expect(result).toBe('isNull(users.email)');
    });

    it('should handle not operator', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'not',
                args: [
                    {
                        kind: 'CallExpression',
                        functionName: 'eq',
                        args: [
                            { kind: 'StringLiteral', value: 'id' },
                            { kind: 'StringLiteral', value: '123' },
                        ],
                    },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        expect(mockEq).toHaveBeenCalledWith(mockUsersTable.id, '123');
        expect(mockNot).toHaveBeenCalledWith('eq(users.id, "123")');
        expect(result).toBe('not(eq(users.id, "123"))');
    });

    it('should throw ParserError for unsupported Drizzle ORM function', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'unsupportedFunction',
                args: [
                    { kind: 'StringLiteral', value: 'col' },
                    { kind: 'StringLiteral', value: 'val' },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        expect(() => generator.generate(ast)).toThrow(ParserError);
        expect(() => generator.generate(ast)).toThrow("Unsupported Drizzle ORM function: 'unsupportedFunction'");
    });

    it('should treat literal string not found in columnMap as value, not column', () => {
        const ast: Program = {
            kind: 'Program',
            expression: {
                kind: 'CallExpression',
                functionName: 'eq',
                args: [
                    { kind: 'StringLiteral', value: 'some_literal_string' }, // Not in columnMap
                    { kind: 'StringLiteral', value: 'value' },
                ],
            },
        };

        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(ast);

        expect(mockEq).toHaveBeenCalledWith('some_literal_string', 'value');
        expect(result).toBe('eq(some_literal_string, "value")');
    });

    it('should handle empty program (though parser prevents this currently)', () => {
        const emptyAst: Program = {
            kind: 'Program',
            expression: null as any, // Simulate an empty expression, though parser enforces non-null
        };
        const generator = new FilterGenerator(mockColumnMap);
        const result = generator.generate(emptyAst);
        expect(result).toBeUndefined(); // Or throw, based on desired behavior for malformed AST
    });
});