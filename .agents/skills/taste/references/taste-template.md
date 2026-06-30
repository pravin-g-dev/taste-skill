# Taste Profile
<!-- Edit this file to set your coding preferences. -->
<!-- Claude reads this and follows every rule when writing code for this project. -->

## Project
- Language: TypeScript
- Framework: Next.js

## Naming
- Variables/functions: camelCase
- Components: PascalCase
- Files: kebab-case
- Constants: UPPER_SNAKE_CASE
- Boolean variables: prefix with is/has/can (e.g. isLoading, hasError)

## Code Style
- Indent: 2 spaces
- Quotes: single
- Semicolons: true
- Trailing commas: es5
- Max line length: 100

## Patterns
- Components: arrow function (const Foo = () => ...)
- State: Zustand
- Data fetching: React Query (TanStack Query)
- Error handling: try/catch with typed Error subclasses
- Async: async/await (avoid raw .then chains)

## Testing
- Framework: Vitest
- Style: describe/it blocks
- Co-locate test files: true (foo.test.ts next to foo.ts)
- Mocking: vi.mock

## Imports
- Order: external → internal → types
- Exports: prefer named exports
- Avoid barrel files (index.ts re-exports)

## Comments
- Style: minimal, explain WHY not WHAT
- JSDoc: public API and exported functions only
- No commented-out code in commits
