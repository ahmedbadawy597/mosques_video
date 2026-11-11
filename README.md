# المنصة الرقمية للتصوير الجوى والرفع المساحى للمساجد

تطبيق React + TypeScript احترافي (RTL) لوزارة الأوقاف المصرية لعرض وتشغيل فيديوهات التصوير الجوي المستخرجة من ArcGIS StoryMaps.

## التشغيل

```bash
npm install
npm run dev
```

يفتح على `http://localhost:5174`.

## الأوامر

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تطوير محلي |
| `npm run build` | بناء إنتاج |
| `npm run preview` | معاينة البناء |
| `npm run typecheck` | فحص TypeScript |
| `npm run lint` | oxlint |
| `npm run test` | Vitest |
| `npm run extract` | تحديث `public/videos.json` من StoryMaps |

## تحديث بيانات StoryMaps

```bash
npm run extract
```

القصص الحالية عامة. إن أصبحت خاصة:

```bash
STORY_TOKEN=YOUR_PORTAL_TOKEN npm run extract
```

## البنية

```
src/
  app/           # App, router, providers
  components/    # layout, media, ui, common
  features/      # videos + reports (domain modules)
  pages/         # route pages (lazy)
  services via features/*/services
  styles/        # design tokens + global
public/
  videos.json    # catalog
  logo.jpg       # شعار الوزارة
scripts/
  extract-storymaps.js
legacy/          # النسخة القديمة HTML (مرجع)
```

## تقرير تقني موجز

### التقييم الأصلي
- تطبيق ملف واحد (~1000 سطر) بدون أنواع أو فصل مسؤوليات.
- تحميل كل عناصر `<video>` فوراً.
- منطق الفلاتر/الإحصاءات/التخزين مدمج في الـ DOM.

### المعمارية الجديدة
- Vite + React 19 + TypeScript الصارم + React Router.
- Providers للحالة المشتركة (theme / videos) بدون مكتبة state ثقيلة.
- Lazy routes + IntersectionObserver لتفعيل مشغّل الفيديو عند الظهور.
- تحقق من بيانات JSON وروابط خارجية آمنة (`http/https/blob` فقط).

### ما تم الحفاظ عليه
- كتالوج StoryMaps الحقيقي، الفلاتر، الإضافة المحلية، التقارير، CSV، الطباعة، الوضع الليلي، الثيم الأخضر/الذهبي، الشعار، RTL العربي.

### الاختبارات المنفذة فعلياً
- `npm run typecheck` — نجح
- `npm run test` — 4/4 نجح
- `npm run lint` — نجح (تحذيرات style فقط)
- `npm run build` — نجح (`dist/`)

### ديون تقنية متبقية
- الفيديوهات المحلية المرفوعة بـ `blob:` لا تبقى بعد إعادة التحميل (مقصود؛ يمكن لاحقاً IndexedDB).
- لا يوجد CI pipeline بعد.
