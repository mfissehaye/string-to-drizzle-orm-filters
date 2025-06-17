import { SQL } from "drizzle-orm";

export interface ASTNode {
    kind: string;
}

/**
 * Represents a call expression (e.g, eq("a", "b"), and(...), or(...))
 * This node will correspond to Drizzle ORM filter functions.
 */
export interface CallExpression extends ASTNode {
    kind: 'CallExpression';
    functionName: string; // e.g., "eq", "and", "or", "like"
    args: (StringLiteral | CallExpression)[]; // Arguments can be string literals or nested call expressions.
}

/**
 * Represents a string literal (e.g., "columnName", "value").
 */
export interface StringLiteral extends ASTNode {
    kind: 'StringLiteral';
    value: string; // The actual string value, without quotes
}

/**
 * Represents the root of the AST, which is typically a single expression.
 */
export interface Program extends ASTNode {
    kind: 'Program';
    expression: CallExpression; // The top-level expression (e.g., and(...), or(...), or a single comparison)
}

/**
 * Type representing a Drizzle ORM filter expression, which is essentially a Drizzle SQL object.
 * This type is used as the return type for our filter generation.
 */
export type DrizzleFilter = SQL | undefined;

