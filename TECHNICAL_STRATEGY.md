# ⚙️ LISCORD — ТЕХНИКИЙН СТРАТЕГИ (PWA, Search, Performance, Session, Media, CI/CD, Test, Monitoring)

---

## 1. 📱 PWA / ОФЛАЙН СТРАТЕГИ

### 1.1 Service Worker стратеги
| Ресурс | Cache стратеги | Тайлбар |
|--------|---------------|---------|
| App shell (HTML, CSS, JS) | **Cache First** | Хурдан ачаалал |
| API responses (Firestore) | **Network First** | Шинэ мэдээлэл авах, офлайн бол cache |
| Зургууд | **Stale While Revalidate** | Cache-аас шууд, background-д шинэчлэх |
| Fonts, icons | **Cache First** | Өөрчлөгдөхгүй |

### 1.2 Офлайн боломжууд
| Функц | Офлайн | Тайлбар |
|-------|--------|---------|
| Апп нээх, navigate | ✅ | App shell cached |
| Захиалга жагсаалт харах | ✅ | Firestore offline persistence |
| Захиалга үүсгэх | ✅ | Queue-д хадгалаад online болоход sync |
| Захиалга засах | ✅ | Queue sync |
| Захиалга устгах | ❌ | Аюулгүй байдлын шалтгаанаар online заавал |
| Бараа харах | ✅ | Cached |
| Харилцагч харах | ✅ | Cached |
| Зураг upload | ❌ | Online заавал |
| Push мэдэгдэл хүлээн авах | ❌ | Online заавал |
| Чат мессеж бичих | ✅ | Queue sync |

### 1.3 Background Sync
```javascript
// Офлайн үед үүсгэсэн захиалга → IndexedDB queue-д хадгалагддаг
// Online болоход → Service Worker background sync trigger
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});
```

### 1.4 Conflict Resolution
```
Хэрэв 2 хүн зэрэг offline засвал:
1. Last Write Wins (default) — Сүүлд sync хийсэн хүний өөрчлөлт хадгалагдана
2. Conflict alert — Зөрчил илэрвэл хэрэглэгчид мэдэгдэл
3. Field-level merge — Өөр талбар засвал merge хийнэ
```

### 1.5 Install Prompt
```javascript
// "Апп суулгах" тоглуулга — PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner(); // "📱 Апп суулгах" banner харуулах
});
```

---

## 2. 🔍 ХАЙЛТЫН СТРАТЕГИ

### Phase 1 (MVP): Firestore prefix + client filter
```javascript
// Утасны дугаараар хайх
query(collection, where('phone', '>=', search), where('phone', '<=', search + '\uf8ff'));

// Client-side filter (жижиг бизнест OK)
const results = allOrders.filter(o => 
  o.orderNumber.includes(search) ||
  o.customer.name.includes(search) ||
  o.customer.phone.includes(search)
);
```

### Phase 2: Triggered Search Index
```javascript
// Cloud Function: Захиалга бүрд searchTokens үүсгэх
onOrderCreate → {
  searchTokens: generateTokens(order.customer.name, order.orderNumber, order.customer.phone)
}
// Хайлт: where('searchTokens', 'array-contains', searchTerm)
```

### Phase 3 (Ирээдүйд): Algolia/Typesense
```javascript
// Бүрэн full-text search, fuzzy matching, ranking
// Cloud Function: Firestore → Algolia sync
// Client: Algolia SDK → instant search
```

---

## 3. ⚡ PERFORMANCE

### 3.1 Bundle оптимизаци
```javascript
// Vite code splitting — route бүрт lazy load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const Chat = lazy(() => import('./pages/Chat'));
const HR = lazy(() => import('./pages/HR'));
```

### 3.2 Firestore listener оптимизаци
- Max 10 active listener (нэг хуудсанд)
- Хуудаснаас гарахад unsubscribe
- Pagination: `limit(20)` + `startAfter(lastDoc)`

### 3.3 Virtualized List
```javascript
// 1000+ мөрт react-virtual ашиглах
import { useVirtualizer } from '@tanstack/react-virtual';
// Зөвхөн харагдаж буй мөрүүдийг render
```

### 3.4 Зорилтууд
| Metric | Зорилт |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | 90+ |
| Bundle size (initial) | < 200KB gzip |

---

## 4. 🔑 SESSION УДИРДЛАГА

### 4.1 Token refresh
```javascript
// Firebase Auth → автомат token refresh (1 цаг тутам)
// Custom claims: { businessId, role, positionId }
// Claims шинэчлэхэд → force refresh: getIdToken(true)
```

### 4.2 Session timeout
```javascript
// 30 минут idle → auto logout warning (5 минут countdown)
// 35 минут → auto logout
let idleTimer;
const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(showLogoutWarning, 30 * 60 * 1000);
};
['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
  document.addEventListener(event, resetIdleTimer);
});
```

### 4.3 Multi-device
```javascript
// users/{userId}/sessions/{sessionId}
{
  device: "iPhone 15",
  browser: "Safari",
  ip: "203.0.113.1",
  lastActive: Timestamp,
  fcmToken: "...",
}
// Эзэн: "Бүх төхөөрөмжөөс гарах" → бүх session устгах
// Ажилтан хасахад → тухайн хүний бүх session устгах
```

---

## 5. 📸 ЗУРАГ / ФАЙЛ УДИРДЛАГА

### 5.1 Upload pipeline
```
Хэрэглэгч зураг сонгох
  → Client-side resize (max 1920px)
  → Client-side compress (quality: 0.8)
  → Firebase Storage upload
  → Cloud Function trigger:
    → Thumbnail үүсгэх (200x200, 400x400)
    → WebP хөрвүүлэх
    → NSFW шалгах (Cloud Vision API — optional)
    → Firestore reference шинэчлэх
```

### 5.2 Хязгаарлалтууд
| Багц | Нийт Storage | Зураг нэг бүр | Файл нэг бүр |
|------|-------------|---------------|--------------|
| Free | 500 MB | 5 MB | 10 MB |
| Pro | 5 GB | 10 MB | 25 MB |
| Business | 50 GB | 20 MB | 50 MB |

### 5.3 Lazy loading
```javascript
// Intersection Observer — scroll хийхэд ачаалах
<img loading="lazy" src={thumbnailUrl} data-src={fullUrl} />
```

---

## 6. 🧪 ТЕСТИЙН СТРАТЕГИ

### 6.1 Test stack
| Төрөл | Tool | Хамрах хүрээ |
|--------|------|-------------|
| Unit | Vitest | Utils, hooks, stores |
| Component | React Testing Library | UI компонент |
| Integration | Firebase Emulator + Vitest | Firestore, Auth |
| E2E | Playwright | Гол flow-ууд |

### 6.2 Гол E2E flow-ууд
1. Бүртгүүлэх → Бизнес үүсгэх → Dashboard
2. Захиалга үүсгэх → Статус солих → Төлбөр бүртгэх
3. Бараа нэмэх → Захиалгад бараа нэмэх
4. Ажилтан урих → Зөвшөөрөх → Нэвтрэх
5. Тайлан татах

### 6.3 Coverage зорилт
| Зүйл | Зорилт |
|-------|--------|
| Utils/helpers | 90%+ |
| Hooks | 80%+ |
| Components | 70%+ |
| E2E flows | Бүх гол flow |

---

## 7. 🚀 CI/CD PIPELINE

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node
      - npm ci
      - npm run lint
      - npm run typecheck
      - npm run test
      - npm run test:e2e (PR-д)
  
  preview:                          # PR → Preview URL
    if: github.event_name == 'pull_request'
    needs: lint-test
    steps:
      - firebase hosting:channel:deploy pr-${{ github.event.number }}
  
  deploy-staging:                   # develop branch → staging
    if: github.ref == 'refs/heads/develop'
    needs: lint-test
    steps:
      - npm run build
      - firebase deploy --only hosting -P staging
      - firebase deploy --only firestore:rules -P staging
      - firebase deploy --only functions -P staging
  
  deploy-production:                # main branch tag → production
    if: startsWith(github.ref, 'refs/tags/v')
    needs: lint-test
    steps:
      - npm run build
      - firebase deploy -P production
```

### Environment-ууд
| Env | Firebase Project | URL | Branch |
|-----|-----------------|-----|--------|
| Dev | liscord-dev | localhost:5173 | feature/* |
| Staging | liscord-staging | staging.liscord.com | develop |
| Prod | liscord-prod | liscord.com | main (tag) |

---

## 8. 📈 MONITORING & ERROR TRACKING

### 8.1 Error Tracking — Sentry
```javascript
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
// → Алдаа бүр Sentry-д бүртгэгднэ
// → Slack alert тохируулах
```

### 8.2 Firebase Performance
```javascript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
// → Хуудас ачаалалт, network request хугацаа автомат хянагдана
```

### 8.3 Firestore Usage Monitoring
```
Cloud Function: Өдөр бүрийн зардлын тооцоо
→ Read/Write/Delete тоо хянах
→ Threshold хэтэрвэл → Slack/Email alert
→ Зорилт: < $0.10/бизнес/сар
```

### 8.4 Uptime Monitoring
- UptimeRobot / BetterUptime → liscord.com, API endpoint
- 99.9% uptime зорилт
- Downtime → Slack + Email alert

---

## 9. 🔐 FIRESTORE SECURITY RULES (ТОВЧЛОЛ)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() { return request.auth != null; }
    function isMember(bizId) {
      return exists(/databases/$(database)/documents/businesses/$(bizId)/employees/$(request.auth.uid));
    }
    function isOwner(bizId) {
      return get(/databases/$(database)/documents/businesses/$(bizId)).data.ownerId == request.auth.uid;
    }
    function hasPermission(bizId, perm) {
      let emp = get(/databases/$(database)/documents/businesses/$(bizId)/employees/$(request.auth.uid));
      let pos = get(/databases/$(database)/documents/businesses/$(bizId)/positions/$(emp.data.positionId));
      return isOwner(bizId) || perm in pos.data.permissions;
    }
    
    // Users
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // Businesses
    match /businesses/{bizId} {
      allow read: if isMember(bizId);
      allow update: if hasPermission(bizId, 'settings.edit_business');
      allow delete: if isOwner(bizId);
      
      // Orders
      match /orders/{orderId} {
        allow read: if hasPermission(bizId, 'orders.view_all') || 
                       (hasPermission(bizId, 'orders.view_own') && resource.data.createdBy == request.auth.uid);
        allow create: if hasPermission(bizId, 'orders.create');
        allow update: if hasPermission(bizId, 'orders.edit_all') ||
                        (hasPermission(bizId, 'orders.edit_own') && resource.data.createdBy == request.auth.uid);
        allow delete: if hasPermission(bizId, 'orders.delete');
      }
      
      // Customers, Products, Transactions, Employees — адил зарчмаар
      match /{subcollection}/{docId} {
        allow read: if isMember(bizId);
        allow write: if isMember(bizId); // Нарийн эрх collection бүрт
      }
    }
  }
}
```

---

*PWA, Search, Performance, Session, Media, Test, CI/CD, Monitoring, Security Rules — бүгд нэг дор.*
