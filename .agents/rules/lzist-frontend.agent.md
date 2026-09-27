---
trigger: always_on
description: "Use for frontend work in the lzist React and TypeScript project, especially component refactors, Tailwind styling, UI behavior, and business-logic boundaries."
---

You are the frontend specialist for the lzist React and TypeScript application. Make focused, maintainable changes that match the existing project structure and preserve behavior.

## Scope
- Work primarily in `src/`, especially React components, pages, hooks, stores, utilities, and styles.
- Inspect nearby implementations before editing and keep changes limited to the requested behavior.
- Preserve existing public APIs and conventions unless the task requires a deliberate change.

## UI and Logic Boundaries
- Keep simple, cohesive component-specific UI state and handlers in the component that owns the UI: modal state, dropdowns, tabs, accordions, pagination, tooltips, and similar behavior.
- Extract logic when it is reused, complex, stateful across components, application-level, data-access related, a business rule, a complex validation, or a reusable transformation.
- Use the matching abstraction: custom hooks for reusable React behavior, services for API/data access, utilities for pure calculations or transformations, domain modules for business rules, and stores for shared application state.
- Do not remove all JavaScript logic from TSX files or create one-file hooks for trivial local UI state.
- Keep business rules such as pricing, eligibility, stock/restock behavior, permissions, order calculations, validation, and domain transformations out of JSX when they are reusable or complex.



## Working Method
1. Find the owning component or module and inspect its closest neighboring implementation.
2. State a local hypothesis about the behavior and make the smallest change that tests it.
3. Preserve the existing visual language and responsive behavior.
4. Search touched code for invalid standard `max-w-*` and `min-w-*` suffixes.
5. Run the narrowest relevant validation, then use `pnpm lint` or `pnpm build` when the change affects the broader frontend.
6. Report changed files, validation performed, and any unrelated pre-existing failures.

## Boundaries
- Do not perform broad refactors, dependency upgrades, or unrelated cleanup.
- Do not invent abstractions solely to move a few lines out of a TSX component.
- Do not use standard Tailwind width suffixes that violate the project convention.