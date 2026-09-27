---
trigger: always_on
---

## UI State & Feedback Components

Progressive Component Decomposition also applies to **UI states and user feedback patterns**.

Loading states, skeletons, empty states, error states, permission states, success states, and similar feedback UI should be treated as reusable component building blocks.

Do not recreate the same state UI independently inside every page or feature.

---

## 1. State Components

Common UI states should be represented by reusable components.

Examples:

```text
State Components
│
├── Loading
├── Skeleton
├── EmptyState
├── ErrorState
├── SuccessState
├── NoPermission
├── NotFound
└── OfflineState
```

The exact components should follow the existing project's needs and design system.

---

## 2. Generic State Components

Create generic components for recurring state patterns.

Examples:

```text
LoadingSpinner
LoadingOverlay
PageLoading
SectionLoading

Skeleton
SkeletonText
SkeletonAvatar
SkeletonCard
SkeletonTable

EmptyState
ErrorState
SuccessState
PermissionState
```

These components should remain generic and should not contain feature-specific business logic.

---

## 3. Skeleton Decomposition

Skeleton components can be composed from smaller skeleton primitives.

Example:

```text
Skeleton
├── SkeletonText
├── SkeletonAvatar
├── SkeletonImage
├── SkeletonButton
└── SkeletonBox
```

A larger skeleton can then compose these primitives:

```text
EmployeeTableSkeleton
├── SkeletonText
├── SkeletonAvatar
├── SkeletonText
└── SkeletonButton
```

Another example:

```text
EmployeeCardSkeleton
├── SkeletonAvatar
├── SkeletonText
├── SkeletonText
└── SkeletonButton
```

Avoid implementing completely independent skeleton markup when an existing skeleton primitive can be composed.

---

## 4. Empty State Decomposition

Empty states should be reusable and composable.

Generic structure:

```text
EmptyState
├── EmptyStateIcon
├── EmptyStateTitle
├── EmptyStateDescription
└── EmptyStateAction
```

Specialized states may compose the generic component:

```text
EmptyState
├── EmptyDataState
├── EmptySearchState
├── EmptyFilterState
└── EmptyPermissionState
```

Examples:

```text
EmptyDataState
→ No data exists.

EmptySearchState
→ Search returned no results.

EmptyFilterState
→ Current filters returned no results.

EmptyPermissionState
→ User cannot access the requested content.
```

The underlying state component should remain reusable while the feature provides the appropriate content.

---

## 5. Error State

Recurring error UI should also be extracted.

Example:

```text
ErrorState
├── ErrorStateIcon
├── ErrorStateTitle
├── ErrorStateDescription
└── ErrorStateAction
```

Possible specialized compositions:

```text
ErrorState
├── NetworkErrorState
├── ServerErrorState
├── ValidationErrorState
└── PermissionErrorState
```

Do not create a completely new error layout inside every feature if an existing error component can represent the same pattern.

---

## 6. Loading Strategy

Loading UI should exist at the appropriate structural level.

Examples:

```text
Page
└── PageLoading

Section
└── SectionLoading

Table
└── TableSkeleton

Card
└── CardSkeleton

Form
└── FormSkeleton
```

Use the state component that matches the scope of the loading operation.

Do not automatically use a full-page loading state when only one section or component is loading.

---

## 7. State Components Should Be Composable

State components should support composition where appropriate.

Example:

```tsx
<EmptyState>
  <EmptyStateIcon />
  <EmptyStateTitle />
  <EmptyStateDescription />
  <EmptyStateAction />
</EmptyState>
```

This allows different features to reuse the same structure while changing their content.

Prefer composition over creating many nearly identical components.

---

## 8. Feature-Specific State Components

A feature may create specialized state components when the generic component does not adequately express the feature's UX.

Example:

```text
Generic
    ↓
EmptyState
    ↓
EmptyDataState
    ↓
EmptyEmployeeState
```

However, feature-specific components should compose the generic state component whenever practical.

Avoid duplicating the underlying layout and styling.

---

## 9. State Variations

When multiple components share the same visual state pattern, extract the common structure.

Example:

```text
Generic State
│
├── Loading
├── Empty
├── Error
└── Success
```

A data-driven component may therefore conceptually follow:

```text
DataComponent
│
├── Loading → Skeleton
├── Empty   → EmptyState
├── Error   → ErrorState
└── Success → Content
```

Keep the state presentation separate from the actual feature content whenever practical.

---

## 10. Avoid Inline State UI Duplication

Avoid repeatedly writing independent implementations such as:

```tsx
if (loading) {
  return (
    <div className="...">
      ...
    </div>
  )
}
```

across many features when the same loading pattern already exists.

Prefer:

```tsx
if (loading) {
  return <PageLoading />
}
```

or:

```tsx
if (loading) {
  return <TableSkeleton />
}
```

Likewise, avoid duplicating empty and error layouts.

Prefer:

```tsx
<EmptyState ... />
```

```tsx
<ErrorState ... />
```

---

## 11. State Components Are Part of the Design System

Treat recurring state components as first-class reusable UI building blocks.

The design system should ideally provide consistent patterns for:

```text
Loading
Skeleton
Empty
Error
Success
Permission
Not Found
Offline
```

This ensures that different features do not invent completely different state experiences for the same situation.

---

## 12. Structural + State Composition

State components can be combined with structural components.

Example:

```text
PageSection
└── ContentPanel
    ├── PanelHeader
    └── PanelBody
        ├── LoadingState
        ├── EmptyState
        ├── ErrorState
        └── Content
```

Another example:

```text
DataPanel
└── PanelBody
    ├── TableSkeleton
    ├── EmptyDataState
    ├── ErrorState
    └── DataTable
```

This allows the same structural component to support multiple UI states without duplicating the surrounding layout.

---

## 13. State Components Must Remain Generic

Generic state components should not know about feature-specific data, APIs, services, or business rules.

Bad:

```text
EmptyState
└── contains employee-specific logic
```

Prefer:

```text
EmptyState
    ↓
EmployeeEmptyState
```

The generic component handles presentation and composition.

The feature component provides feature-specific content and behavior.

---

## 14. Progressive Decomposition Applies to States

Apply the same decomposition principle:

```text
State
  ↓
State Component
  ↓
State Sub-components
  ↓
Specialized State
  ↓
Feature State
```

Example:

```text
EmptyState
│
├── EmptyStateIcon
├── EmptyStateTitle
├── EmptyStateDescription
└── EmptyStateAction
        ↓
EmptyDataState
        ↓
EmployeeEmptyState
```

---

## 15. Reuse Before Creating New State UI

Before creating a new loading, skeleton, empty, error, or feedback component, check:

1. Does an equivalent state component already exist?
2. Can the existing component be configured or composed?
3. Is this merely a specialized version of an existing state?
4. Does the new state introduce a genuinely different visual or interaction pattern?
5. Can the common structure be extracted instead of duplicated?

Prefer extending the existing component system over creating parallel implementations.

---

## 16. Final Principle

The application should treat **content, structure, and state** as composable layers.

```text
Page
│
├── Layout
│   ├── PageHeader
│   └── PageSection
│
├── Structure
│   └── ContentPanel
│       ├── PanelHeader
│       └── PanelBody
│
├── State
│   ├── Loading
│   ├── Skeleton
│   ├── Empty
│   ├── Error
│   └── Permission
│
└── Content
    └── Feature Components
```

The objective is not to maximize the number of files.

The objective is to maximize **meaningful reuse, composition, consistency, separation of responsibility, and maintainability** while avoiding unnecessary abstraction.
