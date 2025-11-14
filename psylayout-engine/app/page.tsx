"use client";

import React, { useEffect } from "react";
import {
  DesignManagerProvider,
  Container,
  Section,
  Locator,
} from "../psylayoutengine/design-manager";

export default function PsyLayoutTestPage() {
  return (
    <DesignManagerProvider
      events={{
        onRenderStart: () => console.log("🟢 Render Start"),
        onRenderEnd: () => console.log("🔵 Render End"),

        onLayoutValidation: ({ sectionId, issues }) => {
          console.log("⚠️ Layout Validation:", sectionId, issues);
        },

        onLocatorCollision: ({ sectionId, aId, bId }) => {
          console.log(
            "🛑 Collision Detected →",
            "Section:", sectionId,
            "Locators:", aId, bId
          );
        },

        onError: (err) => {
          console.error("🔥 PsyLayout Error →", err);
        },
      }}
    >
      <main className="w-full flex flex-col items-center py-16 gap-20">

        {/* ---------------------------------------
         *  Hero Container - FREE MODE
         -------------------------------------- */}
        <Container
          id="hero-container"
          width={{ base: "100%", md: 1200 }}
          padding={{ base: 16, md: 24 }}
          background="#f9f9f9"
          borderRadius={12}
        >
          <Section
            id="hero-free"
            mode="free"
            logicalSize={{ width: 800, height: 600 }}
            snap={10}
            background="#ffffff"
            style={{ border: "1px solid #ddd" }}
          >

            {/* CARD */}
            <Locator
              id="hero-card"
              logicalRect={{ x: 100, y: 120, w: 380, h: 200 }}
              zIndex={3}
              className="rounded-xl shadow-lg bg-white p-6 flex flex-col"
            >
              <h2 className="text-xl font-bold mb-2">Card Component</h2>
              <p>This card is positioned via <strong>logicalRect</strong>.</p>
            </Locator>

            {/* IMAGE */}
            <Locator
              id="hero-image"
              logicalRect={{ x: 520, y: 60, w: 0, h: 320 }}
              zIndex={2}
              className="rounded-xl bg-red-200 flex items-center justify-center"
            >
              <span className="text-lg font-bold text-red-800">IMAGE</span>
            </Locator>

            {/* BADGE – با offset تستی */}
            <Locator
              id="hero-badge"
              logicalRect={{ x: 300, y: 300, w: 1, h: 80 }}
              offsetX={0}
              offsetY={0}
              zIndex={4}
              className="bg-green-600 text-white rounded-lg p-4 flex items-center justify-center"
            >
              Offset Badge
            </Locator>
          </Section>
        </Container>

        {/* ---------------------------------------
         *  ROW MODE TEST
         -------------------------------------- */}
        <Container width={{ base: "100%", md: 1200 }}>
          <Section
            id="row-section"
            mode="row"
            gap={20}
            padding={20}
            background="#f1f1f1"
            borderRadius={12}
          >
            <Locator
              id="row-item-1"
              className="bg-blue-500 text-white p-6 rounded-xl flex-1"
            >
              <h3 className="text-lg font-semibold mb-2">Row Item 1</h3>
              <p>این یک آیتم Flex است.</p>
            </Locator>

            <Locator
              id="row-item-2"
              className="bg-purple-500 text-white p-6 rounded-xl flex-1"
            >
              <h3 className="text-lg font-semibold mb-2">Row Item 2</h3>
              <p>اینم مورد دوم برای تست ROW.</p>
            </Locator>

            <Locator
              id="row-item-3"
              className="bg-teal-500 text-white p-6 rounded-xl flex-1"
            >
              <h3 className="text-lg font-semibold mb-2">Row Item 3</h3>
              <p>فاز ۱ کامل کار می‌کنه.</p>
            </Locator>
          </Section>
        </Container>
      </main>
    </DesignManagerProvider>
  );
}
