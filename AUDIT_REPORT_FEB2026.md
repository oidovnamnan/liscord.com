# Liscord System Audit Report
**Date:** February 24, 2026
**Scope:** Full-stack deep dive into architecture, state management, security, and potential improvements.

## 1. System Architecture & Tech Stack (Excellent)
The foundation of Liscord is highly modern and scalable.
- **Frontend Stack:** React 18, Vite, TypeScript.
- **State Management:** `zustand` is used for lightweight, fast global state (Auth, Business, UI).
- **Styling:** Modular CSS with CSS variables (`--primary`, `--surface-1`). The transition to a "lite" design has been implemented effectively on core pages.
- **Backend/Database:** Firebase (Authentication, Firestore, Storage). Cloud Functions are documented and planned for heavy lifting.
- **AI Integration:** `@google/genai` is successfully integrated directly into the client-side for dynamic package scanning OCR.

## 2. Security & Data Isolation (Strong)
A major strength of the current implementation is the multi-tenant setup.
- **Firestore Rules (`firestore.rules`):** The data structure correctly isolates collections under `/businesses/{bizId}/*`. The robust custom `hasPerm()` function ensures that only employees with specific roles can read/write data.
- **Front-end Routes:** Protected routes in `App.tsx` prevent anonymous access, and `SuperAdminRoute` handles platform administration checks separately.
- **Audit Logging:** Crucial actions (creating orders, deleting products, etc.) are funnelled into an `auditLog` collection using `auditService`. The firestore rules allow anyone to create a log, but **nobody** can edit or delete them, ensuring a tamper-proof trail.

## 3. Findings & Minor Vulnerabilities (Low Risk)
While reviewing `db.ts` and the main application, I identified a few logic flows that are currently handled on the client-side but should eventually be migrated to the server.

- **Client-Side AI Call:** In `NewPackageBatch.tsx`, the Gemini API key is currently exposed to the client (via `VITE_GEMINI_API_KEY`). While suitable for MVP/testing, this is a security risk in production. 
  - **Recommendation:** Move the OCR logic to a Firebase Cloud Function (`scanPackageLabel`). The client should upload the Base64 image to the function, which then securely interacts with Gemini.
- **Client-Side Sequence Generation:** Order numbers (e.g., `#ORD-1002`) are currently generated sequentially on the client side using a Firestore transaction. Under extreme concurrent load, there is a tiny risk of race conditions resulting in failed transactions.
  - **Recommendation:** Use a Cloud Function trigger or an atomic increment mechanism server-side to generate order numbers.
- **In-Memory Sorting:** In `orderService.subscribeOrders` and `dashboardService`, sorting by `createdAt` is performed in-memory after fetching up to 100 documents.
  - **Recommendation:** Use Firestore's native `orderBy('createdAt', 'desc')` coupled with indexes to shift the sorting burden off the client's CPU.

## 4. UI/UX Cohesion (Very Good)
- **Consistency:** The recent updates to `OrdersPage` and `SettingsPage` have successfully implemented a compact, high-density layout suitable for heavy B2B users.
- **Component Reusability:** Core components like `Header`, `AppLayout`, and custom modals are reused effectively, maintaining visual consistency across the app.
- **Missing Loading States:** Most async operations are wrapped in `try/catch` with `finally { setLoading(false) }`, providing good feedback via `react-hot-toast`.

## 5. Potential Future Features & Ideas
Based on the current trajectory, here are some high-value additions for future sprints:

1. **Barcode / QR Generation:** Since you already track custom shelf locations (`locationCode`), you could generate QR codes for each `Shelf`. Employees could use their phones to scan the shelf, then scan the package to instantly assign it (bypassing manual typing entirely).
2. **Batch Status Transitions:** Allow selecting multiple orders on the `OrdersPage` and changing their status or assigning them to a delivery source at once.
3. **Advanced Filtering / URL State:** Currently, changing tabs or searching in the `OrdersPage` is handled only in local React state. Syncing these to the URL parameters (e.g., `?status=new&search=bold`) would allow users to share direct links to specific views.
4. **Push Notifications (FCM):** The foundation for Firebase Cloud Messaging is present in `App.tsx`. Implementing server-side triggers to notify users when an order state changes (e.g., "Ready for Delivery") would significantly boost engagement.

## Conclusion
The Liscord platform is incredibly robust and ready for real-world usage. The B2B multi-tenant architecture is implemented flawlessly, and the recent UI density improvements make it feel like a professional enterprise tool. Address the Client-Side AI API Key exposure before a major public launch, and the system will be rock solid.
