"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/* ------------------------------------
 * Types & Utilities
 * ------------------------------------ */

export type BreakpointKey = "base" | "sm" | "md" | "lg" | "xl";

const BREAKPOINTS: Record<Exclude<BreakpointKey, "base">, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export type Responsive<T> = T | Partial<Record<BreakpointKey, T>>;

export type Rect = {
  left?: number | string;
  top?: number | string;
  width?: number | string;
  height?: number | string;
};

export type Visibility = boolean | Partial<Record<BreakpointKey, boolean>>;

export type LogicalSize = { width: number; height: number };
export type LogicalRect = { x: number; y: number; w: number; h: number };

// Rule Engine ساده: برای رفتار شرطی بر اساس عرض
export type LayoutRule = {
  when: string; // "<600" | "600-1024" | ">1200" ...
  hidden?: boolean;
  offsetX?: number | string;
  offsetY?: number | string;
  zIndex?: number;
};

/* ---------- Layout Validation ---------- */

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
  locatorId?: string;
  otherLocatorId?: string;
  sectionId?: string;
};

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
  return (obj[bp] ?? obj.base) as T;
}

function normalizeDim(val?: number | string): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "number") return `${val}px`;
  return val;
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

// مرتب‌سازی اولیه بر اساس order
function sortByOrder(children: React.ReactNode): React.ReactNode {
  const arr = React.Children.toArray(children) as React.ReactElement[];
  const withOrder = arr.map((el, idx) => {
    const props: any = (el as any)?.props;
    const o = typeof props?.order === "number" ? props.order : idx;
    return { el, order: o };
  });
  withOrder.sort((a, b) => a.order - b.order);
  return withOrder.map((x) => x.el);
}

// Rule Engine ساده برای width
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

/* ------------------------------------
 * Event / Hook System
 * ------------------------------------ */

export type PsyLayoutEvents = {
  onError?: (error: Error) => void;
  onSectionRender?: (info: { id?: string }) => void;
  onLocatorRender?: (info: { id?: string; zIndex?: number }) => void;

  // فاز ۱:
  onRenderStart?: () => void;
  onRenderEnd?: () => void;
  onLayoutValidation?: (info: {
    sectionId?: string;
    issues: LayoutIssue[];
  }) => void;
  onLocatorCollision?: (info: {
    sectionId?: string;
    aId?: string;
    bId?: string;
  }) => void;
};

const EventsCtx = createContext<PsyLayoutEvents | null>(null);

/* ------------------------------------
 * Breakpoint Context
 * ------------------------------------ */

const DesignCtx = createContext<{ bp: BreakpointKey; width: number }>({
  bp: "base",
  width: 0,
});

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
  const value = useMemo(() => ({ bp, width: w }), [bp, w]);

  // Hooks رندر کلی
  useEffect(() => {
    events?.onRenderStart?.();
    return () => {
      events?.onRenderEnd?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <EventsCtx.Provider value={events ?? null}>
      <DesignCtx.Provider value={value}>{children}</DesignCtx.Provider>
    </EventsCtx.Provider>
  );
};

export const useBreakpoint = () => useContext(DesignCtx);
export const usePsyEvents = () => useContext(EventsCtx);

/* ------------------------------------
 * Free Layout / Snap / Logical Context
 * ------------------------------------ */

type FreeLayoutContextValue = {
  logicalSize: LogicalSize | null;
  snap?: number;
};

const FreeLayoutCtx = createContext<FreeLayoutContextValue>({
  logicalSize: null,
  snap: undefined,
});

/* ------------------------------------
 * Container
 * ------------------------------------ */

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

/* ------------------------------------
 * Section
 * ------------------------------------ */

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
  snap?: number;
  rules?: LayoutRule[];
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

/* ---------- Layout Validation Engine برای Section ---------- */

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

  // ۱) free-mode بدون logicalSize → خطا
  if (mode === "free" && !logicalSize) {
    issues.push({
      type: "MissingLogicalSize",
      severity: "error",
      message:
        "Section در حالت free است اما logicalSize تعریف نشده است. برای رفتار نسبتی و درست، logicalSize را تنظیم کنید.",
      sectionId,
    });
  }

  // کمک برای محاسبه‌ی تقریباً مستطیل‌ها جهت overlap
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
    if (mode === "free") {
      if (r) {
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
    }

    // ۳) offset عددی بدون logicalSize (هشدار)
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

    // ۴) ModeConflict: استفاده از rect/logicalRect در row/column
    if ((mode === "row" || mode === "column") && (r || lr)) {
      issues.push({
        type: "ModeConflict",
        severity: "warning",
        message: `Locator "${
          loc.id ?? "unknown"
        }" در حالت ${mode} از rect/logicalRect استفاده کرده است. معمولاً در row/column بهتر است از flex و offset استفاده کنید، نه position:absolute.`,
        locatorId: loc.id,
        sectionId,
      });
    }

    // ۵) اگر logicalSize و logicalRect داریم → جعبه منطقی برای تشخیص overlap
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

  // ۶) Overlap detection (ساده) در free-mode
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
      const overlapArea = overlapX * overlapY;
      if (overlapArea > 0) {
        issues.push({
          type: "Overlap",
          severity: "warning",
          message: `Locator "${
            a.id ?? "A"
          }" و "${b.id ?? "B"}" در free-mode روی هم افتاده‌اند. اگر عمدی نیست، logicalRect را اصلاح کنید یا zIndex/offset را تغییر دهید.`,
          locatorId: a.id,
          otherLocatorId: b.id,
          sectionId,
        });
      }
    }
  }

  return issues;
}

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
}) => {
  const { bp, width: viewportWidth } = useBreakpoint();
  const events = usePsyEvents();

  const baseVisible = resolveVisibility(hidden, bp);
  const visible = applySectionRules(baseVisible, rules, viewportWidth);
  if (!visible) return null;

  const m = pickResponsive(mode, bp) ?? "row";
  const isFree = m === "free";

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

  // free + logicalSize: aspectRatio
  if (isFree && !resolvedStyle.height && logicalSize) {
    (resolvedStyle as any).aspectRatio = `${logicalSize.width} / ${logicalSize.height}`;
    resolvedStyle.overflow = resolvedStyle.overflow ?? "hidden";
  }

  // اعتبارسنجی layout
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
            "اگر از free-mode استفاده می‌کنید، logicalSize (مثلاً 1200×600) را مشخص کنید تا مختصات نسبتی و درست کار کنند."
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
            "یا logicalSize را اضافه کنید، یا offset را از واحدهای درصدی/رشته‌ای مثل '10%' و '1rem' استفاده کنید."
          );
          break;
        case "ModeConflict":
          console.warn(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "در row/column بهتر است از flex/offset استفاده شود و rect برای free-mode نگه داشته شود."
          );
          break;
        case "Overlap":
          console.warn(
            prefix,
            issue.message,
            "\n",
            suggestionPrefix,
            "اگر این روی‌هم‌افتادگی ناخواسته است، logicalRect را اصلاح کنید یا zIndex/offset آنها را تغییر دهید."
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

  const ordered = sortByOrder(children);
  const content = sortLocatorsByZIndex(ordered, bp, events);

  events?.onSectionRender?.({ id });

  return (
    <section id={id} className={className} style={resolvedStyle}>
      <FreeLayoutCtx.Provider
        value={{ logicalSize: logicalSize ?? null, snap }}
      >
        {content}
      </FreeLayoutCtx.Provider>
    </section>
  );
};

/* ------------------------------------
 * zIndex Sorting + Validation
 * ------------------------------------ */

function sortLocatorsByZIndex(
  children: React.ReactNode,
  bp: BreakpointKey,
  events: PsyLayoutEvents | null
): React.ReactNode {
  const arr = React.Children.toArray(children) as React.ReactElement[];

  const locators = arr.map((el, idx) => {
    const props: any = (el as any)?.props || {};
    const rawZ: any = props.zIndex;
    const resolvedZ =
      typeof rawZ === "object"
        ? pickResponsive<number>(rawZ, bp)
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
        `❌ Duplicate zIndex detected: ${item.zIndex}\n` +
          `Each Locator must have a unique zIndex inside a Section.\n` +
          `Please fix the zIndex ordering. Offending element:`,
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

/* ------------------------------------
 * Locator
 * ------------------------------------ */

export type LocatorConstraints = {
  centerX?: boolean;
  centerY?: boolean;
  pinLeft?: boolean;
  pinRight?: boolean;
  pinTop?: boolean;
  pinBottom?: boolean;
};

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

    if (snap && snap > 0) {
      const s = snap;
      const roundTo = (val: number) => Math.round(val / s) * s;
      x = roundTo(x);
      y = roundTo(y);
      w = roundTo(w);
      h = roundTo(h);
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

  // offsetX / offsetY نسبتی (اگر logicalSize داریم)
  const rawOx = ruleOffsetX ?? pickResponsive(offsetX, bp);
  const rawOy = ruleOffsetY ?? pickResponsive(offsetY, bp);

  let ox: string | undefined;
  let oy: string | undefined;

  if (typeof rawOx === "number") {
    if (logicalSize) {
      ox = `${(rawOx / logicalSize.width) * 100}%`;
    } else {
      ox = `${rawOx}px`;
    }
  } else if (typeof rawOx === "string") {
    ox = rawOx;
  }

  if (typeof rawOy === "number") {
    if (logicalSize) {
      oy = `${(rawOy / logicalSize.height) * 100}%`;
    } else {
      oy = `${rawOy}px`;
    }
  } else if (typeof rawOy === "string") {
    oy = rawOy;
  }

  const userStyle = style ?? {};
  const userTransform = userStyle.transform as string | undefined;

  const translate =
    ox || oy ? `translate(${ox ?? "0"}, ${oy ?? "0"})` : undefined;

  // constraints در حالت absolute
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
