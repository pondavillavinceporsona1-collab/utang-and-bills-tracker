# Utang & Bills Tracker — `ver. 0.1` (Beta)

A distraction-free, minimalist **Utang (Loan) & Monthly Bills Tracker** for Android and Web, built with **React Native (Expo)**, **Hybrid Offline-First Storage (`AsyncStorage`)**, and **Supabase Cloud Sync & Google OAuth**.

---

## Download Android APK (`ver. 0.1 Beta`)

- **Latest Release Page:** [GitHub Releases (`v0.1`)](https://github.com/pondavillavinceporsona1-collab/utang-and-bills-tracker/releases/tag/v0.1)
- **Direct APK File:** [`Utang-and-Bills-Tracker-v0.1.apk`](https://github.com/pondavillavinceporsona1-collab/utang-and-bills-tracker/releases/download/v0.1/Utang-and-Bills-Tracker-v0.1.apk)

---

## Key Features in `ver. 0.1` (Beta)

1. **Distraction-Free 3-Part Architecture (`Header`, `Body`, `Footer`)**
   - Tactile 3D Neo-Brutalist buttons ([`NeoButton.tsx`](./src/components/NeoButton.tsx)) with spring-depression physics.
   - Custom geometric SVG icons ([`VectorIcons.tsx`](./src/components/VectorIcons.tsx)) — zero system emojis.

2. **Full-Scale `UTANG` Screen ([`LoanListScreen.tsx`](./src/screens/LoanListScreen.tsx))**
   - Interactive **Category Dropdown (`[DEADLINES]`)** supporting 5 view modes:
     - **`DEADLINES`**: Monthly deadlines + open-ended (`no due date` / `----`) loans at the bottom.
     - **`ALL UTANG`**: Every active unpaid utang across all months.
     - **`DUE DATES`**: Strictly utangs with scheduled due dates in the selected month.
     - **`NO DUE DATE`**: Strictly open-ended utangs without a due date.
     - **`TERMS`**: Filter utangs by payment term (`MONTHLY`, `WEEKLY`, `ONE-TIME`).
   - Context-aware left filter button (**`[AUGUST]`**, **`[ALL DATES]`**, **`[UNDATED]`**, **`[ALL TERMS]`**) with spring-press animation and animated sort circle `(↓)`.

3. **Notes on Every Action**
   - Attach notes when creating or editing a loan ([`AddEditLoanScreen.tsx`](./src/screens/AddEditLoanScreen.tsx)).
   - Attach payment notes when settling due dates ([`ViewLoanDueScreen.tsx`](./src/screens/ViewLoanDueScreen.tsx)) or making full/partial payments ([`ViewLoanNoDueScreen.tsx`](./src/screens/ViewLoanNoDueScreen.tsx)).
   - Attach notes when creating, editing, or paying monthly bills ([`BillsScreen.tsx`](./src/screens/BillsScreen.tsx)).

4. **Remaining Balance & Reversible `paid` Actions**
   - Live **`REMAINING BALANCE`** displayed on all loan payment screens and inside **Full Loan Details** ([`FullLoanDetailsScreen.tsx`](./src/screens/FullLoanDetailsScreen.tsx)).
   - Click any `paid` due date, `paid` bill, or payment history item in **Full Loan Details** / **History** ([`HistoryScreen.tsx`](./src/screens/HistoryScreen.tsx)) to reverse/unmark it as paid with a confirmation modal.

5. **Supabase Google OAuth & Hybrid Cloud Sync**
   - Supports **Google OAuth** (`utangtracker://auth/callback` on Android APK and Web origin redirect), **Email/Password Auth**, and **100% Offline Local Mode**.
   - Syncs profile and app state (`loans`, `bills`, `payment_history`) with Supabase PostgreSQL (`pxikqeaxhvyekhbvtobp`).
