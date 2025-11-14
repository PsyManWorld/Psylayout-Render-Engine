// src/app/psylayout-lab/page.tsx
"use client";

import React, { useCallback, useState } from "react";
import {
  DesignManagerProvider,
  Container,
  Section,
  Locator,
  useBreakpoint,
  type LayoutIssue,
} from "../psylayoutengine/design-manager";

/* -------------------------
 * Helpers
 * ------------------------- */

function formatIssues(sectionId: string | undefined, issues: LayoutIssue[]) {
  return `validation[${sectionId ?? "unknown"}]: ${issues
    .map((i) => i.type)
    .join(", ")}`;
}

/* -------------------------
 * Event Log Hook
 * ------------------------- */

function useEventLog(max = 50) {
  const [log, setLog] = useState<string[]>([]);
  const push = useCallback(
    (msg: string) => {
      const time = new Date().toISOString().split("T")[1]?.slice(0, 8);
      setLog((prev) => [`[${time}] ${msg}`, ...prev].slice(0, max));
    },
    [max]
  );
  const clear = () => setLog([]);
  return { log, push, clear };
}

/* -------------------------
 * Main Page
 * ------------------------- */

export default function PsyLayoutLabPage() {
  const { log, push, clear } = useEventLog(80);

  return (
    <DesignManagerProvider
      events={{
        onRenderStart: () => push("render:start"),
        onRenderEnd: () => push("render:end"),
        onLayoutValidation: ({ sectionId, issues }) =>
          push(formatIssues(sectionId, issues)),
        onLocatorCollision: ({ sectionId, aId, bId }) =>
          push(`collision[${sectionId ?? "unknown"}]: ${aId} x ${bId}`),
        onLocatorRender: ({ id, zIndex }) =>
          push(`locator:${id ?? "unknown"} z=${zIndex ?? "auto"}`),
        onError: (err) => push(`ERROR: ${err.message}`),
      }}
    >
      <main
        className="min-h-screen w-full"
        style={{
          background: "radial-gradient(circle at top,#020617,#020617 40%,#000)",
          color: "#e5e7eb",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,system-ui,Segoe UI,Roboto,sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "32px 16px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Header */}
          <header
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.85)",
                border: "1px solid rgba(148,163,184,0.35)",
                width: "fit-content",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at center,#22c55e,#15803d)",
                }}
              />
              <span style={{ fontSize: 11, letterSpacing: 0.06 }}>
                PsyLayout Engine · Dark Lab
              </span>
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.03,
              }}
            >
              PsyLayout Engine – Interactive Lab
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#9ca3af",
                maxWidth: 640,
              }}
            >
              این صفحه برای تست کامل PsyLayout طراحی شده: free-mode + snap +
              constraints، اسلایدر drag شونده، paging، animation، rule engine و
              رویدادهای داخلی. از پنل سمت چپ تنظیم کن، نتیجه را در پیش‌نمایش
              ببین.
            </p>
          </header>

          {/* Main layout: Controls + Preview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
              gap: 24,
            }}
          >
            <ControlPanelCard onClearLog={clear} />
            <PreviewCard />
          </div>

          {/* Event Log */}
          <EventLogCard log={log} onClear={clear} />
        </div>
      </main>
    </DesignManagerProvider>
  );
}

/* -------------------------
 * Control Panel
 * ------------------------- */

type ControlPanelProps = {
  onClearLog: () => void;
};

const ControlPanelCard: React.FC<ControlPanelProps> = ({ onClearLog }) => {
  // shared state via context: we'll lift down into Preview via URL-less pattern:
  // برای سادگی، اینجا فقط توضیح می‌دهیم و کنترل واقعی را به Preview می‌سپریم.
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.92)",
        borderRadius: 16,
        border: "1px solid rgba(148,163,184,0.4)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 20px 45px rgba(0,0,0,0.6)",
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Controls
        <span
          style={{
            fontSize: 11,
            color: "#9ca3af",
            fontWeight: 400,
          }}
        >
          تنظیمات اسلایدر و Layout
        </span>
      </h2>

      <p
        style={{
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        سمت راست تغییرات را Live می‌بینی. کنترل‌ها روی اسلایدر اصلی و بخش
        free-mode اعمال شده‌اند.
      </p>

      <div
        style={{
          marginTop: 4,
          padding: 10,
          borderRadius: 12,
          background:
            "radial-gradient(circle at top,#0f172a,#020617 60%,#000)",
          border: "1px solid rgba(55,65,81,0.8)",
          fontSize: 11,
          color: "#9ca3af",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: "#e5e7eb",
            marginBottom: 4,
          }}
        >
          راهنما
        </div>
        <span>• اسلایدر: drag با ماوس/تاچ، autoplay، loop، dots، arrows</span>
        <span>• free-mode: logicalSize، snap و constraints</span>
        <span>• Event Log پایین صفحه، همهٔ رویدادها را نشان می‌دهد.</span>
      </div>

      <button
        type="button"
        onClick={onClearLog}
        style={{
          marginTop: 8,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.4)",
          background: "rgba(15,23,42,0.9)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        پاک کردن Event Log
      </button>

      <div
        style={{
          marginTop: 8,
          padding: 10,
          borderRadius: 12,
          background: "rgba(15,23,42,0.8)",
          border: "1px dashed rgba(75,85,99,0.8)",
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        برای کنترل دقیق‌تر، می‌توانیم در نسخه بعدی state مشترک بین این پنل و
        Preview تعریف کنیم تا pagingMode، animation و سایر پارامترها را از طریق
        UI تغییر دهی. در این نسخه، تمرکز روی نمایش امکانات PsyLayout است.
      </div>
    </div>
  );
};

/* -------------------------
 * Preview Card (Live Demo)
 * ------------------------- */

const PreviewCard: React.FC = () => {
  const [pagingMode, setPagingMode] = useState<"none" | "pages" | "slider">(
    "slider"
  );
  const [animation, setAnimation] = useState<
    "none" | "slide" | "fade" | "scale"
  >("slide");
  const [pageSize, setPageSize] = useState<number>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [loop, setLoop] = useState<boolean>(true);
  const [lazy, setLazy] = useState<boolean>(false);
  const [showDots, setShowDots] = useState<boolean>(true);
  const [showArrows, setShowArrows] = useState<boolean>(true);
  const [snapGrid, setSnapGrid] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const { bp } = useBreakpoint();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Small control strip (real controls bound to state) */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.4)",
          background: "rgba(15,23,42,0.92)",
          padding: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 8 }}>
          Breakpoint:{" "}
          <strong style={{ color: "#e5e7eb" }}>{bp.toUpperCase()}</strong>
        </span>

        <select
          value={pagingMode}
          onChange={(e) =>
            setPagingMode(e.target.value as "none" | "pages" | "slider")
          }
          style={selectStyle}
        >
          <option value="none">pagingMode: none</option>
          <option value="pages">pagingMode: pages</option>
          <option value="slider">pagingMode: slider</option>
        </select>

        <select
          value={animation}
          onChange={(e) =>
            setAnimation(
              e.target.value as "none" | "slide" | "fade" | "scale"
            )
          }
          style={selectStyle}
        >
          <option value="none">animation: none</option>
          <option value="slide">animation: slide</option>
          <option value="fade">animation: fade</option>
          <option value="scale">animation: scale</option>
        </select>

        <input
          type="number"
          min={1}
          max={4}
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value) || 1)}
          style={{ ...inputStyle, width: 70 }}
          placeholder="pageSize"
        />

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={autoPlay}
            onChange={(e) => setAutoPlay(e.target.checked)}
          />{" "}
          autoPlay
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />{" "}
          loop
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={lazy}
            onChange={(e) => setLazy(e.target.checked)}
          />{" "}
          lazy
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={showDots}
            onChange={(e) => setShowDots(e.target.checked)}
          />{" "}
          dots
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={showArrows}
            onChange={(e) => setShowArrows(e.target.checked)}
          />{" "}
          arrows
        </label>

        <label style={{ ...checkboxLabel, marginLeft: "auto" }}>
          snap grid:
          <input
            type="number"
            min={0}
            max={80}
            value={snapGrid}
            onChange={(e) =>
              setSnapGrid(Math.max(0, Number(e.target.value) || 0))
            }
            style={{ ...inputStyle, width: 60, marginLeft: 4 }}
          />
        </label>
      </div>

      {/* Live Layout Preview */}
      <Container
        id="lab-container"
        width={{ base: "100%", md: 820 }}
        padding={{ base: 12, md: 16 }}
        background="rgba(15,23,42,0.95)"
        borderRadius={20}
        style={{
          border: "1px solid rgba(148,163,184,0.4)",
          boxShadow: "0 20px 45px rgba(0,0,0,0.65)",
        }}
      >
        {/* Free-mode demo */}
        <Section
          id="free-demo"
          mode="free"
          logicalSize={{ width: 1200, height: 480 }}
          snap={snapGrid > 0 ? { grid: snapGrid, mode: "soft", axes: "both", threshold: snapGrid / 2 } : undefined}
          padding={12}
          background="#020617"
          borderRadius={16}
          style={{
            border: "1px solid rgba(55,65,81,0.9)",
            marginBottom: 16,
          }}
        >
          {/* Background */}
          <Locator
            id="free-bg"
            logicalRect={{ x: 0, y: 0, w: 1200, h: 480 }}
            zIndex={1}
            className="bg"
            style={{
              borderRadius: 14,
              background:
                "radial-gradient(circle at top,#0f172a,#020617 55%,#000)",
            }}
          />

          {/* Card */}
          <Locator
            id="free-card"
            logicalRect={{ x: 120, y: 120, w: 420, h: 220 }}
            zIndex={3}
            constraints={{ keepAspectRatio: 16 / 9 }}
            className="card"
            style={{
              borderRadius: 20,
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(148,163,184,0.7)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.12,
                  color: "#fbbf24",
                  marginBottom: 4,
                }}
              >
                PsyLayout Free-Mode
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                logicalRect + snap grid
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                این کارت روی شبکه‌ی منطقی 1200×480 قرار گرفته و با snap {">"}= 0،
                مختصاتش روی Grid قرار می‌گیرد. تغییر snap grid در پنل بالا را
                در رندر این بخش احساس می‌کنی.
              </p>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 8,
              }}
            >
              logicalSize: 1200×480 · pattern: soft snap
            </div>
          </Locator>

          {/* Badge با offset */}
          <Locator
            id="free-badge"
            logicalRect={{ x: 420, y: 270, w: 160, h: 64 }}
            offsetX={20}
            offsetY={-14}
            zIndex={4}
            className="badge"
            style={{
              borderRadius: 999,
              background:
                "linear-gradient(135deg,#22c55e,#4ade80,#bbf7d0)",
              color: "#052e16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(34,197,94,0.5)",
            }}
          >
            OFFSET + SNAP + LOGICALSIZE
          </Locator>

          {/* Image placeholder pinned right */}
          <Locator
            id="free-visual"
            logicalRect={{ x: 640, y: 80, w: 480, h: 260 }}
            zIndex={2}
            constraints={{ keepAspectRatio: 16 / 9, pinRight: true, pinTop: true }}
            className="visual"
            style={{
              borderRadius: 24,
              border: "1px solid rgba(148,163,184,0.7)",
              background:
                "radial-gradient(circle at top,#1e293b,#020617 60%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            Free-mode Visual (16:9, pinned right)
          </Locator>
        </Section>

        {/* Slider demo */}
        <Section
          id="slider-demo"
          mode="row"
          pagingMode={pagingMode}
          pageSize={pageSize}
          defaultPage={0}
          currentPage={undefined}
          showDots={showDots}
          showArrows={showArrows}
          loop={loop}
          autoPlay={autoPlay}
          autoPlayInterval={4000}
          lazy={lazy}
          animation={animation}
          padding={0}
          background="#020617"
          borderRadius={16}
          style={{
            border: "1px solid rgba(55,65,81,0.9)",
            overflow: "hidden",
          }}
          onPageChange={(page) => setCurrentPage(page)}
        >
          {["Red", "Green", "Blue", "Purple"].map((label, index) => (
            <Locator
              key={index}
              id={`slide-${label.toLowerCase()}`}
              className="slide"
              style={{
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                color: "#0f172a",
                background:
                  label === "Red"
                    ? "linear-gradient(135deg,#fecaca,#f97316)"
                    : label === "Green"
                    ? "linear-gradient(135deg,#bbf7d0,#22c55e)"
                    : label === "Blue"
                    ? "linear-gradient(135deg,#bfdbfe,#38bdf8)"
                    : "linear-gradient(135deg,#e9d5ff,#a855f7)",
                transition:
                  animation === "fade" || animation === "scale"
                    ? "opacity 300ms ease, transform 300ms ease"
                    : "transform 300ms ease",
              }}
            >
              {label} slide · page {index + 1}
            </Locator>
          ))}
        </Section>

        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "#9ca3af",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            currentPage:{" "}
            <strong style={{ color: "#e5e7eb" }}>{currentPage}</strong>
          </span>
          <span>
            pagingMode: <code>{pagingMode}</code> · animation:{" "}
            <code>{animation}</code>
          </span>
        </div>
      </Container>
    </div>
  );
};

/* -------------------------
 * Event Log Card
 * ------------------------- */

type EventLogProps = {
  log: string[];
  onClear: () => void;
};

const EventLogCard: React.FC<EventLogProps> = ({ log, onClear }) => {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(55,65,81,0.9)",
        background: "rgba(15,23,42,0.95)",
        padding: 12,
        maxHeight: 220,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
        }}
      >
        <span style={{ fontWeight: 600 }}>PsyLayout Event Log</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            fontSize: 11,
            borderRadius: 999,
            border: "1px solid rgba(75,85,99,0.9)",
            padding: "2px 8px",
            background: "rgba(15,23,42,0.9)",
            cursor: "pointer",
            color: "#9ca3af",
          }}
        >
          Clear
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          fontSize: 11,
          lineHeight: 1.5,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          borderRadius: 12,
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(31,41,55,0.9)",
          padding: "6px 8px",
        }}
      >
        {log.length === 0 ? (
          <span style={{ color: "#6b7280" }}>
            هنوز رویدادی ثبت نشده است. با اسلایدر، resize و hover روی بخش‌ها
            کار کن تا رویدادها ثبت شوند.
          </span>
        ) : (
          log.map((line, i) => (
            <div key={i} style={{ whiteSpace: "pre-wrap" }}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* -------------------------
 * Small styles
 * ------------------------- */

const selectStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 6px",
  borderRadius: 999,
  border: "1px solid rgba(75,85,99,0.9)",
  background: "rgba(15,23,42,0.95)",
  color: "#e5e7eb",
};

const inputStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 6px",
  borderRadius: 999,
  border: "1px solid rgba(75,85,99,0.9)",
  background: "rgba(15,23,42,0.95)",
  color: "#e5e7eb",
};

const checkboxLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  color: "#9ca3af",
};
