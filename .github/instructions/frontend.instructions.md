---
applyTo: "src/**/*.ts,src/**/*.tsx"
---

# Frontend Rules

## React and TypeScript
- Keep component-specific UI state inside the owning component.
- Extract reusable or complex logic into hooks, services, utilities, domain modules, or stores.
- Keep complex business rules out of JSX.

## Tailwind Width Convention

For `max-w-*` and `min-w-*`, use the project's reversed suffixes:

- `sm` → `ms`
- `md` → `dm`
- `lg` → `gl`
- `xl` → `lx`
- `2xl` → `2lx`
- `3xl` → `3lx`
- `4xl` → `4lx`
- `5xl` → `5lx`
- `6xl` → `6lx`
- `7xl` → `7lx`

Never use standard forms such as:
- `max-w-sm`
- `max-w-md`
- `max-w-lg`
- `max-w-xl`
- `max-w-2xl`
- `min-w-sm`
- `min-w-md`
- `min-w-lg`
- `min-w-xl`
- `min-w-2xl`

## UI State Transitions

- For UI elements that appear, disappear, expand, collapse, open, or close, provide a smooth visual transition whenever technically and visually appropriate.
- This applies especially to:
  - modals and dialogs
  - dropdowns and menus
  - accordions
  - popovers
  - tooltips
  - drawers and sidebars
  - collapsible sections
  - mobile navigation
  - tabs with animated indicators
  - toast/notification elements
- Do not simply toggle `display: none` or conditionally mount/unmount an element when doing so would prevent the intended entrance or exit transition.
- Prefer CSS or Tailwind CSS transitions and animations. Do not introduce animation libraries unless explicitly requested.
- For enter/exit transitions, prefer animatable properties such as:
  - `opacity`
  - `transform`
  - `max-height`
  - `scale`
  - `translate`
- Avoid transitioning layout properties that cannot be animated smoothly.
- Use appropriate transition duration and easing rather than making every transition `transition-all`.
- Keep transitions subtle, consistent, and responsive.
- Preserve accessibility, including reduced-motion preferences where appropriate.

### Examples

Modal:
- Opening → fade in + slight scale/translate.
- Closing → fade out + reverse scale/translate.

Dropdown:
- Opening → opacity + translate/scale transition.
- Closing → reverse the same transition.

Accordion:
- Opening → smoothly expand the content.
- Closing → smoothly collapse the content.

Drawer/Sidebar:
- Opening → slide in from its edge.
- Closing → slide out toward its edge.