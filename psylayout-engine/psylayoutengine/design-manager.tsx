"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

/* ============================================
 *  TYPES
 * ============================================ */

/* ---------- Breakpoints ---------- */

export type BreakpointKey = "base" | "sm" | "md" | "lg" | "xl";

const BREAKPOINTS: Record<Exclude<BreakpointKey, "base">, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/* ---------- Responsive ---------- */

export type Responsive<T> = T | Partial<Record<BreakpointKey, T>>;

/* ---------- Geometry ---------- */

export type Rect = {
  left?: number | string;
  top?: number | string;
  width?: number | string;
  height?: number | string;
};

export type LogicalSize = { width: number; height: number };
export type LogicalRect = { x: number; y: number; w: number; h: number };

/* ---------- Visibility ---------- */

export type Visibility = boolean | Partial<Record<BreakpointKey, boolean>>;

/* ---------- Rule Engine ---------- */

export type LayoutRule = {
  when: string; // "<600" | "600-1024" | ">1200" ...
  hidden?: boolean;
  offsetX?: number | string;
  offsetY?: number | string;
  zIndex?: number;
};

/* ---------- Validation ---------- */

export type LayoutIssueType =
  | "MissingLogicalSize"
  | "InvalidRect"
  | "OffsetWithoutLogicalSize"
  | "Overlap"
  | "ModeConflict";

export type LayoutIssueSeverity = "warning" | "error";

export type LayoutIssue = {
  type: LayoutIssueType;
  severity: LayoutIssueSeverity;
  message: string;
  sectionId?: string;
  locatorId?: string;
  otherLocatorId?: string;
};

/* ---------- SnapConfig (Phase 2) ---------- */

export type SnapMode = "strict" | "soft";
export type SnapAxes = "x" | "y" | "both";

export type SnapConfig = {
  grid: number; // 4, 8, 10, ...
  mode?: SnapMode;
  axes?: SnapAxes;
  threshold?: number; // only for soft mode
};

/* ---------- Constraints (Phase 2) ---------- */

export type LocatorConstraints = {
  centerX?: boolean;
  centerY?: boolean;
  pinLeft?: boolean;
  pinRight?: boolean;
  pinTop?: boolean;
  pinBottom?: boolean;

  keepAspectRatio?: number; // e.g. 16/9
  lockX?: boolean; // ignore offsetX / rule offsetX
  lockY?: boolean; // ignore offsetY / rule offsetY
};

/* ============================================
 *  UTILS
 * ============================================ */

function currentBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "base";
}

function pickResponsive<T>(
  value: Responsive<T> | undefined,
  bp: BreakpointKey
): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value as T;
  }
  const obj = value as Partial<Record<BreakpointKey, T>>;
  return obj[bp] ?? obj.base;
}

function normalizeDim(val?: number | string): string | undefined {
  if (val === undefined || val === null) return undefined;
  return typeof val === "number" ? `${val}px` : val;
}

function resolveVisibility(
  visible: Visibility | undefined,
  bp: BreakpointKey
): boolean {
  if (visible === undefined) return true;
  if (typeof visible === "boolean") return visible;
  const v = pickResponsive(visible, bp);
  return v === undefined ? true : !!v;
}

function sortByOrder(children: React.ReactNode): React.ReactNode[] {
  const arr = React.Children.toArray(children) as React.ReactElement[];
  return arr
    .map((el, idx) => {
      const props: any = (el as any)?.props;
      const o = typeof props?.order === "number" ? props.order : idx;
      return { el, order: o };
    })
    .sort((a, b) => a.order - b.order)
    .map((x) => x.el);
}

function matchRule(when: string, width: number): boolean {
  const s = when.trim();
  if (!s) return false;

  if (s.startsWith("<")) {
    const v = Number(s.slice(1));
    return width < v;
  }
  if (s.startsWith(">")) {
    const v = Number(s.slice(1));
    return width > v;
  }
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    return width >= min && width <= max;
  }
  return false;
}

function normalizeSnapConfig(
  snap?: number | SnapConfig
): SnapConfig | undefined {
  if (!snap) return undefined;
  if (typeof snap === "number") {
    return {
      grid: snap,
      mode: "strict",
      axes: "both",
      threshold: 0,
    };
  }
  return {
    grid: snap.grid,
    mode: snap.mode ?? "strict",
    axes: snap.axes ?? "both",
    threshold: snap.threshold ?? 0,
  };
}

/* ============================================
 *  EVENTS
 * ============================================ */

export type PsyLayoutEvents = {
  onRenderStart?: () => void;
  onRenderEnd?: () => void;

  onSectionRender?: (info: { id?: string }) => void;
  onLocatorRender?: (info: { id?: string; zIndex?: number }) => void;

  onLayoutValidation?: (info: {
    sectionId?: string;
    issues: LayoutIssue[];
  }) => void;

  onLocatorCollision?: (info: {
    sectionId?: string;
    aId?: string;
    bId?: string;
  }) => void;

  onError?: (error: Error) => void;
};

const EventsCtx = createContext<PsyLayoutEvents | null>(null);

export const usePsyEvents = () => useContext(EventsCtx);

/* ============================================
 *  BREAKPOINT CONTEXT
 * ============================================ */

const DesignCtx = createContext<{ bp: BreakpointKey; width: number }>({
  bp: "base",
  width: 0,
});

export const useBreakpoint = () => useContext(DesignCtx);

/* ============================================
 *  MAIN PROVIDER
 * ============================================ */

export type DesignManagerProviderProps = {
  children: React.ReactNode;
  events?: PsyLayoutEvents;
};

export const DesignManagerProvider: React.FC<DesignManagerProviderProps> = ({
  children,
  events,
}) => {
  const [w, setW] = useState<number>(0);

  useEffect(() => {
    const update = () =>
      setW(typeof window !== "undefined" ? window.innerWidth : 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const bp = useMemo(() => currentBreakpoint(w), [w]);

  useEffect(() => {
    events?.onRenderStart?.();
    return () => {
      events?.onRenderEnd?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EventsCtx.Provider value={events ?? null}>
      <DesignCtx.Provider value={{ bp, width: w }}>
        {children}
      </DesignCtx.Provider>
    </EventsCtx.Provider>
  );
};

/* ============================================
 *  FREE LAYOUT CONTEXT
 * ============================================ */

type FreeLayoutContextValue = {
  logicalSize: LogicalSize | null;
  snap?: SnapConfig;
};

const FreeLayoutCtx = createContext<FreeLayoutContextValue>({
  logicalSize: null,
  snap: undefined,
});

/* ============================================
 *  CONTAINER
 * ============================================ */

export type ContainerProps = {
  id?: string;
  children?: React.ReactNode;

  width?: Responsive<number | string>;
  maxWidth?: Responsive<number | string>;
  padding?: Responsive<number | string>;
  background?: Responsive<string>;
  borderRadius?: Responsive<number | string>;
  hidden?: Visibility;
  order?: number;

  className?: string;
  style?: React.CSSProperties;
};

export const Container: React.FC<ContainerProps> = ({
  id,
  children,
  width,
  maxWidth,
  padding = { base: 0, md: 16 },
  background,
  borderRadius,
  hidden,
  order = 0,
  className,
  style,
}) => {
  const { bp } = useBreakpoint();
  const isVisible = resolveVisibility(hidden, bp);
  if (!isVisible) return null;

  const resolvedStyle: React.CSSProperties = {
    position: "relative",
    marginLeft: "auto",
    marginRight: "auto",
    width: normalizeDim(pickResponsive(width ?? "100%", bp)),
    maxWidth: normalizeDim(pickResponsive(maxWidth ?? undefined, bp)),
    padding: normalizeDim(pickResponsive(padding ?? 0, bp)) as any,
    background: pickResponsive(background ?? undefined, bp),
    borderRadius: normalizeDim(
      pickResponsive(borderRadius ?? undefined, bp)
    ) as any,
    order,
    ...style,
  };

  return (
    <div id={id} className={className} style={resolvedStyle}>
      {sortByOrder(children)}
    </div>
  );
};

/* ============================================
 *  SECTION
 * ============================================ */

export type SectionMode = "free" | "row" | "column";

export type SectionProps = {
  id?: string;
  mode?: Responsive<SectionMode>;
  gap?: Responsive<number | string>;
  width?: Responsive<number | string>;
  height?: Responsive<number | string>;
  minWidth?: Responsive<number | string>;
  minHeight?: Responsive<number | string>;
  maxWidth?: Responsive<number | string>;
  maxHeight?: Responsive<number | string>;
  padding?: Responsive<number | string>;
  background?: Responsive<string>;
  borderRadius?: Responsive<number | string>;
  hidden?: Visibility;
  order?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;

  logicalSize?: LogicalSize;
  snap?: number | SnapConfig;
  rules?: LayoutRule[];

  /* Paging / Slider / Lazy */
  pagingMode?: "none" | "pages" | "slider";
  pageSize?: number;
  defaultPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
  lazy?: boolean;
  animation?: "none" | "slide" | "fade" | "scale";
};

function applySectionRules(
  baseVisible: boolean,
  rules: LayoutRule[] | undefined,
  width: number
): boolean {
  if (!rules || rules.length === 0) return baseVisible;
  let visible = baseVisible;

  for (const rule of rules) {
    if (matchRule(rule.when, width)) {
      if (rule.hidden !== undefined) {
        visible = !rule.hidden ? true : false;
      }
    }
  }
  return visible;
}

/* ---------- Validation Engine ---------- */

type RawLocatorPropsForValidation = {
  id?: string;
  rect?: Rect | Responsive<Rect>;
  logicalRect?: LogicalRect | Responsive<LogicalRect>;
  offsetX?: Responsive<number | string>;
  offsetY?: Responsive<number | string>;
  hidden?: Visibility;
  zIndex?: Responsive<number>;
};

function extractLocatorsForValidation(
  children: React.ReactNode
): RawLocatorPropsForValidation[] {
  const arr = React.Children.toArray(children) as React.ReactElement[];
  return arr.map((el) => {
    const props: any = el.props || {};
    return {
      id: props.id,
      rect: props.rect,
      logicalRect: props.logicalRect,
      offsetX: props.offsetX,
      offsetY: props.offsetY,
      hidden: props.hidden,
      zIndex: props.zIndex,
    };
  });
}

function validateSectionLayout(options: {
  sectionId?: string;
  mode: SectionMode;
  logicalSize?: LogicalSize;
  children: React.ReactNode;
  bp: BreakpointKey;
}): LayoutIssue[] {
  const { sectionId, mode, logicalSize, children, bp } = options;
  const issues: LayoutIssue[] = [];

  const locators = extractLocatorsForValidation(children);

  // ۱) free-mode بدون logicalSize
  if (mode === "free" && !logicalSize) {
    issues.push({
      type: "MissingLogicalSize",
      severity: "error",
      message:
        "Section در حالت free است اما logicalSize تعریف نشده است. برای رفتار نسبتی و درست، logicalSize را تنظیم کنید.",
      sectionId,
    });
  }

  // برای overlap
  type Box = {
    id?: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  const boxes: Box[] = [];

  for (const loc of locators) {
    const visible = resolveVisibility(loc.hidden, bp);
    if (!visible) continue;

    const lr = loc.logicalRect
      ? (pickResponsive(
          loc.logicalRect as any,
          bp
        ) as LogicalRect | undefined)
      : undefined;
    const r = loc.rect
      ? (pickResponsive(loc.rect as any, bp) as Rect | undefined)
      : undefined;

    // ۲) rect ناقص در free-mode
    if (mode === "free" && r) {
      const hasW = r.width !== undefined;
      const hasH = r.height !== undefined;
      if (!hasW || !hasH) {
        issues.push({
          type: "InvalidRect",
          severity: "warning",
          message: `Locator "${
            loc.id ?? "unknown"
          }" در free-mode rect ناقص دارد. بهتر است width/height هر دو مشخص باشند.`,
          locatorId: loc.id,
          sectionId,
        });
      }
    }

    // ۳) offset عددی بدون logicalSize
    const ox = pickResponsive(loc.offsetX, bp);
    const oy = pickResponsive(loc.offsetY, bp);
    if ((typeof ox === "number" || typeof oy === "number") && !logicalSize) {
      issues.push({
        type: "OffsetWithoutLogicalSize",
        severity: "warning",
        message: `Locator "${
          loc.id ?? "unknown"
        }" از offset عددی استفاده می‌کند اما logicalSize برای Section تنظیم نشده است. بهتر است logicalSize را مشخص کنید تا offset نسبتی و ریسپانسیو باشد.`,
        locatorId: loc.id,
        sectionId,
      });
    }

    // ۴) ModeConflict در row/column
    if ((mode === "row" || mode === "column") && (r || lr)) {
      issues.push({
        type: "ModeConflict",
        severity: "warning",
        message: `Locator "${
          loc.id ?? "unknown"
        }" در حالت ${mode} از rect/logicalRect استفاده کرده است. در row/column بهتر است از flex و offset استفاده شود، نه position:absolute.`,
        locatorId: loc.id,
        sectionId,
      });
    }

    // ۵) برای overlap در free-mode
    if (mode === "free" && logicalSize && lr) {
      boxes.push({
        id: loc.id,
        x: lr.x,
        y: lr.y,
        w: lr.w,
        h: lr.h,
      });
    }
  }

  // ۶) Overlap detection
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlapX = Math.max(
        0,
        Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      );
      const overlapY = Math.max(
        0,
        Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      );
      const area = overlapX * overlapY;
      if (area > 0) {
        issues.push({
          type: "Overlap",
          severity: "warning",
          message: `Locator "${
            a.id ?? "A"
          }" و "${b.id ?? "B"}" در free-mode روی هم افتاده‌اند.`,
          locatorId: a.id,
          otherLocatorId: b.id,
          sectionId,
        });
      }
    }
  }

  return issues;
}

/* ---------- zIndex SORTING ---------- */

function sortLocatorsByZIndex(
  children: React.ReactNode,
  bp: BreakpointKey,
  events: PsyLayoutEvents | null
): React.ReactElement[] {
  const arr = React.Children.toArray(children) as React.ReactElement[];

  const locators = arr.map((el, idx) => {
    const props: any = (el as any)?.props || {};
    const rawZ = props.zIndex as Responsive<number> | number | undefined;
    const resolvedZ =
      typeof rawZ === "object"
        ? pickResponsive<number>(rawZ as Responsive<number>, bp)
        : (rawZ as number | undefined);
    const z = resolvedZ ?? idx + 1;
    return { el, zIndex: z };
  });

  const seen = new Set<number>();
  for (const item of locators) {
    if (seen.has(item.zIndex)) {
      const err = new Error(
        `Duplicate zIndex ${item.zIndex} in Section. You must uniquely order all Locators' zIndex.`
      );
      console.error(
        `❌ Duplicate zIndex detected: ${item.zIndex}
Each Locator must have a unique zIndex inside a Section.
Offending element:`,
        item.el
      );
      events?.onError?.(err);
      throw err;
    }
    seen.add(item.zIndex);
  }

  locators.sort((a, b) => a.zIndex - b.zIndex);
  return locators.map((x) => x.el);
}

/* ---------- SECTION COMPONENT (با Slider درگ‌دار) ---------- */

export const Section: React.FC<SectionProps> = ({
  id,
  mode = { base: "row" },
  gap = 8,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  padding = 0,
  background,
  borderRadius,
  hidden,
  order = 0,
  className,
  style,
  children,
  logicalSize,
  snap,
  rules,

  pagingMode = "none",
  pageSize,
  defaultPage = 0,
  currentPage,
  onPageChange,
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = true,
  lazy = true,
  animation = "none",
}) => {
  const { bp, width: viewportWidth } = useBreakpoint();
  const events = usePsyEvents();

  const baseVisible = resolveVisibility(hidden, bp);
  const visible = applySectionRules(baseVisible, rules, viewportWidth);
  if (!visible) return null;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionWidth, setSectionWidth] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      if (sectionRef.current) {
        setSectionWidth(sectionRef.current.offsetWidth || 0);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const m = pickResponsive(mode, bp) ?? "row";
  const isFree = m === "free";
  const snapConfig = normalizeSnapConfig(snap);

  /* ---------- Paging / Slider Logic ---------- */

  const orderedAll = sortByOrder(children);
  const isPaged = pagingMode !== "none";
  const isSliderSlide = pagingMode === "slider" && animation === "slide";

  const effectivePageSize =
    isPaged && pageSize && pageSize > 0
      ? pageSize
      : orderedAll.length || 1;

  const totalPages =
    orderedAll.length > 0
      ? Math.max(1, Math.ceil(orderedAll.length / effectivePageSize))
      : 1;

  const [internalPage, setInternalPage] = useState<number>(defaultPage);

  const rawPageIndex =
    typeof currentPage === "number" ? currentPage : internalPage;

  const safePageIndex =
    rawPageIndex < 0
      ? 0
      : rawPageIndex > totalPages - 1
      ? totalPages - 1
      : rawPageIndex;

  useEffect(() => {
    if (rawPageIndex !== safePageIndex && typeof currentPage !== "number") {
      setInternalPage(safePageIndex);
    }
  }, [rawPageIndex, safePageIndex, currentPage]);

  const goToPage = (next: number) => {
    let target = next;
    if (next < 0) {
      target = loop ? totalPages - 1 : 0;
    } else if (next > totalPages - 1) {
      target = loop ? 0 : totalPages - 1;
    }

    if (typeof currentPage !== "number") {
      setInternalPage(target);
    }
    onPageChange?.(target);
  };

  const goNext = () => {
    if (!isPaged || totalPages <= 1) return;
    goToPage(safePageIndex + 1);
  };

  const goPrev = () => {
    if (!isPaged || totalPages <= 1) return;
    goToPage(safePageIndex - 1);
  };

  // autoplay فقط برای slider+slide
  useEffect(() => {
    if (!isPaged || !autoPlay || totalPages <= 1 || !isSliderSlide) return;
    const id = window.setInterval(() => {
      goNext();
    }, autoPlayInterval);
    return () => window.clearInterval(id);
  }, [isPaged, autoPlay, autoPlayInterval, totalPages, isSliderSlide]);

  /* ---------- Drag State برای slider slide ---------- */

  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDeltaX, setDragDeltaX] = useState(0);

  const dragThresholdPx = 50;

  const handlePointerDown = (clientX: number) => {
    if (!isSliderSlide) return;
    setDragging(true);
    setDragStartX(clientX);
    setDragDeltaX(0);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isSliderSlide || !dragging) return;
    setDragDeltaX(clientX - dragStartX);
  };

  const handlePointerUp = () => {
    if (!isSliderSlide || !dragging) return;
    const delta = dragDeltaX;

    if (Math.abs(delta) > dragThresholdPx) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setDragging(false);
    setDragDeltaX(0);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    handlePointerDown(e.clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    handlePointerMove(e.clientX);
  };

  const onMouseUp = () => {
    handlePointerUp();
  };

  const onMouseLeave = () => {
    handlePointerUp();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handlePointerDown(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    handlePointerUp();
  };

  /* ---------- Section Style ---------- */

  const resolvedStyle: React.CSSProperties = {
    position: "relative",
    display: isFree ? "block" : "flex",
    flexDirection:
      m === "row" ? "row" : m === "column" ? "column" : undefined,
    gap: isFree ? undefined : (normalizeDim(pickResponsive(gap, bp)) as any),
    width: normalizeDim(pickResponsive(width, bp)),
    height: normalizeDim(pickResponsive(height, bp)),
    minWidth: normalizeDim(pickResponsive(minWidth, bp)),
    minHeight: normalizeDim(pickResponsive(minHeight, bp)),
    maxWidth: normalizeDim(pickResponsive(maxWidth, bp)),
    maxHeight: normalizeDim(pickResponsive(maxHeight, bp)),
    padding: normalizeDim(pickResponsive(padding, bp)) as any,
    background: pickResponsive(background, bp),
    borderRadius: normalizeDim(
      pickResponsive(borderRadius, bp)
    ) as any,
    order,
    ...style,
  };

  if (isFree && !resolvedStyle.height && logicalSize) {
    (resolvedStyle as any).aspectRatio = `${logicalSize.width} / ${logicalSize.height}`;
    resolvedStyle.overflow = resolvedStyle.overflow ?? "hidden";
  }

  /* ---------- Validation ---------- */

  const validationIssues = validateSectionLayout({
    sectionId: id,
    mode: m,
    logicalSize,
    children,
    bp,
  });

  if (validationIssues.length > 0) {
    events?.onLayoutValidation?.({ sectionId: id, issues: validationIssues });

    for (const issue of validationIssues) {
      const prefix = `[PsyLayout Validation] [Section: ${id ?? "unknown"}]`;
      const suggestionPrefix = "Suggestion:";
      switch (issue.type) {
        case "MissingLogicalSize":
          console.error(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "اگر از free-mode استفاده می‌کنید، logicalSize (مثلاً 1200×600) را مشخص کنید."
          );
          if (issue.severity === "error") {
            const err = new Error(issue.message);
            events?.onError?.(err);
            throw err;
          }
          break;
        case "InvalidRect":
          console.warn(prefix, issue.message);
          break;
        case "OffsetWithoutLogicalSize":
          console.warn(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "یا logicalSize را اضافه کنید، یا offset را به صورت درصدی/رشته‌ای مثل '10%' بدهید."
          );
          break;
        case "ModeConflict":
          console.warn(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "در row/column بهتر است از flex و offset استفاده شود، rect را برای free-mode نگه دارید."
          );
          break;
        case "Overlap":
          console.warn(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "اگر روی هم افتادن ناخواسته است، logicalRect یا zIndex/offset را اصلاح کنید."
          );
          events?.onLocatorCollision?.({
            sectionId: id,
            aId: issue.locatorId,
            bId: issue.otherLocatorId,
          });
          break;
      }
    }
  }

  /* ---------- Paging: slicing / lazy (غیر slider-slide) ---------- */

  let pageChildren: React.ReactNode[] = orderedAll;

  if (
    isPaged &&
    totalPages > 1 &&
    !isSliderSlide // در slider+slide، خودمان ترک را مدیریت می‌کنیم
  ) {
    if (lazy) {
      const start = safePageIndex * effectivePageSize;
      const end = start + effectivePageSize;
      pageChildren = orderedAll.slice(start, end);
    } else {
      pageChildren = orderedAll.map((el, idx) => {
        const page = Math.floor(idx / effectivePageSize);
        const isCurrent = page === safePageIndex;
        if (isCurrent) return el;
        const props: any = (el as any).props || {};
        return React.cloneElement(el as any, {
          ...props,
          style: {
            ...(props.style || {}),
            opacity: 0,
            pointerEvents: "none",
            position: "absolute",
          },
          "data-psy-hidden-page": page,
        });
      });
    }
  }

  const baseForZ =
    isSliderSlide && isPaged && totalPages > 1 ? orderedAll : pageChildren;

  const zSorted = sortLocatorsByZIndex(baseForZ, bp, events);

  let innerContent: React.ReactNode;

  if (isSliderSlide && isPaged && totalPages > 1) {
    const slides = zSorted;
    const slideCount = slides.length || 1;

    const deltaPercent =
      sectionWidth > 0 ? (dragDeltaX / sectionWidth) * 100 : 0;
    const basePercent = -safePageIndex * 100;
    const totalPercent = basePercent + (dragging ? deltaPercent : 0);

    innerContent = (
      <div
        className="psy-slider-viewport"
        style={{
          overflow: "hidden",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <div
          className="psy-slider-track"
          style={{
            display: "flex",
            width: `${slideCount * 100}%`,
            transform: `translateX(${totalPercent}%)`,
            transition: dragging ? "none" : "transform 350ms ease",
            touchAction: "pan-y",
          }}
        >
          {slides.map((child, idx) => (
            <div
              key={(child as any).key ?? idx}
              style={{
                flex: "0 0 100%",
                maxWidth: "100%",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    innerContent = zSorted;
  }

  events?.onSectionRender?.({ id });

  /* ---------- Paging Controls ---------- */

  let controls: React.ReactNode = null;
  if (isPaged && totalPages > 1 && (showDots || showArrows)) {
    controls = (
      <div
        className="psy-section-controls"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        {showArrows && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous"
            style={{
              border: "none",
              borderRadius: 999,
              padding: "4px 10px",
              cursor: "pointer",
              background: "#eee",
              fontSize: 16,
            }}
          >
            ‹
          </button>
        )}

        {showDots && (
          <div
            className="psy-section-dots"
            style={{ display: "flex", gap: 6 }}
          >
            {Array.from({ length: totalPages }).map((_, idx) => {
              const active = idx === safePageIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToPage(idx)}
                  aria-label={`Page ${idx + 1}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "#333" : "#ccc",
                    padding: 0,
                  }}
                />
              );
            })}
          </div>
        )}

        {showArrows && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next"
            style={{
              border: "none",
              borderRadius: 999,
              padding: "4px 10px",
              cursor: "pointer",
              background: "#eee",
              fontSize: 16,
            }}
          >
            ›
          </button>
        )}
      </div>
    );
  }

  return (
    <section
      ref={sectionRef as any}
      id={id}
      className={className}
      style={resolvedStyle}
      data-psy-page={safePageIndex}
      data-psy-pages={totalPages}
      data-psy-animation={animation}
      data-psy-mode={pagingMode}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <FreeLayoutCtx.Provider
        value={{ logicalSize: logicalSize ?? null, snap: snapConfig }}
      >
        {innerContent}
      </FreeLayoutCtx.Provider>
      {controls}
    </section>
  );
};

/* ============================================
 *  LOCATOR
 * ============================================ */

export type LocatorProps = {
  id?: string;
  children?: React.ReactNode;

  rect?: Responsive<Rect>;
  logicalRect?: Responsive<LogicalRect>;
  zIndex?: Responsive<number>;

  flex?: Responsive<string | number>;
  alignSelf?: Responsive<React.CSSProperties["alignSelf"]>;

  hidden?: Visibility;
  order?: number;
  className?: string;
  style?: React.CSSProperties;

  offsetX?: Responsive<number | string>;
  offsetY?: Responsive<number | string>;

  constraints?: LocatorConstraints;

  rules?: LayoutRule[];
};

export const Locator: React.FC<LocatorProps> = ({
  id,
  children,
  rect,
  logicalRect,
  zIndex,
  flex,
  alignSelf,
  hidden,
  order = 0,
  className,
  style,
  offsetX,
  offsetY,
  constraints,
  rules,
}) => {
  const { bp, width: viewportWidth } = useBreakpoint();
  const events = usePsyEvents();
  const { logicalSize, snap } = useContext(FreeLayoutCtx);

  const baseVisible = resolveVisibility(hidden, bp);

  let finalVisible = baseVisible;
  let ruleOffsetX: number | string | undefined;
  let ruleOffsetY: number | string | undefined;
  let ruleZIndex: number | undefined;

  if (rules && rules.length > 0) {
    for (const rule of rules) {
      if (matchRule(rule.when, viewportWidth)) {
        if (rule.hidden !== undefined) {
          finalVisible = !rule.hidden ? true : false;
        }
        if (rule.offsetX !== undefined) ruleOffsetX = rule.offsetX;
        if (rule.offsetY !== undefined) ruleOffsetY = rule.offsetY;
        if (rule.zIndex !== undefined) ruleZIndex = rule.zIndex;
      }
    }
  }

  if (!finalVisible) return null;

  let finalRect: Rect | undefined;
  const lr = logicalRect
    ? (pickResponsive(logicalRect, bp) as LogicalRect | undefined)
    : undefined;

  if (logicalSize && lr) {
    let x = lr.x;
    let y = lr.y;
    let w = lr.w;
    let h = lr.h;

    if (snap && snap.grid > 0) {
      const grid = snap.grid;
      const mode = snap.mode ?? "strict";
      const axes = snap.axes ?? "both";
      const threshold = snap.threshold ?? 0;

      const snapValue = (val: number) => {
        const rounded = Math.round(val / grid) * grid;
        if (mode === "soft") {
          const diff = Math.abs(rounded - val);
          if (diff <= threshold) return rounded;
          return val;
        }
        return rounded;
      };

      if (axes === "x" || axes === "both") {
        x = snapValue(x);
        w = snapValue(w);
      }
      if (axes === "y" || axes === "both") {
        y = snapValue(y);
        h = snapValue(h);
      }
    }

    const { width: LW, height: LH } = logicalSize;
    finalRect = {
      left: `${(x / LW) * 100}%`,
      top: `${(y / LH) * 100}%`,
      width: `${(w / LW) * 100}%`,
      height: `${(h / LH) * 100}%`,
    };
  } else {
    finalRect = pickResponsive(rect ?? {}, bp) ?? {};
  }

  if (constraints?.keepAspectRatio && finalRect) {
    const ratio = constraints.keepAspectRatio;
    const wVal = finalRect.width;
    const hVal = finalRect.height;

    if (typeof wVal === "number" && typeof hVal !== "number") {
      finalRect.height = wVal / ratio;
    } else if (typeof hVal === "number" && typeof wVal !== "number") {
      finalRect.width = hVal * ratio;
    }
  }

  const r = finalRect ?? {};

  let absStyle: React.CSSProperties = {
    position:
      r.left !== undefined ||
      r.top !== undefined ||
      r.width !== undefined ||
      r.height !== undefined
        ? "absolute"
        : undefined,
    left: normalizeDim(r.left),
    top: normalizeDim(r.top),
    width: normalizeDim(r.width),
    height: normalizeDim(r.height),
    zIndex:
      ruleZIndex ??
      (pickResponsive(zIndex ?? undefined, bp) as any),
    pointerEvents: "auto",
  };

  const flowStyle: React.CSSProperties = {
    order,
    flex: pickResponsive(flex ?? undefined, bp) as any,
    alignSelf: pickResponsive(alignSelf ?? undefined, bp),
  };

  const rawOx = ruleOffsetX ?? pickResponsive(offsetX, bp);
  const rawOy = ruleOffsetY ?? pickResponsive(offsetY, bp);

  const effectiveOx = constraints?.lockX ? undefined : rawOx;
  const effectiveOy = constraints?.lockY ? undefined : rawOy;

  let ox: string | undefined;
  let oy: string | undefined;

  if (typeof effectiveOx === "number") {
    if (logicalSize) {
      ox = `${(effectiveOx / logicalSize.width) * 100}%`;
    } else {
      ox = `${effectiveOx}px`;
    }
  } else if (typeof effectiveOx === "string") {
    ox = effectiveOx;
  }

  if (typeof effectiveOy === "number") {
    if (logicalSize) {
      oy = `${(effectiveOy / logicalSize.height) * 100}%`;
    } else {
      oy = `${effectiveOy}px`;
    }
  } else if (typeof effectiveOy === "string") {
    oy = effectiveOy;
  }

  const userStyle = style ?? {};
  const userTransform = userStyle.transform as string | undefined;

  const translate =
    ox || oy ? `translate(${ox ?? "0"}, ${oy ?? "0"})` : undefined;

  if (constraints && absStyle.position === "absolute") {
    if (constraints.centerX) {
      absStyle.left = "50%";
    }
    if (constraints.centerY) {
      absStyle.top = "50%";
    }
    if (constraints.pinLeft) {
      absStyle.left = normalizeDim(r.left ?? 0);
    }
    if (constraints.pinRight) {
      (absStyle as any).right = 0;
    }
    if (constraints.pinTop) {
      absStyle.top = normalizeDim(r.top ?? 0);
    }
    if (constraints.pinBottom) {
      (absStyle as any).bottom = 0;
    }
  }

  const finalTransform =
    [userTransform, translate].filter(Boolean).join(" ") || undefined;

  const resolvedStyle: React.CSSProperties = {
    ...flowStyle,
    ...absStyle,
    ...userStyle,
    transform: finalTransform,
  };

  events?.onLocatorRender?.({
    id,
    zIndex: resolvedStyle.zIndex as number | undefined,
  });

  return (
    <div id={id} className={className} style={resolvedStyle}>
      {children}
    </div>
  );
};
