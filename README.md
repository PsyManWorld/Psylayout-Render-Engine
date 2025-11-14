# PsyLayout Engine (Phase 1)

یک موتور Layout ماژولار برای React / Next.js که مخصوص طراحی‌های داینامیک، **free-mode** و **row/column** است و امکان:
- Container / Section / Locator سه‌لایه‌ای
- رفتار ریسپانسیو بر اساس breakpoint
- سیستم رویداد (hook) برای مانیتورینگ و دیباگ
- Layout Validation (تشخیص ایرادات رایج در free-mode و flex-mode)
را فراهم می‌کند.

> **نکته مهم**  
> این ریپو فقط اسکلت اولیه فایل `design-manager.tsx` را دارد.  
> پیاده‌سازی کامل PsyLayout Engine Phase 1 را که در چت ساخته‌ایم، می‌توانی مستقیماً در همین فایل جایگزین کنی.

---

## ساختار پوشه

```text
psylayout-engine/
├── src/
│   └── design-manager.tsx   # هسته‌ی PsyLayout Engine (جایگزین کن با نسخه کامل خودت)
└── README.md
```

---

## نحوه استفاده در پروژه Next.js

1. این ریپو را در یک پکیج داخلی (مثلاً داخل monorepo) قرار بده، یا محتویات `src/design-manager.tsx` را کپی کن در مسیر دلخواهت.

2. در پروژه اصلی، مسیر ایمپورت را مطابق معماری خودت تنظیم کن. مثال:

```tsx
import {
  DesignManagerProvider,
  Container,
  Section,
  Locator,
} from "@girpazh/core/designmanager/design-manager";
```

3. در `layout.tsx` یا روت اپ، PsyLayout Provider را اضافه کن:

```tsx
<DesignManagerProvider
  events={{
    onError: (err) => console.error("[PsyLayout Error]", err),
    onLayoutValidation: ({ sectionId, issues }) => {
      console.log("[PsyLayout Validation]", sectionId, issues);
    },
    onLocatorCollision: ({ sectionId, aId, bId }) => {
      console.warn("[PsyLayout Collision]", { sectionId, aId, bId });
    },
  }}
>
  {children}
</DesignManagerProvider>
```

---

## ایده‌ی مفهومی PsyLayout

PsyLayout Engine سه سطح اصلی دارد:

- **Container**: ریشه‌ی هر بلاک صفحه (عرض، پس‌زمینه، padding و ...)
- **Section**: مدهای مختلف layout (`free`، `row`، `column`) + رفتار ریسپانسیو
- **Locator**: محل دقیق قرارگیری هر کامپوننت، با امکان استفاده از:
  - `rect` / `logicalRect`
  - `offsetX` / `offsetY`
  - `zIndex` و Ruleهای شرطی بر اساس عرض صفحه

در نسخه‌ی کامل Phase 1، یک Validation Engine نیز وجود دارد که:

- `free-mode` بدون `logicalSize` را خطا می‌گیرد
- rect ناقص / offset عددی بدون logicalSize را هشدار می‌دهد
- استفاده‌ی اشتباه از rect در `row/column` را هشدار می‌دهد
- روی‌هم‌افتادگی (overlap) Locatorها را در free-mode شناسایی می‌کند

---

## توسعه‌های آینده

نسخه‌ی کامل PsyLayout Engine که در چت طراحی کردیم، قابلیت‌های زیر را هم شامل می‌شود (می‌توانی در همین ریپو ادامه‌اش بدهی):

- Constraint Engine پیشرفته (center, pin, attachTo, ...)
- Snap Grid هوشمند
- PsyLayout Debugger Panel (DevTools اختصاصی)
- JSON Schema برای Layout و Renderer عمومی
- Editor Mode (drag & drop) برای ساخت صفحه بدون کد

---

## لایسنس

طراحی شده توسط تیم نرم افزاری هوشیار
www.ho-oshyar.ir
