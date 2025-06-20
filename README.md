# 📖 Overview

`@mfissehaye/string-to-drizzle-orm-filters` is a lightweight TypeScript package designed to convert a simple string-based filter expression into a corresponding Drizzle ORM filter object. This allows you to define complex database query conditions using a human-readable string format, which can then be dynamically applied to your Drizzle ORM queries.

This package is particularly useful for scenarios where you need to:

- Allow users to define custom filtering logic without writing raw SQL.
- Store filter configurations as strings in a database or configuration file.
- Build dynamic query builders or API endpoints that accept filter expressions.

---

## ✨ Features

- **String to AST Parsing**: Converts a filter expression string into an Abstract Syntax Tree (AST).
- **Drizzle ORM Filter Generation**: Transforms the AST into valid Drizzle ORM SQL expressions that can be directly used with `db.select().where(...)`.
- **Support for Logical Operators**: Handles `and`, `or`, and `not`.
- **Support for Comparison Operators**: Includes `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `isNull`, `isNotNull`.
- **Supports String and Number Literals**: Allows both `"value"` and `123` in expressions.
- **Type-Safe**: Written entirely in TypeScript, providing strong typing throughout the parsing and generation process.
- **Modular Design**: Separated into Lexer, Parser, and Generator components for clarity and extensibility.

---

## 📦 Installation

To install the package, run:

```bash
npm install @mfissehaye/string-to-drizzle-orm-filters drizzle-orm
# or
yarn add @mfissehaye/string-to-drizzle-orm-filters drizzle-orm
# or
pnpm add @mfissehaye/string-to-drizzle-orm-filters drizzle-orm
```

> **Note:** Make sure you also have `drizzle-orm` installed, as it's a peer dependency.

---

## 🚀 Usage

### Define Drizzle Schema & DB instance

```ts
// src/schema.ts
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age'),
  email: text('email'),
});
```

```ts
// db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL || 'postgres://user:password@host:port/database');
export const db = drizzle(client, { schema });
```

### Apply Filter

```ts
// your-app/main.ts
import { convertStringToDrizzleFilter, ParserError } from '@mfissehaye/string-to-drizzle-orm-filters';
import { users } from './schema';
import { db } from './db';

async function queryUsersWithDynamicFilter(filterString: string) {
  const columnMap = {
    id: users.id,
    name: users.name,
    age: users.age,
    email: users.email,
  };

  try {
    const drizzleFilter = convertStringToDrizzleFilter(filterString, columnMap);

    if (drizzleFilter) {
      const filteredUsers = await db.select().from(users).where(drizzleFilter);
      console.log(`Query: ${filterString}`);
      console.log('Filtered Users:', filteredUsers);
    } else {
      console.log(`No filter generated for: ${filterString}`);
    }
  } catch (error) {
    if (error instanceof ParserError) {
      console.error(`Error parsing filter string "${filterString}":`, error.message);
      console.error('Problematic token:', error.token);
    } else {
      console.error(`An unexpected error occurred for "${filterString}":`, error);
    }
  }
}
```

### 🔍 Examples

```ts
// Simple equality
queryUsersWithDynamicFilter(`eq("name", "Alice")`);

// Logical AND
queryUsersWithDynamicFilter(`and(gt("age", 25), like("email", "%@example.com%"))`);

// Nested logic
queryUsersWithDynamicFilter(`and(or(eq("id", 1), like("name", "Jo%")), and(gte("age", 30), isNull("email")))`);

// NOT operator
queryUsersWithDynamicFilter(`not(eq("age", 18))`);

// Invalid expression
queryUsersWithDynamicFilter(`eq("name", "Bob", extra)`); // Will throw ParserError
```

---

## ✅ Supported Operators

### Logical Operators

- `and(...)`
- `or(...)`
- `not(...)`

### Comparison Operators

- `eq("column", "value")` — Equals
- `ne("column", "value")` — Not Equals
- `gt("column", value)` — Greater Than
- `gte("column", value)` — Greater Than or Equals
- `lt("column", value)` — Less Than
- `lte("column", value)` — Less Than or Equals
- `like("column", "pattern")` — SQL LIKE (case-sensitive)
- `ilike("column", "pattern")` — SQL ILIKE (PostgreSQL)
- `isNull("column")` — Is NULL
- `isNotNull("column")` — Is NOT NULL

---

## ❗ Error Handling

`convertStringToDrizzleFilter` will throw a `ParserError` if the input expression is invalid.

```ts
import { ParserError } from '@mfissehaye/string-to-drizzle-orm-filters';

try {
  // ...
} catch (error) {
  if (error instanceof ParserError) {
    console.error('Filter parsing error:', error.message);
    console.error('Token:', error.token);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 🛠️ Development & Testing

### Clone and Setup

```bash
git clone https://github.com/mfissehaye/string-to-drizzle-orm-filters.git
cd string-to-drizzle-orm-filters
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript into the `dist/` directory.

### Run Tests

```bash
npm test
```

To run in watch mode:

```bash
npm run test:watch
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request with your suggestions, bug reports, or feature improvements.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
