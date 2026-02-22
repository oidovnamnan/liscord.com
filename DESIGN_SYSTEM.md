# 🎨 LISCORD — ДИЗАЙН СИСТЕМ & ӨНГӨНИЙ ПАЛИТР

> **Зарчим:** Цайвар, гоёмсог, тод RGB өнгүүд. Харанхуй дэвсгэр дээр
> неон маягийн гэрэлтдэг өнгүүд. Premium, орчин үеийн, мэргэжлийн.

---

## 1. 🌈 ҮНДСЭН ӨНГӨНИЙ ПАЛИТР

### 1.1 Brand Colors (Брэндийн өнгө)

```css
:root {
  /* ═══ 🔵 PRIMARY — Цэнхэр (Brand Color) ═══ */
  --primary-50:  #E8F4FD;
  --primary-100: #B9DFFB;
  --primary-200: #8ACAF9;
  --primary-300: #5BB5F7;
  --primary-400: #2CA0F5;
  --primary-500: #0D8BF0;    /* ← ҮНДСЭН BRAND ӨНГӨ */
  --primary-600: #0A6FBF;
  --primary-700: #07538F;
  --primary-800: #053860;
  --primary-900: #021C30;

  /* ═══ 🟣 SECONDARY — Ягаан нил (Accent) ═══ */
  --secondary-50:  #F3E8FF;
  --secondary-100: #DBC5FF;
  --secondary-200: #C3A2FF;
  --secondary-300: #AB7FFF;
  --secondary-400: #935CFF;
  --secondary-500: #7B39FF;    /* ← ACCENT ӨНГӨ */
  --secondary-600: #622ECC;
  --secondary-700: #4A2299;
  --secondary-800: #311766;
  --secondary-900: #190B33;
}
```

### 1.2 Vibrant RGB Colors (Тод өнгүүд)

```css
:root {
  /* ═══ 🔴 RED — Улаан ═══ */
  --red-50:  #FFF0F0;
  --red-100: #FFD6D6;
  --red-200: #FFadad;
  --red-300: #FF8585;
  --red-400: #FF5C5C;
  --red-500: #FF3333;          /* ← Тод улаан */
  --red-600: #E60000;
  --red-700: #B30000;
  --red-800: #800000;
  --red-900: #4D0000;

  /* ═══ 🟢 GREEN — Ногоон ═══ */
  --green-50:  #EAFFF0;
  --green-100: #C5FFD6;
  --green-200: #85FFAB;
  --green-300: #52FF8A;
  --green-400: #29FF6E;
  --green-500: #00E650;        /* ← Тод ногоон */
  --green-600: #00B33E;
  --green-700: #00802D;
  --green-800: #004D1B;
  --green-900: #00260D;

  /* ═══ 🔵 BLUE — Хөх цэнхэр ═══ */
  --blue-50:  #EBF3FF;
  --blue-100: #CCE0FF;
  --blue-200: #99C2FF;
  --blue-300: #66A3FF;
  --blue-400: #3385FF;
  --blue-500: #0066FF;         /* ← Тод цэнхэр */
  --blue-600: #0052CC;
  --blue-700: #003D99;
  --blue-800: #002966;
  --blue-900: #001433;

  /* ═══ 🟡 YELLOW — Шар ═══ */
  --yellow-50:  #FFFCE8;
  --yellow-100: #FFF7C2;
  --yellow-200: #FFF08A;
  --yellow-300: #FFE852;
  --yellow-400: #FFE11F;
  --yellow-500: #FFD600;       /* ← Тод шар */
  --yellow-600: #CCB000;
  --yellow-700: #998400;
  --yellow-800: #665800;
  --yellow-900: #332C00;

  /* ═══ 🟠 ORANGE — Улбар шар ═══ */
  --orange-50:  #FFF3E8;
  --orange-100: #FFDDB8;
  --orange-200: #FFC285;
  --orange-300: #FFA652;
  --orange-400: #FF8B1F;
  --orange-500: #FF7700;       /* ← Тод улбар шар */
  --orange-600: #CC5F00;
  --orange-700: #994700;
  --orange-800: #663000;
  --orange-900: #331800;

  /* ═══ 🩷 PINK — Ягаан ═══ */
  --pink-50:  #FFF0F7;
  --pink-100: #FFD6EA;
  --pink-200: #FFADDA;
  --pink-300: #FF85CA;
  --pink-400: #FF5CBA;
  --pink-500: #FF33AA;        /* ← Тод ягаан */
  --pink-600: #CC0085;
  --pink-700: #990064;
  --pink-800: #660042;
  --pink-900: #330021;

  /* ═══ 🩵 CYAN — Цэнхэр ногоон ═══ */
  --cyan-50:  #E8FFFE;
  --cyan-100: #B8FFFC;
  --cyan-200: #85FFF9;
  --cyan-300: #52FFF7;
  --cyan-400: #1FFFF4;
  --cyan-500: #00E6DD;        /* ← Тод циан */
  --cyan-600: #00B3AB;
  --cyan-700: #008079;
  --cyan-800: #004D48;
  --cyan-900: #002624;

  /* ═══ 💜 PURPLE — Нил ягаан ═══ */
  --purple-50:  #F5EAFF;
  --purple-100: #E0C5FF;
  --purple-200: #C78FFF;
  --purple-300: #AD5AFF;
  --purple-400: #9424FF;
  --purple-500: #7B00EE;      /* ← Тод нил */
  --purple-600: #6200BE;
  --purple-700: #49008F;
  --purple-800: #31005F;
  --purple-900: #180030;
}
```

### 1.3 Дэвсгэр & Нейтрал

```css
:root {
  /* ═══ DARK THEME (Үндсэн) ═══ */
  --bg-primary:    #0A0E17;    /* Хамгийн гүн дэвсгэр */
  --bg-secondary:  #111827;    /* Карт, sidebar */
  --bg-tertiary:   #1A2235;    /* Input, hover */
  --bg-elevated:   #1F2A40;    /* Modal, dropdown */
  --bg-hover:      #253350;    /* Hover state */

  --border-default: #2A3550;   /* Ердийн хүрээ */
  --border-light:   #1E293B;   /* Бүдэг хүрээ */
  --border-focus:   #0D8BF0;   /* Focus хүрээ (primary) */

  --text-primary:   #F8FAFC;   /* Үндсэн текст — цагаан */
  --text-secondary: #94A3B8;   /* Туслах текст — саарал */
  --text-muted:     #64748B;   /* Бүдэг текст */
  --text-disabled:  #475569;   /* Идэвхгүй текст */

  /* ═══ LIGHT THEME ═══ */
  --light-bg-primary:    #FFFFFF;
  --light-bg-secondary:  #F8FAFC;
  --light-bg-tertiary:   #F1F5F9;
  --light-bg-elevated:   #FFFFFF;
  --light-bg-hover:      #E2E8F0;

  --light-border-default: #E2E8F0;
  --light-text-primary:   #0F172A;
  --light-text-secondary: #475569;
  --light-text-muted:     #94A3B8;
}
```

---

## 2. 🎯 SEMANTIC COLORS (Утга бүхий өнгө)

```css
:root {
  /* Статус */
  --success:     #00E650;     /* ✅ Амжилттай — тод ногоон */
  --warning:     #FFD600;     /* ⚠️ Анхааруулга — тод шар */
  --error:       #FF3333;     /* ❌ Алдаа — тод улаан */
  --info:        #0D8BF0;     /* ℹ️ Мэдээлэл — primary цэнхэр */

  /* Статус — Background (бүдэг) */
  --success-bg:  rgba(0, 230, 80, 0.12);
  --warning-bg:  rgba(255, 214, 0, 0.12);
  --error-bg:    rgba(255, 51, 51, 0.12);
  --info-bg:     rgba(13, 139, 240, 0.12);

  /* Захиалгын статус (тод RGB) */
  --status-new:        #3385FF;   /* 🔵 Шинэ — цэнхэр */
  --status-confirmed:  #00E650;   /* 🟢 Баталсан — ногоон */
  --status-preparing:  #FFD600;   /* 🟡 Бэлтгэж буй — шар */
  --status-ready:      #00E6DD;   /* 🩵 Бэлэн — циан */
  --status-delivering: #FF7700;   /* 🟠 Хүргэж буй — улбар шар */
  --status-delivered:  #7B39FF;   /* 🟣 Хүргэгдсэн — нил */
  --status-completed:  #00B33E;   /* ✅ Дууссан — гүн ногоон */
  --status-cancelled:  #FF3333;   /* 🔴 Цуцалсан — улаан */

  /* Төлбөрийн статус */
  --payment-unpaid:    #FF3333;   /* Төлөөгүй — улаан */
  --payment-partial:   #FFD600;   /* Хэсэгчлэн — шар */
  --payment-paid:      #00E650;   /* Төлсөн — ногоон */

  /* Ач холбогдол */
  --priority-low:      #94A3B8;   /* Бага — саарал */
  --priority-medium:   #0066FF;   /* Дунд — цэнхэр */
  --priority-high:     #FF7700;   /* Өндөр — улбар шар */
  --priority-urgent:   #FF3333;   /* Яаралтай — улаан */

  /* Онлайн статус */
  --online:      #00E650;         /* 🟢 Онлайн */
  --away:        #FFD600;         /* 🟡 Away */
  --offline:     #64748B;         /* ⚫ Офлайн */
}
```

---

## 3. ✨ GRADIENT & GLOW EFFECTS

```css
:root {
  /* ═══ GRADIENT ═══ */
  --gradient-primary:    linear-gradient(135deg, #0D8BF0, #7B39FF);
  --gradient-success:    linear-gradient(135deg, #00E650, #00E6DD);
  --gradient-danger:     linear-gradient(135deg, #FF3333, #FF33AA);
  --gradient-warm:       linear-gradient(135deg, #FF7700, #FFD600);
  --gradient-cool:       linear-gradient(135deg, #0066FF, #00E6DD);
  --gradient-purple:     linear-gradient(135deg, #7B39FF, #FF33AA);
  --gradient-rainbow:    linear-gradient(135deg, #FF3333, #FF7700, #FFD600, #00E650, #0066FF, #7B39FF);

  /* KPI Card маягийн тод gradient */
  --gradient-card-blue:    linear-gradient(135deg, #0A6FBF 0%, #0D8BF0 50%, #3385FF 100%);
  --gradient-card-green:   linear-gradient(135deg, #00802D 0%, #00E650 50%, #52FF8A 100%);
  --gradient-card-purple:  linear-gradient(135deg, #4A2299 0%, #7B39FF 50%, #AB7FFF 100%);
  --gradient-card-orange:  linear-gradient(135deg, #994700 0%, #FF7700 50%, #FFA652 100%);

  /* ═══ GLOW / SHADOW ═══ */
  --glow-primary:    0 0 20px rgba(13, 139, 240, 0.3);
  --glow-success:    0 0 20px rgba(0, 230, 80, 0.3);
  --glow-danger:     0 0 20px rgba(255, 51, 51, 0.3);
  --glow-purple:     0 0 20px rgba(123, 57, 255, 0.3);
  --glow-cyan:       0 0 20px rgba(0, 230, 221, 0.3);

  /* Card shadow */
  --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md:   0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg:   0 8px 30px rgba(0, 0, 0, 0.3);
  --shadow-xl:   0 12px 50px rgba(0, 0, 0, 0.4);

  /* Glassmorphism */
  --glass-bg:    rgba(17, 24, 39, 0.7);
  --glass-blur:  blur(12px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);
}
```

---

## 4. 📐 TYPOGRAPHY

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --font-family:     'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  --font-size-xs:    0.75rem;    /* 12px */
  --font-size-sm:    0.875rem;   /* 14px */
  --font-size-base:  1rem;       /* 16px */
  --font-size-lg:    1.125rem;   /* 18px */
  --font-size-xl:    1.25rem;    /* 20px */
  --font-size-2xl:   1.5rem;     /* 24px */
  --font-size-3xl:   1.875rem;   /* 30px */
  --font-size-4xl:   2.25rem;    /* 36px */

  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;
  --font-weight-extrabold: 800;

  --line-height-tight:    1.25;
  --line-height-normal:   1.5;
  --line-height-relaxed:  1.75;

  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide:   0.025em;
}
```

---

## 5. 📏 SPACING & BORDER RADIUS

```css
:root {
  /* Spacing */
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* Border Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-2xl:  28px;
  --radius-full: 9999px;

  /* Transition */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   350ms ease;
}
```

---

## 6. 🧩 КОМПОНЕНТ СТИЛИЙН ЗАГВАР

### 6.1 Button

```css
/* Primary Button — Gradient + Glow */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-primary), var(--shadow-lg);
}

/* Success Button */
.btn-success {
  background: var(--gradient-success);
  box-shadow: var(--shadow-md);
}
.btn-success:hover {
  box-shadow: var(--glow-success), var(--shadow-lg);
}

/* Danger Button */
.btn-danger {
  background: var(--gradient-danger);
}
.btn-danger:hover {
  box-shadow: var(--glow-danger), var(--shadow-lg);
}
```

### 6.2 Card

```css
.card {
  background: var(--bg-secondary);
  border: var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}
.card:hover {
  border-color: rgba(13, 139, 240, 0.2);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* KPI Card — Gradient дэвсгэр */
.kpi-card {
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  color: white;
  position: relative;
  overflow: hidden;
}
.kpi-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
}
.kpi-card.blue   { background: var(--gradient-card-blue); }
.kpi-card.green  { background: var(--gradient-card-green); }
.kpi-card.purple { background: var(--gradient-card-purple); }
.kpi-card.orange { background: var(--gradient-card-orange); }
```

### 6.3 Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* Гэрэлтдэг цэг */
}

.badge-new        { background: rgba(51,133,255,0.15); color: #3385FF; }
.badge-new::before { background: #3385FF; box-shadow: 0 0 6px #3385FF; }

.badge-confirmed  { background: rgba(0,230,80,0.15); color: #00E650; }
.badge-confirmed::before { background: #00E650; box-shadow: 0 0 6px #00E650; }

.badge-preparing  { background: rgba(255,214,0,0.15); color: #FFD600; }
.badge-delivering { background: rgba(255,119,0,0.15); color: #FF7700; }
.badge-cancelled  { background: rgba(255,51,51,0.15); color: #FF3333; }
```

### 6.4 Input

```css
.input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}
.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(13, 139, 240, 0.15);
  outline: none;
}
.input::placeholder {
  color: var(--text-muted);
}
```

### 6.5 Sidebar

```css
.sidebar {
  background: var(--bg-secondary);
  border-right: var(--glass-border);
  width: 260px;
}
.sidebar-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.sidebar-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.sidebar-item.active {
  background: rgba(13, 139, 240, 0.12);
  color: var(--primary-400);
  border-left: 3px solid var(--primary-500);
}
```

---

## 7. 🌊 ANIMATIONS

```css
/* Micro-animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(13, 139, 240, 0.3); }
  50% { box-shadow: 0 0 20px rgba(13, 139, 240, 0.6); }
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Хэрэглээ */
.card        { animation: fadeIn 0.3s ease; }
.modal       { animation: scaleIn 0.2s ease; }
.page        { animation: slideUp 0.4s ease; }
.loading-bar { animation: shimmer 1.5s infinite; }
.online-dot  { animation: pulse-glow 2s infinite; }
.badge-new::before { animation: dot-pulse 2s infinite; }
```

---

## 8. 📱 RESPONSIVE BREAKPOINTS

```css
:root {
  --mobile:  480px;
  --tablet:  768px;
  --desktop: 1024px;
  --wide:    1280px;
}

/* Mobile first */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Wide */ }
```

---

*Энэ дизайн систем бүх компонентод нэгдсэн, гоёмсог, тод RGB өнгөтэй харагдацыг хангана.*
