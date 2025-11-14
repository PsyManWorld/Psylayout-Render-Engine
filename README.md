# PsyLayout Engine (Phase 1)

یک موتور Layout ماژولار برای React / Next.js که مخصوص طراحی‌های داینامیک، **free-mode** و **row/column** است و امکان:
را فراهم می‌کند.

> **نکته مهم**  
> این ریپو فقط اسکلت اولیه فایل `design-manager.tsx` را دارد.  
> پیاده‌سازی کامل PsyLayout Engine Phase 1 را که ساخته‌ایم، می‌توانی مستقیماً در همین فایل جایگزین کنی.


# PsyLayout Engine — مستندات پروژه

یک موتور Layout ماژولار برای React / Next.js که برای طراحی‌‌های داینامیک و انعطاف‌پذیر ساخته شده است. این بسته به‌عنوان یک ماژول سبک برای مدیریت ساختار صفحه (Container / Section / Locator) و قوانین ریسپانسیو طراحی شده است.

این مخزن شامل یک پیاده‌سازی شروع (scaffold) و فایل هسته‌ی `design-manager.tsx` در پوشه `psylayout-engine/src` است. می‌توانی آن را به‌عنوان یک پکیج محلی در یک monorepo قرار دهی یا کد را کپی/ایمپورت کنی در پروژه‌ی Next.js خودت.

## ویژگی‌های کلیدی

- سه لایه اصلی: Container, Section, Locator
- مدهای layout: `free`, `row`, `column` با پشتیبانی ریسپانسیو
- مکانیزم رویداد (events/hooks) برای گزارش خطا، اعتبارسنجی و همپوشانی
- زیرساخت برای Validation Engine (قواعد پایه برای تشخیص پیکربندی نادرست)

---

## وضعیت فعلی

این مخزن در فاز اولیه است و حاوی اسکلت اولیه است. هسته در `psylayout-engine/src/design-manager.tsx` قرار دارد و می‌توانی پیاده‌سازی کامل‌تر را همین‌جا توسعه دهی یا هنگام استفاده در پروژه‌ی اصلی آن را جایگزین کنی.

---

## پیش‌نیازها

- Node.js (نسخه‌ی 18+ پیشنهاد می‌شود)
- npm یا pnpm/yarn

نسخه‌های مورد استفاده در این بسته (از `package.json` در `psylayout-engine`):

- next: 16.0.3
- react: 19.2.0
- react-dom: 19.2.0

---

## نصب (در پوشه `psylayout-engine`)

برای نصب وابستگی‌ها:

```powershell
cd psylayout-engine
npm install
```

اسکریپت‌های مفید در `package.json`:

- `dev` — اجرای سرور توسعه Next.js
- `build` — ساخت برنامه برای production
- `start` — اجرای نسخه production
- `lint` — اجرای eslint

برای اجرا در حالت توسعه:

```powershell
cd psylayout-engine
npm run dev
```

---

## نحوه استفاده (ایمپورت و نمونه)

می‌توانی `design-manager` را مستقیماً ایمپورت کنی یا از Provider آن در روت برنامه استفاده کنی. مثال زیر یک الگوی ساده برای قرار دادن Provider در `app/layout.tsx` (Next.js) است:

```tsx
import { DesignManagerProvider } from "./psylayout-engine/src/design-manager";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa">
      <body>
        <DesignManagerProvider
          events={{
            onError: (err) => console.error("[PsyLayout Error]", err),
            onLayoutValidation: ({ sectionId, issues }) => console.log("[PsyLayout Validation]", sectionId, issues),
          }}
        >
          {children}
        </DesignManagerProvider>
      </body>
    </html>
  );
}
```

توجه: مسیر ایمپورت را بر اساس ساختار پروژه‌ی شما تنظیم کن. اگر این پکیج را به‌عنوان یک پکیج npm محلی یا در monorepo منتشر کردی، آدرس ایمپورت ممکن است متفاوت باشد.

---

## ساختار پیشنهادی پوشه‌ها

```
.
├─ psylayout-engine/
│  ├─ src/
│  │  └─ design-manager.tsx   # هسته‌ی موتور
│  ├─ package.json
│  └─ ...
├─ app/                        # مثال یک اپ Next.js که این پکیج را استفاده می‌کند
├─ public/
└─ README.md
```

---

## پیشنهاد برای توسعه و تست

- ابتدا APIهای اصلی (Provider، Container، Section، Locator) را مستندسازی کن.
- تست‌های واحد برای Rules و Validation Engine اضافه کن (jest یا vitest).
- یک صفحه نمونه (`/example` یا `app/examples`) ایجاد کن تا حالات `free/row/column` را نشان دهد.

---

## مشارکت

اگر می‌خواهی مشارکت کنی:

1. فورک کن.
2. شاخه‌ای جدید از `main` بساز (مثلاً `feature/validator`).
3. تغییرات را با توضیح واضح در PR بفرست.

قبل از ارسال PR لطفاً lint و تست‌ها را اجرا کن.

---

## لایسنس

لایسنس در این مخزن مشخص نشده است. اگر این پروژه را منتشر می‌کنی، یک فایل `LICENSE` اضافه کن (مثلاً MIT) و در همین README به آن اشاره کن.

---

اگر بخواهی، می‌توانم همین README را ترجمه یا بسط دهم تا شامل مثال‌های کُد بیشتر، API دقیق توابع/کامپوننت‌ها و یک صفحه دمو شود.

ایمیل/وب‌سایت سازنده (در صورت نیاز به تماس): www.ho-oshyar.ir


2. در پروژه اصلی، مسیر ایمپورت را مطابق معماری خودت تنظیم کن. مثال:

```tsx
import {
  DesignManagerProvider,
  Container,
  Section,
  Locator,
} from "@yourproject/core/psylayout-engine/design-manager";
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

نسخه‌ی کامل PsyLayout Engine که طراحی کردیم، قابلیت‌های زیر را هم شامل می‌شود (می‌توانی در همین ریپو ادامه‌اش بدهی):

- Constraint Engine پیشرفته (center, pin, attachTo, ...)
- Snap Grid هوشمند
- PsyLayout Debugger Panel (DevTools اختصاصی)
- JSON Schema برای Layout و Renderer عمومی
- Editor Mode (drag & drop) برای ساخت صفحه بدون کد

---

## لایسنس

طراحی شده توسط تیم نرم افزاری هوشیار
www.ho-oshyar.ir
