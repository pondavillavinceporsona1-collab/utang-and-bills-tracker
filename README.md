# Utang & Bills Tracker (Android APK + Supabase Hybrid Sync)

A fast, zero-distraction personal loan (*utang*) and monthly utility bills tracker designed with a high-contrast Neo-Brutalist UI. Built with **React Native (Expo)**, **Offline-First Local Storage**, and **Supabase PostgreSQL Cloud Sync**.

## Project Structure

- `App.tsx` — Root application shell & zero-latency 12-screen router
- `src/types/index.ts` — Shared TypeScript interfaces (`Loan`, `Bill`, `PaymentHistoryEntry`, `UserProfile`, `AppContextType`)
- `src/theme/colors.ts` — Wireframe color palette & Neo-Brutalist border metrics
- `src/config/supabase.ts` — Supabase client connected to project `pxikqeaxhvyekhbvtobp`
- `src/db/localDb.ts` — Offline-first persistence & pre-seeded wireframe data (`maria`, `ATE ANA`, `KHORPIL`, `SKYRO`, `SHOPEE`, `VINCE`, and the 4 utility bills)
- `src/services/notificationService.ts` — Offline-capable local Android push reminders ("Personal Touch" NBER research enhancement)
- `src/context/AppContext.tsx` — Central state, Android hardware `BackHandler`, and hybrid offline/online Supabase sync
- `src/components/` — Reusable Neo-Brutalist UI Kit (`NeoButton`, `TopBar`, `DonutChart`, `WeeklyPillSelector`, `MonthlyGridSelector`, `ConfirmDeleteModal`)
- `src/screens/` — All 12 wireframe & v2.0 screens (`LoginScreen`, `RegisterScreen`, `HomeScreen`, `SettingsScreen`, `HistoryScreen`, `LoanListScreen`, `ViewLoanDueScreen`, `ViewLoanNoDueScreen`, `AddEditLoanScreen`, `DashboardScreen`, `BillsScreen`, `FullLoanDetailsScreen`)
- `supabase/migrations/20261107_init_utang_tracker.sql` — Supabase PostgreSQL schema with Row-Level Security (RLS) and foreign-key indexes

## Running & Building the Android `.APK`

### 1. Run Locally (Development / Expo Go / Web Preview)
```bash
npm start
```

### 2. Generate the Standalone Downloadable Android `.APK`
To prebuild native Android files and assemble a standalone installable `.apk` using your local Android SDK (`C:\Android\Sdk`):
```bash
npx expo prebuild --platform android
cd android
.\gradlew.bat assembleRelease
```
The installable APK will be output to:
`android/app/build/outputs/apk/release/app-release.apk` (or `debug/app-debug.apk` via `.\gradlew.bat assembleDebug`).
