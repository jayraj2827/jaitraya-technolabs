# Design System & Engineering Documentation — Jaitraya Technolabs

**Document Version:** 1.0  
**Status:** Approved Design Foundation  

---

## 1. Design Research & Reference Analysis

To achieve an international technology-company digital presence that feels authentic, credible, and distinct from generic AI-generated landing pages, we conducted a structural analysis of world-class technology engineering studios (e.g., Scale AI, Palantir, Linear, Mistral AI, Vercel, DeepMind).

### Key Findings: What Makes an Engineering Website Feel Genuinely Premium?

1. **Typographic Discipline over Visual Gimmicks:**
   - Premium technology companies do not rely on 3D floating glass bubbles or animated particles. Instead, visual hierarchy is established through rigorous typographic scale, exact letter-spacing (optical tracking: negative letter spacing on large display titles, expanded letter spacing on uppercase metadata labels), and clear contrast between headings and body text.
   - Headings use geometric yet humanistic fonts (**Sora** or **Manrope**), while body text is set in high-legibility sans-serif (**Inter**).

2. **Layered Dark-Elevation Color System:**
   - Avoid harsh `#000000` pitch black and dull washed-out grey. World-class dark interfaces use deep cosmic slate/navy tones (`#070D18` base, `#0B1220` surface, `#101B2D` elevated cards, `#14243B` interactive elements) which provide rich color depth and reduce eye strain.
   - Borders are razor-thin (1px) with controlled opacity (`#1E293B` to `#26364D`) to define clear architectural boundaries without visual noise.

3. **Technical Schematic & Data-Density Aesthetics:**
   - Real product companies showcase systems, pipelines, data tables, and workflow schematics.
   - Handcrafted SVG architecture diagrams with clear input/output nodes, status indicators, and coordinate markers communicate engineering rigor without needing stock photos or synthetic AI art.

4. **Product Autonomy in Portfolio:**
   - Jaitraya Technolabs is the parent technology company; Mulyankan AI is an independent product brand.
   - The design architecture ensures Mulyankan AI maintains its own distinct visual sub-palette (e.g., deep indigo/violet accents alongside corporate royal electric blue) and dedicated landing page, preventing brand confusion.

5. **Strict Honesty & Authentic Verification:**
   - Zero stock photos of models pretending to be engineers.
   - Zero fake customer logos, fake review stars, or invented metrics.
   - Transparent legal status (MCA name reservation approved, incorporation in progress).

---

## 2. Design Tokens & CSS Custom Properties

The styling architecture is built purely on **CSS Custom Properties** (Variables) and **CSS Modules**. Tailwind CSS is strictly excluded.

### Global CSS Token Definitions (`src/styles/variables.css`)

```css
:root {
  /* ==========================================================================
     Color Palette: Deep Corporate Dark Slate & Cobalt
     ========================================================================== */
  --color-bg-base: #070D18;          /* Deepest foundation layer */
  --color-bg-surface-1: #0B1220;     /* Primary section background */
  --color-bg-surface-2: #101B2D;     /* Secondary section background */
  --color-bg-card: #14243B;          /* Elevated card and container background */
  --color-bg-card-hover: #1A2E4B;    /* Interactive card hover */
  --color-bg-overlay: rgba(7, 13, 24, 0.85);

  /* Primary Brand Accents (Jaitraya Electric Blue) */
  --color-accent-primary: #2563EB;
  --color-accent-primary-hover: #1D4ED8;
  --color-accent-glow: rgba(37, 99, 235, 0.25);
  --color-accent-secondary: #60A5FA;
  --color-accent-cyan: #38BDF8;

  /* Product Sub-Palette: Mulyankan AI (Indigo/Violet Accents) */
  --color-mulyankan-primary: #6366F1;
  --color-mulyankan-hover: #4F46E5;
  --color-mulyankan-light: #818CF8;
  --color-mulyankan-bg: #1E1B4B;
  --color-mulyankan-border: #3730A3;

  /* Structural Borders & Dividers */
  --color-border-subtle: #1E293B;
  --color-border-medium: #26364D;
  --color-border-strong: #334155;
  --color-border-accent: rgba(37, 99, 235, 0.45);

  /* Typography Colors */
  --color-text-primary: #F8FAFC;     /* Primary readable content (98% white) */
  --color-text-secondary: #94A3B8;   /* Explanatory & secondary text */
  --color-text-muted: #64748B;       /* Metadata, captions, coordinate tags */
  --color-text-accent: #60A5FA;      /* Highlighted terms & inline links */

  /* Semantic Feedback States */
  --color-status-success: #10B981;
  --color-status-warning: #F59E0B;
  --color-status-info: #0EA5E9;
  --color-status-error: #EF4444;

  /* ==========================================================================
     Typography & Font Hierarchy
     ========================================================================== */
  --font-family-heading: 'Sora', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, monospace;

  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  --font-size-5xl: 3rem;      /* 48px */
  --font-size-6xl: 3.75rem;   /* 60px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --letter-spacing-tight: -0.025em;
  --letter-spacing-snug: -0.015em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.05em;
  --letter-spacing-widest: 0.1em;

  /* ==========================================================================
     Layout & Spacing Metrics
     ========================================================================== */
  --container-max-width: 1240px;
  --container-narrow-width: 880px;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */
  --spacing-24: 6rem;    /* 96px */

  /* Border Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 3. Responsive Breakpoint Matrix

| Token | Breakpoint | Target Devices | Behavior |
|---|---|---|---|
| `sm` | `640px` | Mobile portrait & landscape | Single-column stacks, full-width touch buttons, collapsible drawer navigation |
| `md` | `768px` | Tablets portrait | 2-column grids, compact horizontal stats bar |
| `lg` | `1024px` | Laptops / Small Desktops | Full horizontal desktop navbar, multi-column feature grids |
| `xl` | `1280px` | Standard & High-Res Monitors | Max-width centered 1240px container, full visual margin spacing |

---

## 4. Reusable Component Conventions

1. **`Navbar` (`src/components/layout/Navbar/`):**
   - Fixed header with subtle backdrop-filter blur (`backdrop-filter: blur(12px)`).
   - Dynamic route indicator.
   - Accessible keyboard-friendly mobile slide-down menu with focus-trap.
   - Direct CTA button linking to Products / Pilot inquiry.

2. **`Footer` (`src/components/layout/Footer/`):**
   - 4-column structured matrix (Company, Products, Technology, Legal/Compliance).
   - Mandatory statutory disclosure on MCA name reservation.
   - Copyright notice & social links.

3. **`SectionHeader` (`src/components/common/SectionHeader/`):**
   - Uppercase monospaced eyebrow badge (e.g., `// 01 ARCHITECTURE`).
   - High-impact display headline with tight letter spacing.
   - Clean secondary descriptive text with readable max-width (640px).

4. **`ProductCard` (`src/components/products/ProductCard/`):**
   - Independent branding container for products.
   - Status badge (`LIVE BETA`, `R&D LAB`).
   - Verified capabilities list with icon checkmarks.
   - Dual actions: Internal detail page + Direct external link.

5. **`InteractivePipeline` (`src/components/mulyankan/InteractivePipeline/`):**
   - Step-by-step interactive workflow selector for Mulyankan AI.
   - Displays real pipeline stages: Digitization, OCR Vision, Rubric Matching, Moderation Review.

6. **`ContactForm` (`src/components/contact/ContactForm/`):**
   - Fully accessible form with `<label>`, `<input>`, `<select>`, `<textarea>`.
   - Client-side validation for email, required fields, and message length.
   - Interactive submission feedback state.
