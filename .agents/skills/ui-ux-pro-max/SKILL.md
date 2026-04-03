---
name: ui-ux-pro-max
description: AI-powered design intelligence toolkit with searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. Use this skill when the user asks to design, style, or choose visual direction for any web or app UI.
---

# UI/UX Pro Max — Design Intelligence Toolkit

An AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines.

## Prerequisites

Python 3.x (no external dependencies required).

Check if Python is installed:
```bash
python3 --version || python --version
```

## When to Use This Skill

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New project / page** | "Build a landing page", "Create a dashboard" | Step 1 → Step 2 (design system) |
| **New component** | "Create a pricing card", "Add a modal" | Step 3 (domain search: style, ux) |
| **Choose style / color / font** | "What style fits a fintech app?" | Step 2 (design system) |
| **Review existing UI** | "Review this page for UX issues" | Pre-Delivery Checklist |
| **Add charts / data viz** | "Add an analytics dashboard chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React performance tips", "Vue navigation" | Step 4 (stack search) |

## Workflow

### Step 1: Analyze User Requirements
Extract key information from the user request:
- **Product type**: SaaS, e-commerce, portfolio, healthcare, fintech, etc.
- **Target audience**: age group, usage context
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, etc.
- **Stack**: React, Vue, Next.js, etc.

### Step 2: Generate Design System (REQUIRED)
**Always start with `--design-system`** to get comprehensive recommendations:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command searches domains in parallel (product, style, color, landing, typography), applies reasoning rules, and returns a complete design system: pattern, style, colors, typography, effects, and anti-patterns.

**Example:**
```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)
To save the design system for hierarchical retrieval across sessions, add `--persist`:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates `design-system/MASTER.md` (Global Source of Truth) and `design-system/pages/` for page-specific overrides.

### Step 3: Supplement with Detailed Searches (as needed)
After getting the design system, use domain searches for additional details:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

### Step 4: Stack Guidelines
Get stack-specific implementation best practices:

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

## Query Strategy
- Use **multi-dimensional keywords** — combine product + industry + tone: `"entertainment social vibrant content-dense"` not just `"app"`
- Try different keywords for the same need: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use `--design-system` first for full recommendations, then `--domain` to deep-dive any dimension

## Common Anti-Patterns

### Icons & Visual Elements
- **No Emoji as Structural Icons** — Use SVG/vector icons (Phosphor, Heroicons, Lucide)
- **Vector-Only Assets** — No raster PNG icons; use SVG that scales cleanly
- **Consistent Icon Sizing** — Define icon sizes as design tokens (icon-sm, icon-md, icon-lg)
- **Stroke Consistency** — Use consistent stroke width within the same visual layer
- **Touch Target Minimum** — Minimum 44×44pt interactive area

### Light/Dark Mode Contrast
- **Text contrast** ≥4.5:1 in both light and dark mode
- **Secondary text contrast** ≥3:1 in both modes
- **Token-driven theming** — Use semantic color tokens mapped per theme
- **Modal scrim** — 40-60% black opacity for foreground legibility

### Layout & Spacing
- **8dp spacing rhythm** — Use consistent 4/8dp spacing system
- **Section spacing hierarchy** — Define clear vertical rhythm tiers (16/24/32/48)

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from a consistent icon family and style
- [ ] Semantic theme tokens used consistently

### Interaction
- [ ] All interactive elements provide clear feedback
- [ ] Touch targets meet minimum size (≥44×44pt)
- [ ] Micro-interaction timing 150-300ms with proper easing
- [ ] Disabled states are visually clear

### Light/Dark Mode
- [ ] Primary text contrast ≥4.5:1 in both modes
- [ ] Dividers/borders distinguishable in both modes
- [ ] Both themes tested before delivery

### Layout
- [ ] Verified on small phone, large phone, and tablet
- [ ] 4/8dp spacing rhythm maintained
- [ ] Long-form text measure remains readable on large devices

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
