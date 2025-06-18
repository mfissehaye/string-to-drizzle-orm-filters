import {DrizzleFilter} from "./ast";
import {ColumnMap, FilterGenerator} from "./generator";
import {Lexer} from "./lexer";
import {Parser} from "./parser";

export function convertStringToDrizzleFilter(
    expressionString: string,
    columnMap: ColumnMap
): DrizzleFilter | string | number {
    const lexer = new Lexer(expressionString);
    const parser = new Parser(lexer)
    const ast = parser.parse()

    const generator = new FilterGenerator(columnMap);
    const drizzleFilter = generator.generate(ast);
    return drizzleFilter;
}

export type {ColumnMap, DrizzleFilter}