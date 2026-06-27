# AgencyOS UI System

**Document ID:** `blueprint/06_UI_SYSTEM.md`  
**Version:** v1.0  
**Status:** Approved  
**Last Updated:** 2026-06-28  
**Owner:** Product Design & Engineering  
**Depends on:** [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md), [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md), [`blueprint/05_CODING_STANDARDS.md`](05_CODING_STANDARDS.md)

---

## 1. Purpose

AgencyOS serves digital marketing agencies through a dashboard-heavy, data-dense SaaS experience. Without a centralized design system, each feature team would independently solve the same visual, interaction, and accessibility problems — producing inconsistent interfaces, duplicated effort, and elevated maintenance cost.

This document is the **official AgencyOS Design System**. It defines reusable visual and interaction standards that every page, feature module, and shared component must follow.

| This document defines | This document does not define |
|-----------------------|------------------------------|
| Design tokens, typography, spacing, and color semantics | Screen layouts, wireframes, or page mockups |
| Component behavior and appearance standards | Component implementation or source code |
| Form, table, dashboard, and notification conventions | Business workflows or user journeys |
| Accessibility, responsiveness, and motion rules | Brand marketing assets or logo specifications |

Shared UI components live in the presentation layer defined in [Architecture §6](03_ARCHITECTURE.md#6-frontend-architecture). Feature modules consume design system components — they do not redefine them. Presentational components contain no business logic, per [Coding Standards §9](05_CODING_STANDARDS.md#9-react-standards).

Any deviation from this system requires design review and documentation in the UI blueprint or an ADR.

---

## 2. Design Principles

Every design decision in AgencyOS aligns with these principles.

| Principle | Definition |
|-----------|------------|
| **Simple** | Remove visual noise. Every element on screen must earn its place. Prefer clarity over decoration |
| **Fast** | Perceived performance is a design requirement. Loading states, skeletons, and progressive disclosure prevent user uncertainty during data fetch |
| **Minimal** | Use the fewest UI elements needed to complete a task. Avoid redundant labels, borders, and containers |
| **Enterprise** | Professional tone suitable for agency leadership, account managers, and operations teams. No playful or consumer-app aesthetics |
| **Accessible** | WCAG 2.1 AA compliance is mandatory — not optional. Accessibility is designed in, not bolted on |
| **Consistent** | Identical interactions produce identical results across all modules. Users learn the system once |
| **Mobile First** | Layout and interaction patterns are designed for small screens first, then enhanced for larger viewports |
| **Scalable** | Tokens and components support future theming, white-labeling, and dark mode without structural rework |

When principles conflict, prioritize in this order: **Accessible → Consistent → Simple → Fast**.

---

## 3. Color System

Colors are defined as **semantic design tokens** — never as raw values in feature code. Token names describe purpose, not appearance. Actual color values are assigned in the theme configuration layer and may change without affecting component logic.

### Semantic Color Tokens

| Token | Purpose |
|-------|---------|
| `color.primary` | Primary brand actions — main CTAs, active navigation, key links |
| `color.primary.hover` | Hover state for primary elements |
| `color.primary.muted` | Subtle primary tint for backgrounds and highlights |
| `color.secondary` | Secondary actions — alternative CTAs, supporting emphasis |
| `color.secondary.hover` | Hover state for secondary elements |
| `color.success` | Positive outcomes — completed tasks, successful operations, healthy status |
| `color.success.muted` | Success background tint for alerts and status chips |
| `color.warning` | Caution states — pending review, approaching deadlines, non-critical issues |
| `color.warning.muted` | Warning background tint |
| `color.danger` | Destructive actions, errors, critical failures, irreversible operations |
| `color.danger.muted` | Danger background tint |
| `color.info` | Informational messages, neutral guidance, system notices |
| `color.info.muted` | Info background tint |
| `color.background` | Application canvas — outermost page background |
| `color.surface` | Elevated content areas — cards, panels, modals, sidebars |
| `color.surface.raised` | Second-level elevation — nested panels, popovers |
| `color.border` | Default borders — dividers, input outlines, table lines |
| `color.border.strong` | Emphasized borders — focus rings, active selections |
| `color.text.primary` | Primary readable text — headings, body, labels |
| `color.text.secondary` | Supporting text — descriptions, metadata, timestamps |
| `color.text.muted` | De-emphasized text — placeholders, disabled labels, hints |
| `color.text.inverse` | Text on dark or primary-colored backgrounds |
| `color.text.link` | Interactive text links |
| `color.text.link.hover` | Link hover state |

### Usage Rules

| Rule | Requirement |
|------|-------------|
| **Semantic tokens only** | Feature code references token names — never hardcoded color values |
| **No color as sole indicator** | Status, errors, and required fields use icon, text, or pattern in addition to color |
| **Contrast compliance** | All text/background token pairs must meet WCAG 2.1 AA contrast ratios in both light and dark themes |
| **Danger sparingly** | `color.danger` reserved for destructive actions and error states — not decoration |
| **Muted variants for backgrounds** | Status chips, alerts, and badges use `.muted` token variants for backgrounds |
| **Tenant branding** | Workspace-level brand customization overrides `color.primary` and `color.secondary` tokens only — all other tokens remain platform-controlled |

---

## 4. Typography

Typography tokens define a consistent type hierarchy across all modules. Font families are configured in the theme layer; components reference tokens only.

### Type Roles

| Token | Usage | Weight | Line Height |
|-------|-------|--------|-------------|
| `font.display` | Marketing landing pages, empty state headlines | Bold | Tight (1.1–1.2) |
| `font.heading.lg` | Page titles, primary section headers | Semibold | Snug (1.25) |
| `font.heading.md` | Card titles, dialog headers, panel headers | Semibold | Snug (1.25) |
| `font.heading.sm` | Subsection headers, table group headers | Semibold | Normal (1.4) |
| `font.title` | List item titles, entity names, navigation group labels | Medium | Normal (1.4) |
| `font.subtitle` | Secondary titles, card subtitles, modal descriptions | Regular | Normal (1.5) |
| `font.body` | Default body text, descriptions, paragraph content | Regular | Relaxed (1.5–1.6) |
| `font.body.sm` | Compact body text in dense layouts — tables, sidebars | Regular | Normal (1.4) |
| `font.caption` | Timestamps, footnotes, tertiary metadata | Regular | Normal (1.4) |
| `font.label` | Form labels, table column headers, badge text, button text | Medium | Normal (1.2) |
| `font.code` | Inline code, IDs, API references, technical values | Regular (monospace) | Normal (1.4) |

### Font Scale

Typography sizes follow a modular scale anchored to a base size token.

| Token | Scale Step |
|-------|-----------|
| `font.size.xs` | Base − 2 steps |
| `font.size.sm` | Base − 1 step |
| `font.size.base` | Base (reference size) |
| `font.size.md` | Base + 1 step |
| `font.size.lg` | Base + 2 steps |
| `font.size.xl` | Base + 3 steps |
| `font.size.2xl` | Base + 4 steps |
| `font.size.3xl` | Base + 5 steps |

### Rules

| Rule | Requirement |
|------|-------------|
| **Token mapping** | Each type role maps to a size token — components do not set arbitrary font sizes |
| **Maximum two weights per view** | A single viewport area uses at most two font weights to maintain visual hierarchy |
| **No uppercase body text** | Uppercase reserved for `font.label` in badges, chips, and column headers only |
| **Truncation** | Long text truncates with ellipsis; full content available via tooltip or expansion |
| **Monospace scope** | `font.code` used only for machine-readable values — not for emphasis |
| **Responsive scaling** | Display and heading tokens may reduce by one scale step on mobile viewports |

---

## 5. Spacing System

All spacing values derive from a **4px base unit**. Spacing tokens ensure consistent rhythm across margins, padding, gaps, and section separation.

### Spacing Tokens

| Token | Value | Typical Use |
|-------|-------|-------------|
| `space.0` | 0 | Reset |
| `space.1` | 4px | Tight inline gaps — icon-to-label, badge padding |
| `space.2` | 8px | Compact element spacing — form field internal padding |
| `space.3` | 12px | Small component padding — buttons, chips, inputs |
| `space.4` | 16px | Default component padding — cards, list items |
| `space.5` | 20px | Medium gaps between related elements |
| `space.6` | 24px | Standard section inner padding |
| `space.8` | 32px | Section separation within a page |
| `space.10` | 40px | Large section gaps |
| `space.12` | 48px | Page section separation |
| `space.16` | 64px | Major layout divisions |

### Margins

| Rule | Requirement |
|------|-------------|
| **Token-only margins** | All margins use spacing tokens — no arbitrary values |
| **Vertical rhythm** | Stacked elements maintain consistent vertical spacing using the scale |
| **Collapse adjacent margins** | Layout system handles margin collapse; components do not compensate manually |
| **No negative margins** | Negative margins prohibited except in layout primitives managed by the design system |

### Padding

| Rule | Requirement |
|------|-------------|
| **Consistent internal padding** | All components of the same type use identical padding tokens |
| **Touch targets** | Interactive elements maintain minimum padding to achieve 44×44px touch target on mobile |

### Grid

| Token | Value |
|-------|-------|
| `grid.columns` | 12 |
| `grid.gutter.sm` | `space.4` (16px) |
| `grid.gutter.md` | `space.6` (24px) |
| `grid.gutter.lg` | `space.8` (32px) |
| `grid.margin` | Matches container horizontal padding per breakpoint |

### Section Spacing

| Context | Token |
|---------|-------|
| Between form fields | `space.4` |
| Between form sections | `space.8` |
| Between page header and content | `space.6` |
| Between major page sections | `space.12` |
| Between unrelated content blocks | `space.8` minimum |

---

## 6. Border Radius

Border radius tokens define consistent corner treatment across components.

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 4px | Inputs, badges, chips, small buttons, tooltips |
| `radius.md` | 8px | Cards, dropdowns, alerts, modals, standard buttons |
| `radius.lg` | 12px | Large cards, dialogs, panels, image containers |
| `radius.pill` | 9999px | Pill buttons, status chips, tag inputs, toggle tracks |
| `radius.full` | 50% | Avatars, circular icon buttons, dot indicators |

### Rules

| Rule | Requirement |
|------|-------------|
| **Token-only radius** | Components reference radius tokens — no custom values |
| **Nested consistency** | Inner elements use a smaller radius token than their container |
| **No mixed radius** | A single component uses one radius token — not different corners |
| **Avatars always full** | User and entity avatars always use `radius.full` |

---

## 7. Elevation

Elevation communicates depth and layering through shadow tokens. Higher elevation indicates closer proximity to the user.

### Shadow Tokens

| Token | Level | Usage |
|-------|-------|-------|
| `elevation.0` | None | Flat elements — inline content, table rows, form fields |
| `elevation.1` | Subtle | Cards at rest, sidebar, sticky headers |
| `elevation.2` | Low | Hovered cards, raised buttons, dropdown menus |
| `elevation.3` | Medium | Popovers, floating action areas, autocomplete panels |
| `elevation.4` | High | Modals, dialogs, drawers |
| `elevation.5` | Highest | Toast notifications, critical overlays, command palette |

### Component Elevation Mapping

| Component | Rest State | Active/Open State |
|-----------|-----------|-------------------|
| **Card** | `elevation.1` | `elevation.2` on hover (if interactive) |
| **Dialog / Modal** | — | `elevation.4` |
| **Drawer** | — | `elevation.4` |
| **Dropdown** | — | `elevation.3` |
| **Toast** | — | `elevation.5` |
| **Tooltip** | — | `elevation.3` |
| **Sticky header** | `elevation.1` when scrolled | — |

### Rules

| Rule | Requirement |
|------|-------------|
| **One elevation level per layer** | Overlapping elements must differ by at least one elevation level |
| **Dark mode adjustment** | Shadow tokens may reduce intensity in dark mode; surface color shift supplements depth |
| **No custom shadows** | Feature code does not define shadow values |
| **Backdrop for overlays** | Modals, dialogs, and drawers include a semi-transparent backdrop using `color.background` at reduced opacity |

---

## 8. Icons

Icons provide visual shorthand for actions, statuses, and navigation. Consistency in icon selection and sizing prevents visual fragmentation.

### Icon Library Standard

| Rule | Requirement |
|------|-------------|
| **Single library** | One icon library used across the entire platform — no mixing libraries |
| **Stroke style** | Outline (stroke) icons as default; filled variants for active/selected states only |
| **Consistent stroke width** | Uniform stroke weight across all icons at each size tier |
| **No emoji as icons** | Emoji are not substitutes for UI icons |
| **Brand icons** | Third-party brand logos (Google, Meta, Stripe) use official brand assets — not generic substitutes |

### Icon Size Tokens

| Token | Size | Usage |
|-------|------|-------|
| `icon.xs` | 12px | Inline with caption text, badge adornments |
| `icon.sm` | 16px | Buttons, inputs, table actions, navigation items |
| `icon.md` | 20px | Standalone action icons, list item leading icons |
| `icon.lg` | 24px | Empty states, feature highlights, dialog headers |
| `icon.xl` | 32px | Empty state illustrations (icon-only, no custom illustration) |

### Usage Rules

| Rule | Requirement |
|------|-------------|
| **Icon + label** | Interactive icons include a visible text label or accessible name — icon-only buttons require tooltip and `aria-label` |
| **Color inheritance** | Icons inherit text color from their parent — no independent icon colors except status indicators |
| **Status icons** | Status chips and alerts pair icons with semantic color tokens |
| **Decorative icons** | Purely decorative icons use `aria-hidden="true"` |
| **Alignment** | Icons vertically centered with adjacent text using flex alignment — not manual offset |
| **No icon overload** | Maximum one leading icon per list item, table row action set, or navigation entry |

---

## 9. Layout System

The layout system defines the application shell and content structure for all authenticated views. Layout behavior aligns with the workspace-aware routing model in [Architecture §6](03_ARCHITECTURE.md#6-frontend-architecture).

### Responsive Breakpoints

| Token | Min Width | Target Device |
|-------|-----------|---------------|
| `breakpoint.mobile` | 0 | Mobile phones |
| `breakpoint.tablet` | 768px | Tablets, small laptops |
| `breakpoint.laptop` | 1024px | Laptops, small desktops |
| `breakpoint.desktop` | 1280px | Standard desktops |
| `breakpoint.wide` | 1536px | Large monitors |

### Container Widths

| Token | Max Width | Usage |
|-------|-----------|-------|
| `container.sm` | 640px | Narrow forms, authentication views |
| `container.md` | 768px | Single-column content, settings pages |
| `container.lg` | 1024px | Standard content pages |
| `container.xl` | 1280px | Dashboard and data-dense views |
| `container.full` | 100% | Full-bleed layouts — tables, kanban boards |

### Grid

| Rule | Requirement |
|------|-------------|
| **12-column grid** | All page layouts use the 12-column grid at tablet and above |
| **Responsive collapse** | Multi-column layouts collapse to single column at mobile breakpoint |
| **Gutter scaling** | Grid gutter increases at larger breakpoints per spacing tokens |

### Application Shell

| Region | Behavior |
|--------|----------|
| **Sidebar** | Primary navigation; collapsible to icon-only mode at laptop; hidden behind overlay at mobile |
| **Header** | Workspace context, global search, notifications, user menu; fixed at top |
| **Content area** | Scrollable main region; fills remaining viewport below header |
| **Footer** | Optional; used only for legal links and version info — not primary navigation |

### Sidebar Behavior

| Breakpoint | State |
|------------|-------|
| **Desktop / Wide** | Expanded by default; user may collapse to icon-only |
| **Laptop** | Collapsed to icon-only by default; expandable on hover or toggle |
| **Tablet** | Hidden; accessible via hamburger toggle as overlay drawer |
| **Mobile** | Hidden; accessible via hamburger toggle as full-screen overlay drawer |

Sidebar state persistence follows the rules in §17 (Dark Mode — Persistence applies to all user layout preferences).

### Header Behavior

| Element | Position |
|---------|----------|
| Workspace switcher | Left section |
| Global search | Center (desktop/laptop); icon trigger (mobile/tablet) |
| Notifications, user menu | Right section |
| Breadcrumb | Below header or inline within content area — not duplicated in header |

### Content Area

| Rule | Requirement |
|------|-------------|
| **Consistent padding** | Content area uses `space.6` horizontal padding at desktop; `space.4` at mobile |
| **Max width constraint** | Content respects container token unless explicitly full-bleed |
| **Scroll ownership** | Content area scrolls independently; header and sidebar remain fixed |
| **Page header pattern** | Every page includes a title region (heading + optional actions) above main content |

---

## 10. Component Standards

These standards define the required behavior, appearance, and interaction patterns for each component type. Implementation resides in the shared UI layer — feature modules consume, never redefine.

### Buttons

| Variant | Usage |
|---------|-------|
| **Primary** | Single main action per view region |
| **Secondary** | Supporting actions |
| **Ghost** | Tertiary actions, toolbar items |
| **Danger** | Destructive actions — requires confirmation for irreversible operations |
| **Link** | Inline text actions |

| Rule | Requirement |
|------|-------------|
| One primary button per action group | |
| Minimum touch target 44×44px on mobile | |
| Loading state replaces label with spinner — button disabled during loading | |
| Disabled state visually distinct and non-interactive | |
| Icon placement: leading for actions, trailing for navigation/external | |

### Inputs

| Rule | Requirement |
|------|-------------|
| Single-line text input as default form control | |
| Label above input, associated via `htmlFor` / `id` | |
| Placeholder is supplementary — never replaces label | |
| Error state: border uses `color.danger`, error message below input | |
| Character count shown when maxlength is enforced | |

### Textarea

| Rule | Requirement |
|------|-------------|
| Multi-line text entry with configurable row minimum | |
| Vertical resize allowed; horizontal resize disabled | |
| Auto-grow option for comment and note fields | |
| Same label, error, and helper text patterns as Inputs | |

### Select

| Rule | Requirement |
|------|-------------|
| Single selection from predefined options | |
| Search/filter when option count exceeds 8 | |
| Selected value always visible in closed state | |
| Keyboard navigable with typeahead | |

### Multi Select

| Rule | Requirement |
|------|-------------|
| Multiple selection displayed as chips within the input | |
| Select-all and clear-all actions when option count exceeds 8 | |
| Selected count summary when space is constrained | |

### Checkbox

| Rule | Requirement |
|------|-------------|
| Binary and indeterminate states supported | |
| Label clickable alongside checkbox control | |
| Grouped checkboxes use fieldset with legend | |

### Radio

| Rule | Requirement |
|------|-------------|
| Mutually exclusive selection within a group | |
| Minimum two options; vertical stack layout default | |
| Selected state clearly distinct | |

### Switch

| Rule | Requirement |
|------|-------------|
| Toggle for immediate on/off settings — not form submission values | |
| Label describes the enabled state | |
| State change takes effect immediately unless in a form context | |

### Date Picker

| Rule | Requirement |
|------|-------------|
| Calendar popover for date selection | |
| Manual text entry with format validation as alternative input | |
| Date format follows workspace locale setting | |
| Range selection variant for date range filters | |

### Currency Input

| Rule | Requirement |
|------|-------------|
| Numeric input with currency symbol prefix from workspace settings | |
| Thousand separators and decimal precision per locale | |
| Stores and displays formatted value; submits normalized numeric value | |
| Right-aligned text | |

### Avatar

| Rule | Requirement |
|------|-------------|
| Circular (`radius.full`) image or initials fallback | |
| Size tokens: `avatar.sm` (24px), `avatar.md` (32px), `avatar.lg` (40px), `avatar.xl` (56px) | |
| Initials derived from display name — maximum two characters | |
| Status indicator dot optional for online/presence | |

### Badge

| Rule | Requirement |
|------|-------------|
| Numeric count or short label overlay | |
| Used for notification counts, item totals, unread indicators | |
| Maximum display value capped with overflow indicator (e.g., "99+") | |

### Status Chip

| Rule | Requirement |
|------|-------------|
| Compact label representing entity state — see §14 for status vocabulary | |
| Uses semantic color token muted variant for background | |
| Optional leading status icon | |
| Pill shape (`radius.pill`) | |

### Tooltip

| Rule | Requirement |
|------|-------------|
| Appears on hover and focus — not on click | |
| Maximum width constrained; text wraps | |
| Delay before show: 300ms; immediate hide on mouse leave | |
| Never contains interactive content | |

### Toast

| Rule | Requirement |
|------|-------------|
| Temporary notification at screen edge — auto-dismisses | |
| Variants: success, warning, error, info — see §15 | |
| Maximum three visible simultaneously; queued thereafter | |
| Dismissible via close action; persistent only for critical errors | |
| Position: bottom-right (desktop), bottom-center (mobile) | |

### Alert

| Rule | Requirement |
|------|-------------|
| Persistent inline message within page content | |
| Variants: success, warning, error, info | |
| Optional title and dismiss action | |
| Used for page-level context — not transient feedback (use Toast) | |

### Modal

| Rule | Requirement |
|------|-------------|
| Centered overlay for focused tasks requiring user decision | |
| Sizes: `sm`, `md`, `lg` — mapped to container tokens | |
| Traps focus; closes on Escape and backdrop click (unless destructive confirmation) | |
| Primary action right-aligned; cancel/secondary left of primary | |
| Maximum one modal open at a time | |

### Drawer

| Rule | Requirement |
|------|-------------|
| Side panel overlay for detail views, filters, and secondary workflows | |
| Slides from right (default) or left (navigation on mobile) | |
| Width: `md` (400px) or `lg` (560px) | |
| Does not block entire viewport — underlying content visible but inert | |

### Tabs

| Rule | Requirement |
|------|-------------|
| Horizontal tab list for section switching within a page | |
| Active tab visually distinct with underline or background indicator | |
| Tab content lazy-loaded on first activation | |
| Overflow: scrollable tab list on mobile — not wrapping to multiple rows | |
| Maximum seven tabs per group; use nested navigation beyond that | |

### Accordion

| Rule | Requirement |
|------|-------------|
| Vertically stacked expandable sections | |
| Single or multiple expand mode — configurable per context | |
| Expanded state indicated by chevron rotation and content reveal | |
| Used for settings groups, FAQ-style content, filter panels | |

### Breadcrumb

| Rule | Requirement |
|------|-------------|
| Reflects navigation hierarchy — not arbitrary path | |
| Current page is terminal item — not linked | |
| Truncates middle segments on narrow viewports with ellipsis menu | |
| Separator: chevron or slash — consistent across platform | |

### Pagination

| Rule | Requirement |
|------|-------------|
| Page number navigation with previous/next controls | |
| Page size selector: standard options (10, 25, 50, 100) | |
| Displays current range and total count (e.g., "1–25 of 342") | |
| Positioned below content — right-aligned on desktop, centered on mobile | |

### Search

| Rule | Requirement |
|------|-------------|
| Text input with search icon; clear button when populated | |
| Debounced input before triggering search — per [Coding Standards §15](05_CODING_STANDARDS.md#15-performance-standards) | |
| Global search accessible from header; contextual search within list/table views | |
| Minimum two characters before search executes | |
| Empty results show Empty State component | |

### Table

| Rule | Requirement |
|------|-------------|
| Primary component for data-dense list views | |
| Standards defined in §12 | |
| Row hover highlight; clickable rows for detail navigation | |
| Action column right-aligned; maximum three visible actions, overflow menu beyond | |

### Card

| Rule | Requirement |
|------|-------------|
| Container for grouped content with `elevation.1` and `radius.md` | |
| Optional header (title + actions), body, and footer regions | |
| Interactive cards: entire surface clickable with hover elevation change | |
| Padding: `space.4` (compact) or `space.6` (standard) | |

### Empty State

| Rule | Requirement |
|------|-------------|
| Displayed when a list, table, or search returns no results | |
| Includes: icon (`icon.lg`), title (`font.heading.sm`), description (`font.body`), optional primary action | |
| Distinguishes "no data yet" (with create action) from "no results found" (with filter guidance) | |

### Skeleton

| Rule | Requirement |
|------|-------------|
| Placeholder shimmer matching the layout of loading content | |
| Used during initial data fetch — replaces Loader for content areas | |
| Matches dimensions of the content it replaces (text lines, cards, table rows) | |
| Animation respects reduced motion preference — see §16 | |

### Loader

| Rule | Requirement |
|------|-------------|
| Spinner for action-level loading — button submits, modal saves | |
| Sizes: `sm` (inline/button), `md` (section), `lg` (full-page) | |
| Full-page loader used only for initial application shell load | |
| Always paired with disabled interaction on the loading target | |

### Charts

| Rule | Requirement |
|------|-------------|
| Uses semantic color tokens for data series | |
| Includes axis labels, legend, and tooltip on hover/focus | |
| Responsive: maintains readability at all container widths | |
| Empty data state uses Empty State component — not blank canvas | |
| Accessible: data available in tabular alternative or screen reader summary | |

### File Upload

| Rule | Requirement |
|------|-------------|
| Drag-and-drop zone with click-to-browse fallback | |
| Displays file name, size, and upload progress per file | |
| Validates file type and size before upload — per [Coding Standards §16](05_CODING_STANDARDS.md#16-security-coding-rules) | |
| Multiple file support with individual remove actions | |
| Error state per file — not just global failure | |

### Rich Text Editor

| Rule | Requirement |
|------|-------------|
| Toolbar with essential formatting: bold, italic, headings, lists, links | |
| Minimal toolbar by default; extended formatting on demand | |
| Outputs structured content — not raw HTML in storage display | |
| Character count when limits apply | |
| Paste sanitization enforced | |

---

## 11. Form Standards

Forms are the primary data entry mechanism across CRM, projects, campaigns, and billing modules.

### Validation

| Rule | Requirement |
|------|-------------|
| Client-side validation on blur and on submit | |
| Server-side validation authoritative — client validation is not a substitute | |
| Validation messages appear below the offending field | |
| Form-level errors displayed in Alert at top of form | |
| Validate on submit always; validate on blur for touched fields | |

### Required Fields

| Rule | Requirement |
|------|-------------|
| Required indicator: asterisk on label | |
| Legend below form title: "* Required field" when any required fields present | |
| Required status communicated to assistive technology via `aria-required` | |

### Errors

| Rule | Requirement |
|------|-------------|
| Error text uses `color.danger` and `font.caption` | |
| Field border transitions to `color.danger` on error | |
| Focus moved to first error field on submit failure | |
| Error summary at form top for multiple errors | |

### Helper Text

| Rule | Requirement |
|------|-------------|
| Displayed below input in `color.text.muted` and `font.caption` | |
| Provides format guidance or context — not redundant with label | |
| Hidden when error message is displayed for the same field | |

### Disabled

| Rule | Requirement |
|------|-------------|
| Visually muted — reduced opacity, non-interactive cursor | |
| Values remain readable | |
| Disabled reason communicated via helper text when non-obvious | |

### Readonly

| Rule | Requirement |
|------|-------------|
| Displays value without edit affordance | |
| Visually distinct from disabled — no opacity reduction | |
| Used for system-generated or locked fields | |

### Loading

| Rule | Requirement |
|------|-------------|
| Submit button shows Loader and is disabled during submission | |
| Form fields disabled during submission to prevent duplicate edits | |
| Optimistic UI not applied to form submissions — wait for server confirmation | |

### Autosave

| Rule | Requirement |
|------|-------------|
| Used for long-form content (notes, descriptions, rich text) — not short forms | |
| Subtle save status indicator: "Saving…", "Saved", "Failed to save" | |
| Debounced save trigger — minimum 2 seconds after last keystroke | |
| Conflict detection with user prompt if server version changed | |

---

## 12. Table Standards

Tables are the primary data display pattern for AgencyOS list views — clients, campaigns, tasks, invoices, and reports.

### Sorting

| Rule | Requirement |
|------|-------------|
| Click column header to toggle sort ascending/descending | |
| Sort indicator icon in active column header | |
| Default sort defined per table; user sort preference persisted per session | |
| Server-side sorting for paginated data — not client-side on full dataset | |

### Filtering

| Rule | Requirement |
|------|-------------|
| Filter controls above table or in Drawer panel | |
| Active filters displayed as removable chips below filter bar | |
| Filter state reflected in URL query parameters for shareability | |
| Clear all filters action when any filter is active | |

### Pagination

| Rule | Requirement |
|------|-------------|
| Server-side pagination mandatory — per [Coding Standards §15](05_CODING_STANDARDS.md#15-performance-standards) | |
| Uses Pagination component standards from §10 | |
| Page size preference persisted per user per table | |

### Column Resize

| Rule | Requirement |
|------|-------------|
| Drag column border to resize — minimum width enforced | |
| Resize preference persisted per user per table | |
| Double-click border resets to default width | |

### Column Hide

| Rule | Requirement |
|------|-------------|
| Column visibility toggle via settings menu or Drawer | |
| Minimum one data column always visible | |
| Hidden column preferences persisted per user per table | |

### Bulk Actions

| Rule | Requirement |
|------|-------------|
| Checkbox column for row selection | |
| Bulk action bar appears above table when one or more rows selected | |
| Select all applies to current page; select all across pages as separate explicit action | |
| Destructive bulk actions require confirmation modal | |

### Sticky Header

| Rule | Requirement |
|------|-------------|
| Table header row remains visible during vertical scroll | |
| Sticky header uses `elevation.1` when scrolled | |

### Responsive Rules

| Breakpoint | Behavior |
|------------|----------|
| **Desktop / Laptop** | Full table with all configured columns |
| **Tablet** | Hide low-priority columns; horizontal scroll as fallback |
| **Mobile** | Transform to card list layout — each row becomes a stacked card with key fields |

### CSV Export

| Rule | Requirement |
|------|-------------|
| Export action in table toolbar | |
| Exports current filtered and sorted dataset — respects active filters | |
| Large exports processed asynchronously with Toast progress notification | |
| Export limited to user permission scope — no cross-tenant data | |

---

## 13. Dashboard Standards

Dashboards aggregate metrics and provide at-a-glance operational visibility across modules.

### Metric Cards

| Rule | Requirement |
|------|-------------|
| Display single KPI: label, value, optional trend indicator | |
| Trend: directional arrow with percentage change and comparison period | |
| Compact layout: `space.4` padding, `font.heading.lg` for value | |
| Loading state uses Skeleton matching card dimensions | |

### Charts

| Rule | Requirement |
|------|-------------|
| Follow Chart component standards from §10 | |
| Dashboard charts prioritize bar, line, and donut types | |
| Maximum four charts per dashboard view before requiring tab or scroll separation | |
| Time range selector shared across dashboard charts in the same view | |

### KPIs

| Rule | Requirement |
|------|-------------|
| Maximum eight KPI metric cards per dashboard row set | |
| KPIs grouped by domain relevance — not arbitrary arrangement | |
| Comparison period labeled (e.g., "vs. last 30 days") | |

### Quick Actions

| Rule | Requirement |
|------|-------------|
| Short list of primary create/navigate actions relevant to the dashboard context | |
| Maximum four quick actions visible; overflow in menu | |
| Secondary button or ghost variant — not primary (dashboard is read-focused) | |

### Widgets

| Rule | Requirement |
|------|-------------|
| Self-contained dashboard panels: recent activity, upcoming deadlines, team workload | |
| Widgets use Card component as container | |
| Each widget has independent loading and error states | |
| Widget content links to full list view for drill-down | |

### Responsive Dashboard

| Breakpoint | Grid |
|------------|------|
| **Desktop / Wide** | 4-column metric cards; 2-column widgets |
| **Laptop** | 3-column metric cards; 2-column widgets |
| **Tablet** | 2-column metric cards; single-column widgets |
| **Mobile** | Single column — all elements stacked |

---

## 14. Status System

Status chips communicate entity state consistently across all modules. Every status maps to a semantic color token and optional icon.

### Entity Lifecycle Statuses

| Status | Token | Icon | Usage |
|--------|-------|------|-------|
| **Active** | `color.success` | Check circle | Entity is live and operational |
| **Inactive** | `color.text.muted` | Minus circle | Entity disabled but not deleted |
| **Draft** | `color.text.secondary` | Pencil | Entity created but not published or submitted |
| **Pending** | `color.warning` | Clock | Awaiting action, review, or external response |
| **Approved** | `color.success` | Check circle | Formally accepted or authorized |
| **Rejected** | `color.danger` | X circle | Declined or failed review |
| **Completed** | `color.success` | Check circle | Work finished successfully |
| **Delayed** | `color.warning` | Alert triangle | Past due date but not yet cancelled |
| **Cancelled** | `color.text.muted` | X circle | Terminated before completion |
| **Archived** | `color.text.muted` | Archive | Removed from active views; retained for reference |

### System Health Statuses

| Status | Token | Icon | Usage |
|--------|-------|------|-------|
| **Healthy** | `color.success` | Check circle | Integration connected, sync current, no errors |
| **Warning** | `color.warning` | Alert triangle | Degraded state — stale sync, approaching limit |
| **Critical** | `color.danger` | Alert circle | Failure state — disconnected, sync error, quota exceeded |

### Rules

| Rule | Requirement |
|------|-------------|
| **Vocabulary is fixed** | New statuses require design system update — modules do not invent ad-hoc labels |
| **One status per entity** | An entity displays one primary status chip — not multiple competing statuses |
| **Background uses muted variant** | Chip background uses semantic color `.muted` token; text uses semantic color default |
| **Accessible label** | Status text always visible — color is not the sole indicator |
| **Consistent across modules** | "Pending" in CRM matches "Pending" in Projects — same visual treatment |

---

## 15. Notification Standards

Notifications inform users of outcomes, alerts, and system events through Toast (transient) and Alert (persistent) components, plus the in-app notification center.

### Toast Variants

| Variant | Token | Duration | Usage |
|---------|-------|----------|-------|
| **Success** | `color.success` | 5 seconds | Action completed successfully |
| **Warning** | `color.warning` | 8 seconds | Non-blocking caution — review recommended |
| **Error** | `color.danger` | Persistent until dismissed | Action failed — user must acknowledge |
| **Info** | `color.info` | 5 seconds | Neutral information — no action required |
| **Progress** | `color.primary` | Until completion | Long-running operation status with progress indicator |

### System Notifications

| Rule | Requirement |
|------|-------------|
| **Notification center** | Bell icon in header with Badge count for unread notifications | |
| **Real-time delivery** | Push via WebSocket per [Architecture §6](03_ARCHITECTURE.md#6-frontend-architecture) | |
| **Notification item** | Title, description, timestamp, read/unread state, optional action link | |
| **Grouping** | Notifications grouped by date (today, yesterday, earlier) | |
| **Mark all read** | Bulk action available in notification center | |
| **Persistence** | Notifications retained per platform retention policy — not deleted on read | |
| **Priority** | Critical system notifications bypass Do Not Disturb and display as persistent Toast | |

### Content Rules

| Rule | Requirement |
|------|-------------|
| **Action-oriented language** | "Client created" not "Creation successful" | |
| **Entity reference** | Include entity name when applicable | |
| **No technical details** | Error toasts show user-safe message; technical details in logs only | |
| **Undo support** | Destructive action toasts include time-limited undo action where feasible | |

---

## 16. Accessibility Standards

Accessibility is a design requirement, not a post-implementation audit step. AgencyOS targets **WCAG 2.1 Level AA** compliance across all interfaces.

### WCAG

| Rule | Requirement |
|------|-------------|
| **Level AA minimum** | All new and modified interfaces meet WCAG 2.1 AA |
| **Automated testing** | Accessibility linting in CI for component library and critical pages |
| **Manual audit** | Quarterly manual accessibility review of core user journeys |

### Keyboard Navigation

| Rule | Requirement |
|------|-------------|
| **Full keyboard operability** | All interactive elements reachable and operable via keyboard | |
| **Tab order** | Logical tab sequence matching visual reading order | |
| **Focus trap** | Modals and drawers trap focus within overlay | |
| **Skip link** | "Skip to main content" link as first focusable element | |
| **Shortcut keys** | Platform shortcuts documented and avoid conflict with assistive technology | |

### Focus States

| Rule | Requirement |
|------|-------------|
| **Visible focus ring** | All interactive elements display visible focus indicator using `color.border.strong` | |
| **Never remove focus outline** | `outline: none` prohibited without custom focus replacement | |
| **Focus ring contrast** | Focus indicator meets 3:1 contrast against adjacent colors | |

### Contrast

| Rule | Requirement |
|------|-------------|
| **Text contrast** | 4.5:1 minimum for normal text; 3:1 for large text (18px+ or 14px+ bold) | |
| **Non-text contrast** | 3:1 minimum for UI components and graphical objects | |
| **Token validation** | All semantic color token pairs validated for contrast in both themes | |

### Screen Readers

| Rule | Requirement |
|------|-------------|
| **Semantic HTML** | Use native elements before ARIA — buttons are `<button>`, links are `<a>` | |
| **Page landmarks** | `main`, `nav`, `header`, `aside` regions properly labeled | |
| **Live regions** | Toast notifications and dynamic updates use `aria-live="polite"` or `"assertive"` | |
| **Hidden decorative content** | Decorative icons and visual separators use `aria-hidden="true"` | |

### ARIA

| Rule | Requirement |
|------|-------------|
| **ARIA as supplement** | ARIA attributes enhance — never replace — semantic HTML | |
| **Required patterns** | Combobox, dialog, tabs, and menu components follow WAI-ARIA Authoring Practices | |
| **State communication** | Expanded, selected, disabled, and invalid states communicated via ARIA attributes | |

### Reduced Motion

| Rule | Requirement |
|------|-------------|
| **Respect `prefers-reduced-motion`** | All animations and transitions disabled or minimized when preference is set | |
| **Essential motion only** | Loading spinners remain functional; decorative animations removed | |
| **Skeleton shimmer** | Replaced with static placeholder when reduced motion is active | |

---

## 17. Dark Mode

Dark mode is a first-class theme — not an afterthought. All components and tokens support both light and dark themes from initial implementation.

### Rules

| Rule | Requirement |
|------|-------------|
| **Token-driven theming** | Dark mode overrides token values — not individual component styles | |
| **Complete coverage** | Every component, page, and state has defined dark mode appearance | |
| **No hardcoded colors** | Feature code references tokens exclusively — theme switching requires zero feature changes |
| **Images and charts** | Adjust brightness/contrast or provide dark-optimized variants | |
| **Elevation in dark mode** | Depth communicated through surface color lightness shift; shadows reduced | |

### Tokens

| Light Token | Dark Behavior |
|-------------|--------------|
| `color.background` | Dark neutral — not pure black |
| `color.surface` | One step lighter than background |
| `color.surface.raised` | One step lighter than surface |
| `color.text.primary` | Light neutral with high contrast |
| `color.text.muted` | Reduced contrast — still meets AA minimum |
| `color.border` | Subtle — visible but not prominent |
| Semantic colors | Adjusted for dark background contrast compliance |

### Contrast

All dark mode token pairs are validated independently — light mode contrast compliance does not guarantee dark mode compliance.

### Switching

| Rule | Requirement |
|------|-------------|
| **Three modes** | Light, Dark, System (follows OS preference) | |
| **Toggle location** | User menu and settings page | |
| **Instant switch** | Theme applies immediately without page reload | |
| **No flash** | Theme preference applied before first render — no unstyled flash of wrong theme |

### Persistence

Theme preference stored in user profile (server-side) with local storage fallback for pre-authentication views. Layout preferences (sidebar collapsed state) follow the same persistence pattern.

---

## 18. Motion System

Motion communicates state change and provides feedback. AgencyOS uses motion sparingly — functional, not decorative.

### Transition Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion.fast` | 100ms | ease-out | Hover states, opacity changes, focus ring |
| `motion.normal` | 200ms | ease-in-out | Dropdown open, tab switch, accordion expand |
| `motion.slow` | 300ms | ease-in-out | Drawer slide, modal fade, sidebar collapse |
| `motion.enter` | 200ms | ease-out | Element appearing — toast enter, popover open |
| `motion.exit` | 150ms | ease-in | Element disappearing — toast exit, popover close |

### Hover

| Rule | Requirement |
|------|-------------|
| Color and elevation transitions use `motion.fast` | |
| No scale transforms on hover — opacity and elevation only | |
| Hover states never required to understand functionality | |

### Loading

| Rule | Requirement |
|------|-------------|
| Skeleton shimmer animation uses `motion.slow` cycle | |
| Spinner rotation continuous and uniform | |
| Progress bar fills linearly with `motion.normal` | |

### General Rules

| Rule | Requirement |
|------|-------------|
| **No decorative animation** | Motion serves feedback, orientation, or state communication only | |
| **Reduced motion compliance** | All motion disabled when `prefers-reduced-motion: reduce` is active | |
| **No auto-playing animation** | Animation triggered by user interaction or state change — not on page load | |
| **Maximum duration** | No transition exceeds 300ms except drawer/modal enter at 300ms | |
| **Parallax prohibited** | No scroll-linked or parallax effects | |

---

## 19. Responsive Rules

Responsive design ensures AgencyOS is fully functional across all device categories. Standards are viewport-based — not component-specific layout prescriptions.

### Desktop (≥ 1280px)

| Rule | Requirement |
|------|-------------|
| Full application shell — expanded sidebar, full header | |
| Multi-column layouts utilize full grid | |
| Data-dense views show maximum column count | |
| Hover interactions enabled | |

### Laptop (1024px – 1279px)

| Rule | Requirement |
|------|-------------|
| Sidebar collapsed to icon-only by default | |
| Content area expands to fill available width | |
| Dashboard reduces to 3-column metric grid | |
| All functionality accessible — no feature removal | |

### Tablet (768px – 1023px)

| Rule | Requirement |
|------|-------------|
| Sidebar hidden — accessible via overlay drawer | |
| Single or two-column layouts | |
| Tables transform to card list or horizontal scroll | |
| Touch targets enforced at 44×44px minimum | |
| Hover-dependent interactions have tap equivalents | |

### Mobile (< 768px)

| Rule | Requirement |
|------|-------------|
| Full-screen overlay navigation | |
| Single-column layout exclusively | |
| Tables display as card lists | |
| Modals render as full-screen sheets | |
| Bottom-aligned primary actions for thumb reach | |
| Global search accessible via header icon — not inline field | |
| Sticky action bars for form submission at viewport bottom | |

### General Responsive Rules

| Rule | Requirement |
|------|-------------|
| **Mobile first CSS** | Base styles target mobile; breakpoints add complexity | |
| **No horizontal scroll** | Page-level horizontal scroll prohibited — component-level scroll permitted for tables | |
| **Content priority** | Most important content appears first in DOM and visual order on mobile | |
| **Touch-friendly spacing** | Minimum `space.3` (12px) between adjacent interactive elements on mobile | |
| **Viewport meta** | Proper viewport configuration prevents zoom-lock on input focus | |

---

## 20. Future Design Evolution

This design system is v1.0 — functional and complete for initial platform development. The following evolution paths are planned but not yet in scope.

### Figma

| Phase | Scope |
|-------|-------|
| **Design library** | Figma component library mirroring this document's token and component standards |
| **Design-dev parity** | Figma tokens synced with code tokens via automated pipeline |
| **Page templates** | Figma templates for common page patterns — list, detail, dashboard, form |

### Design Tokens

| Phase | Scope |
|-------|-------|
| **Token platform** | Migrate tokens to a platform-agnostic format (W3C Design Tokens specification) |
| **Multi-platform export** | Tokens exported to web, mobile, and documentation from single source |
| **Token documentation** | Auto-generated token reference site from token definitions |

### Storybook

| Phase | Scope |
|-------|-------|
| **Component catalog** | Storybook documenting every design system component with all variants and states |
| **Visual regression** | Automated screenshot comparison on component changes |
| **Accessibility addon** | Integrated a11y auditing in Storybook for every component story |

### White Label

| Phase | Scope |
|-------|-------|
| **Tenant theming** | Workspace-level override of primary, secondary, and logo tokens |
| **Custom domain** | Branded login and email templates per workspace |
| **Theme preview** | Admin UI for agencies to preview and configure their brand theme |

White-label scope is limited to token overrides defined in §3 — not structural layout changes.

### Theme Engine

| Phase | Scope |
|-------|-------|
| **Runtime theming** | Dynamic token injection without rebuild |
| **Additional themes** | High-contrast theme for accessibility; custom agency themes beyond light/dark |
| **Theme API** | Programmatic theme configuration for enterprise deployments |

### Mobile Design System

| Phase | Scope |
|-------|-------|
| **Native patterns** | Extended standards for native mobile app if AgencyOS expands beyond web |
| **Progressive Web App** | PWA-specific interaction patterns — install prompt, offline states, push notifications |
| **Touch gestures** | Swipe actions for list items, pull-to-refresh conventions |

All future evolution requires ADR approval and a version increment of this document.

---

*This document defines UI design standards. For technology choices, refer to [`blueprint/02_TECH_STACK.md`](02_TECH_STACK.md). For frontend architecture, refer to [`blueprint/03_ARCHITECTURE.md`](03_ARCHITECTURE.md). For coding conventions, refer to [`blueprint/05_CODING_STANDARDS.md`](05_CODING_STANDARDS.md).*
