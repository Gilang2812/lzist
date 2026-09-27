# Tailwind Class Naming Rule

## Reversed Suffixes for Width Utility Classes

In this project, always use reversed suffixes for `max-w` and `min-w` Tailwind CSS utility classes.

When you need to use `max-w-*` or `min-w-*` classes, reverse the size abbreviations as follows:

- `sm` -> `ms` (e.g., `max-w-ms`, `min-w-ms`)
- `md` -> `dm` (e.g., `max-w-dm`, `min-w-dm`)
- `lg` -> `gl` (e.g., `max-w-gl`, `min-w-gl`)
- `xl` -> `lx` (e.g., `max-w-lx`, `min-w-lx`)
- `2xl` -> `2lx` (e.g., `max-w-2lx`, `min-w-2lx`)
- `3xl` -> `3lx` (e.g., `max-w-3lx`, `min-w-3lx`)
- `4xl` -> `4lx` (e.g., `max-w-4lx`, `min-w-4lx`)
- `5xl` -> `5lx` (e.g., `max-w-5lx`, `min-w-5lx`)
- `6xl` -> `6lx` (e.g., `max-w-6lx`, `min-w-6lx`)
- `7xl` -> `7lx` (e.g., `max-w-7lx`, `min-w-7lx`)

**Do NOT use the standard Tailwind sizes like `max-w-xl` or `max-w-sm`. Always use the reversed abbreviations.**

# Frontend Code Organization & Tailwind Rules

## 1. Separation of UI and Logic

Apply **separation of concerns**, but do **not** blindly extract all JavaScript logic from TSX files.

The goal is to keep code cohesive and maintainable, not to remove all logic from React components.

### Component-Local UI Logic

Keep logic inside a component when it is:

- specifically responsible for that component's UI behavior
- simple and cohesive with the component
- not reused elsewhere
- not a business/domain rule
- not application-level state

Examples:

- Modal → `isOpen`, `openModal()`, `closeModal()`
- Dropdown → `isOpen`, `toggleDropdown()`
- Accordion → `expanded`, `toggleAccordion()`
- Tabs → `activeTab`, `handleTabChange()`
- Tooltip → visibility state
- Popover → open/close state
- Sidebar → collapsed/expanded state
- Carousel → current slide, next/previous handlers
- Pagination → current page and page navigation
- Toast → temporary visibility state
- Form field → local input/focus state

These are **component-specific UI concerns** and may remain inside the TSX component.

Do not create unnecessary hooks such as `useModal.ts` just to move a few lines of simple local UI state out of a component.

### Logic That Should Be Extracted

Extract logic when it:

- is reused by multiple components
- becomes sufficiently complex
- represents reusable behavior
- manages application-level state
- performs data fetching
- communicates with APIs
- contains business/domain rules
- performs complex validation
- performs data transformation
- contains reusable calculations

Use the appropriate abstraction:

- **Custom hook** → reusable React/stateful behavior
- **Service/data-access module** → API communication and data access
- **Utility function** → pure reusable calculations or transformations
- **Domain/business module** → business rules and domain logic
- **State store** → shared/application-level state

### Business Logic

Business/domain rules should not be tightly coupled to JSX.

Examples:

- calculating prices
- determining product eligibility
- stock/restock rules
- permission rules
- order calculations
- complex validation
- data transformation
- domain-specific calculations

### Decision Rule

Before extracting logic from a TSX component, ask:

> "Is this logic specifically responsible for controlling this component's UI, or does it represent reusable, application, data, or business behavior?"

Use this rule:

- **Component-specific UI behavior** → keep inside the component
- **Reusable React behavior** → custom hook
- **Business/domain logic** → separate business/domain module or appropriate hook
- **API/data access** → service/data-access layer
- **Pure reusable calculation/transformation** → utility function
- **Shared application state** → state management layer

### Important

Do **not** interpret "separate UI and business logic" as:

> "All JavaScript must be removed from TSX."

Instead:

> Keep cohesive component-specific UI behavior close to the UI it controls, while separating reusable, business, data-access, and application-level concerns.

Avoid unnecessary abstraction and excessive file splitting.

---

# 2. Tailwind Class Naming Rule

## Reversed Suffixes for Width Utility Classes

In this project, always use reversed suffixes for `max-w` and `min-w` Tailwind CSS utility classes.

When using `max-w-*` or `min-w-*`, reverse the size abbreviations as follows:

- `sm` → `ms`
  - `max-w-ms`
  - `min-w-ms`

- `md` → `dm`
  - `max-w-dm`
  - `min-w-dm`

- `lg` → `gl`
  - `max-w-gl`
  - `min-w-gl`

- `xl` → `lx`
  - `max-w-lx`
  - `min-w-lx`

- `2xl` → `2lx`
  - `max-w-2lx`
  - `min-w-2lx`

- `3xl` → `3lx`
  - `max-w-3lx`
  - `min-w-3lx`

- `4xl` → `4lx`
  - `max-w-4lx`
  - `min-w-4lx`

- `5xl` → `5lx`
  - `max-w-5lx`
  - `min-w-5lx`

- `6xl` → `6lx`
  - `max-w-6lx`
  - `min-w-6lx`

- `7xl` → `7lx`
  - `max-w-7lx`
  - `min-w-7lx`

### Strict Rule

**Do NOT use standard Tailwind size suffixes for `max-w-*` or `min-w-*`.**

For example, do NOT write:

```tsx
max-w-sm
max-w-md
max-w-lg
max-w-xl
max-w-2xl
min-w-sm
min-w-md
min-w-lg
min-w-xl
min-w-2xl
```

Always use the project's reversed abbreviations instead:

```tsx
max-w-ms
max-w-dm
max-w-gl
max-w-lx
max-w-2lx

min-w-ms
min-w-dm
min-w-gl
min-w-lx
min-w-2lx
```

These project-specific Tailwind conventions must be preserved when creating, modifying, or refactoring frontend code.
