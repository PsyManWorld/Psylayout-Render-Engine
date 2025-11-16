# PsyLayout Engine · Design Manager

A highly–opinionated **layout & render engine** for React/Next.js, designed specifically for the **Girpazh** ecosystem.  
PsyLayout combines flexible layout primitives, a rich validation engine, responsive rules, and a first–class slider/paging system into a single, cohesive API.

> Built for **dark, precise and predictable UIs** – used as the core layout engine of the new Girpazh frontend.

---

## ✨ Key Features

- **Three–level architecture**
  - `DesignManagerProvider` – breakpoint + event bus
  - `Container` – page–level layout wrapper
  - `Section` + `Locator` – fine–grained layout orchestration

- **Free / Row / Column modes**
  - `mode="free"` with `logicalSize` and `logicalRect`
  - `mode="row" | "column"` for standard flex layouts
  - Mixed usage inside the same page

- **Logical coordinate system**
  - Define layouts in logical units (e.g. `1200 × 600`)
  - Engine translates to percentage–based responsive positions
  - Supports `offsetX`, `offsetY`, constraints and snapping

- **Snap Engine**
  - `snap={number | SnapConfig}`
  - Grid snapping (strict / soft)
  - Axis selection (`x | y | both`)
  - Threshold for soft snapping

- **Constraints**
  - `centerX / centerY`
  - `pinLeft / pinRight / pinTop / pinBottom`
  - `keepAspectRatio`
  - `lockX / lockY` (ignore offsets per axis)

- **Rule Engine**
  - Layout rules based on viewport width  
    (`"<600"`, `"600-1024"`, `">1200"`, ...)
  - Show/hide, change offsets, zIndex etc. per rule

- **Validation Engine**
  - Detects:
    - `MissingLogicalSize` in free mode
    - `InvalidRect` (width/height missing)
    - `OffsetWithoutLogicalSize`
    - `ModeConflict` (rect/logicalRect in row/column)
    - `Overlap` between locators in free mode
  - Emits:
    - warnings, errors to console
    - structured events via `onLayoutValidation` and `onLocatorCollision`

- **Slider & Paging System**
  - `pagingMode="none" | "pages" | "slider"`
  - `pageSize`, `defaultPage`, `currentPage`, `onPageChange`
  - `showDots`, `showArrows`
  - `autoPlay`, `autoPlayInterval`, `loop`, `lazy`
  - Animations: `animation="none" | "slide" | "fade" | "scale"`
  - Native drag/slide for `slider + slide`:
    - Mouse + touch drag
    - `translateX`–based sliding
    - Smart snap to previous/next page

---

## 📦 Installation

Install the core package (example namespace):

```bash
npm install 

npm run dev
