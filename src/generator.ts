import { eq, and, or, like, ilike, gt, gte, lt, lte, isNull, isNotNull, not, inArray, between, notBetween } from "drizzle-orm";
import { AnyColumn } from "drizzle-orm";
import { Program, CallExpression, StringLiteral, DrizzleFilter, ASTNode } from "./ast";
import { ParserError } from "./parser";

/**
 * Defines the contract for column mapping, allowing string names to be resolved
 * to Drizzle's AnyColumn objects. This is crucial because the input string
 * uses string literals for column names, but Drizzle needs actual column objects.
 * 
 * Example: { "id": users.id, "name": users.name }
 */
export type ColumnMap = Record<string, AnyColumn>;

/**
 * The FilterGenerator class converts an AST (Abstract Syntax Tree) into
 * Drizzle ORM filter expressions.
 */
export class FilterGenerator {
    private columnMap: ColumnMap;
    private drizzleOperators: Record<string, Function>;

    constructor(columnMap: ColumnMap) {
        this.columnMap = columnMap;
        // Map string function names from the input to actual Drizzle ORM functions.
        // Ensure all supported operators from the grammar are included here.
        this.drizzleOperators = {
            eq,
            and,
            or,
            like,
            ilike,
            gt,
            gte,
            lt,
            lte,
            isNull,
            isNotNull,
            not,
            inArray,
            between,
            notBetween,
            // Add other Drizzle operators as needed (e.g., inArray, between)
        }
    }

    /**
     * Generates a Drizzle ORM filter expression from the given AST.
     * 
     * @param ast The root of the AST (Program node) to convert.
     * @returns A Drizzle ORM SQL expression (or undefined if the AST's expression is null).
     */
    public generate(ast: Program): DrizzleFilter {
        if (!ast.expression) {
            return undefined; // Or throw an error if an empty expression is not allowed.
        }
        return this.traverseNode(ast.expression)
    }

    private traverseNode(node: CallExpression | StringLiteral): DrizzleFilter {
        switch (node.kind) {
            case 'CallExpression':
                return this.handleCallExpression(node);
            case 'StringLiteral':
                throw new ParserError(`Unexpected StringLiteral as a top-level filter ${node.value}`);
            default:
                // This should not happen if AST is well-formed
                throw new ParserError(`Unknown AST node kind: ${(node as ASTNode).kind}`)
        }
    }

    /**
     * Handles CallExpression nodes, converting them into Drizzle ORM function calls.
     */
    private handleCallExpression(node: CallExpression): DrizzleFilter {
        const drizzleFunction = this.drizzleOperators[node.functionName];
        if (!drizzleFunction) {
            throw new ParserError(`Unsupported Drizzle ORM function: '${node.functionName}'.`)
        }

        // Process arguments: column references or literal values
        const processedArgs = node.args.map((arg) => {
            if (arg.kind === 'StringLiteral') {
                const isComparisonOperator = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'isNull', 'isNotNull', 'inArray', 'between', 'notBetween'].includes(node.functionName);

                if (isComparisonOperator && this.columnMap[arg.value]) {
                    return this.columnMap[arg.value];
                } else {
                    return arg.value
                }
            } else if (arg.kind === 'CallExpression') {
                return this.traverseNode(arg)
            }
            return undefined // Should not happen with current AST types
        }).filter(val => val !== undefined) // remove any undefined results from mapping

        try {
            return drizzleFunction(...processedArgs);
        } catch (e: any) {
            throw new ParserError(
                `Error calling Drizzle function '${node.functionName}' with arguments [${processedArgs.map(a => typeof a === 'object' && a !== null && 'getSQL' in a ? a.getSQL() : JSON.stringify(a)).join(', ')}]. Original error: ${e.message}`,

            )
        }
    }
}