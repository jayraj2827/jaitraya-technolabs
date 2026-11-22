# Asset Inventory — Jaitraya Technolabs Corporate Website

**Date:** November 2026  
**Status:** Audit & Specification Complete  

---

## 1. Asset Registry Overview

To guarantee that the website never relies on AI-generated imagery or fabricated materials, this inventory catalogues every required visual asset, its current availability status, exact storage path, and technical fallback mechanism.

---

## 2. Brand & Identity Assets

| Asset ID | Description | Target Path | Format | Status | Design & Implementation Fallback |
|---|---|---|---|---|---|
| `BRAND-LOGO-MAIN` | Jaitraya Technolabs Primary Brand Logo | `public/logos/jaitraya-logo.svg` | SVG / Vector | **Awaiting User Input** (User noted they will provide reference logo) | Handcrafted CSS/SVG geometric monogram + typographic wordmark using `Sora` / `Manrope`. Will be instantly replaced when user drops the logo file. |
| `BRAND-LOGO-ICON` | Jaitraya Monogram / Icon mark | `public/logos/jaitraya-icon.svg` | SVG | **Awaiting User Input** | Precision geometric SVG mark (hexagonal/nested vector nodes symbolizing intelligence & architecture). |
| `BRAND-FAVICON` | Browser favicon & touch icon | `public/favicon.ico`, `public/icon.svg` | ICO / SVG | **Generated via SVG** | Clean vector SVG icon derived from the corporate monogram. |
| `BRAND-OG-IMAGE` | Open Graph Social Share Banner | `public/images/og/og-jaitraya.png` | PNG (1200x630) | **Handcrafted Vector Composition** | High-contrast dark graphic layout displaying brand identity, headline, and domain metadata. |

---

## 3. Product Assets — Mulyankan AI

| Asset ID | Description | Target Path | Format | Status | Design & Implementation Fallback |
|---|---|---|---|---|---|
| `PROD-MULYANKAN-LOGO` | Mulyankan AI Product Logo | `public/logos/mulyankan-logo.svg` | SVG | **Pending Official Vector** | Clean SVG wordmark with independent indigo/violet gradient node accent. |
| `PROD-MULYANKAN-HERO` | Platform Overview / Exam Dashboard | `public/images/products/mulyankan/dashboard-preview.png` | PNG / WebP | **Asset Dropzone Configured** | Handcrafted SVG/CSS Interactive Blueprint Canvas (showing active exam batches, graded scripts count, accuracy metrics, and evaluation queue). |
| `PROD-MULYANKAN-OCR` | Handwritten Answer Script OCR & Segmentation | `public/images/products/mulyankan/ocr-segmentation.png` | PNG / WebP | **Asset Dropzone Configured** | Architectural SVG diagram depicting scanned page bounding boxes, text extraction vectors, and question segmentation zones. |
| `PROD-MULYANKAN-RUBRIC` | Rubric-based Scoring Engine Interface | `public/images/products/mulyankan/rubric-evaluation.png` | PNG / WebP | **Asset Dropzone Configured** | Structured UI component showing sample descriptive question, criteria points, step-marks breakdown, and model rationale. |
| `PROD-MULYANKAN-MOD` | Professor Moderation & Marks Review Interface | `public/images/products/mulyankan/moderation-review.png` | PNG / WebP | **Asset Dropzone Configured** | Clean interface component displaying verified teacher-in-the-loop controls: 1-click approval, margin notes, and score override slider. |
| `PROD-MULYANKAN-REPORT` | Institutional Assessment Report & Export | `public/images/products/mulyankan/analytics-report.png` | PNG / WebP | **Asset Dropzone Configured** | Data table visual depicting class percentile distribution, question difficulty index, and Excel/PDF export trigger. |

---

## 4. Engineering & Architecture Visuals (Handcrafted SVG)

| Asset ID | Description | Target Path | Format | Status |
|---|---|---|---|---|
| `ARCH-INTELLIGENCE-FLOW` | End-to-end Intelligent Systems Pipeline Diagram | `src/components/common/diagrams/IntelligencePipelineSvg.tsx` | React SVG Component | **To Be Handcrafted** |
| `ARCH-DOC-VISION` | Computer Vision & Document Preprocessing Pipeline | `src/components/common/diagrams/VisionPipelineSvg.tsx` | React SVG Component | **To Be Handcrafted** |
| `ARCH-HUMAN-LOOP` | Human-in-the-Loop Verification Architecture | `src/components/common/diagrams/HumanInLoopSvg.tsx` | React SVG Component | **To Be Handcrafted** |
| `ARCH-MODULAR-GRID` | Geometric Engineering Grid Backgrounds | `src/styles/grid-patterns.module.css` | Pure CSS / SVG Data URI | **To Be Handcrafted** |

---

## 5. Team Assets

| Asset ID | Description | Target Path | Format | Status | Design & Implementation Fallback |
|---|---|---|---|---|---|
| `TEAM-PORTRAITS` | Photographs for Designated Partners & Leadership | `public/team/[member-slug].jpg` | JPG / WebP | **Awaiting Company Provision** | Neutral, elegant typographic avatar badges featuring partner initials, designation chips, and LinkedIn placeholders. No stock photos or fake portraits will be used. |

---

## 6. Asset Drop-In Directory Structure

The project will initialize the following public directory hierarchy to accept actual files cleanly:

```text
public/
├── favicon.ico
├── icon.svg
├── logos/
│   ├── jaitraya-logo.svg
│   ├── jaitraya-icon.svg
│   └── mulyankan-logo.svg
├── images/
│   ├── og/
│   │   └── og-jaitraya.png
│   ├── products/
│   │   └── mulyankan/
│   │       ├── dashboard-preview.png
│   │       ├── ocr-segmentation.png
│   │       ├── rubric-evaluation.png
│   │       ├── moderation-review.png
│   │       └── analytics-report.png
│   └── team/
│       └── README.md
```
