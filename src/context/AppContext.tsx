import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { BackHandler, Linking, Platform } from 'react-native';
import {
  AppContextType,
  UserProfile,
  Loan,
  LoanDueDate,
  Bill,
  PaymentHistoryEntry,
  NavigationState,
  ScreenName,
  AddLoanPayload,
  WeekdayPill,
  BillIconType,
} from '../types';
import {
  loadInitialDataFromStorage,
  saveUserToStorage,
  saveLoansToStorage,
  saveBillsToStorage,
  saveHistoryToStorage,
  saveLastSyncToStorage,
  getDemoSeedData,
} from '../db/localDb';
import { supabase } from '../config/supabase';
import { scheduleLoanReminder } from '../services/notificationService';

const AppContext = createContext<AppContextType | undefined>(undefined);

const WEEKDAY_INDEX: Record<WeekdayPill, number> = {
  sun: 0,
  mon: 1,
  tues: 2,
  wed: 3,
  thur: 4,
  fri: 5,
  sat: 6,
};

function generateDueDatesForLoan(
  loanId: string,
  payload: AddLoanPayload,
  installmentAmount: number
): LoanDueDate[] {
  if (!payload.has_due_date) {
    return [];
  }

  if (payload.term_type === 'NONE') {
    if (!payload.due_date) return [];
    return [
      {
        id: `${loanId}-due-1`,
        loan_id: loanId,
        due_date: payload.due_date,
        due_amount: installmentAmount,
        installment_number: 1,
        status: 'UNPAID',
      },
    ];
  }

  const count = Math.max(1, Math.min(60, payload.installment_count || 1));
  const startYear = payload.start_year ?? 2026;
  const startMonth0 = payload.start_month ?? 7; // Default August (index 7)

  if (payload.term_type === 'MONTHLY') {
    const dayOfMonth = payload.monthly_day || 11;
    const list: LoanDueDate[] = [];
    for (let i = 0; i < count; i++) {
      const totalMonths = startMonth0 + i;
      const y = startYear + Math.floor(totalMonths / 12);
      const m0 = totalMonths % 12;
      const maxDay = new Date(y, m0 + 1, 0).getDate();
      const clampedDay = Math.min(dayOfMonth, maxDay);
      const dateStr = `${y}-${String(m0 + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
      list.push({
        id: `${loanId}-due-${i + 1}`,
        loan_id: loanId,
        due_date: dateStr,
        due_amount: installmentAmount,
        installment_number: i + 1,
        status: 'UNPAID',
      });
    }
    return list;
  }

  // WEEKLY schedule
  const targetDow = WEEKDAY_INDEX[payload.weekly_day || 'mon'];
  const baseDate = new Date(startYear, startMonth0, 1);
  while (baseDate.getDay() !== targetDow) {
    baseDate.setDate(baseDate.getDate() + 1);
  }

  const list: LoanDueDate[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getTime());
    d.setDate(d.getDate() + i * 7);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    list.push({
      id: `${loanId}-due-${i + 1}`,
      loan_id: loanId,
      due_date: dateStr,
      due_amount: installmentAmount,
      installment_number: i + 1,
      status: 'UNPAID',
    });
  }
  return list;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [isOnlineSynced, setIsOnlineSynced] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Global Month & Year filter (defaults to August 2026 so seed data is immediately visible, and user can switch to any year/month)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(7); // 7 = August

  const [navStack, setNavStack] = useState<NavigationState[]>([
    { currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null },
  ]);

  const nav = navStack[navStack.length - 1];
  const stateRef = useRef({ loans, bills, history });
  useEffect(() => {
    stateRef.current = { loans, bills, history };
  }, [loans, bills, history]);

  // Parse OAuth callback URL (#access_token=...&refresh_token=... or ?code=...) on both Web and Android deep links
  const handleOAuthRedirectUrl = useCallback(async (url: string | null) => {
    if (!url) return;
    try {
      const hashIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      const paramsString =
        hashIndex >= 0
          ? url.slice(hashIndex + 1)
          : queryIndex >= 0
          ? url.slice(queryIndex + 1)
          : '';
      if (!paramsString) return;

      const params = new URLSearchParams(paramsString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const code = params.get('code');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          window.history?.replaceState
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          window.history?.replaceState
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {
      // Ignore malformed redirect URLs
    }
  }, []);

  // Push current state to Supabase cloud when authenticated
  const pushStateToSupabase = useCallback(
    async (
      nextLoans: Loan[],
      nextBills: Bill[],
      nextHistory: PaymentHistoryEntry[],
      profileOverride?: UserProfile | null
    ) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (!sessionUser) return;

        const nowIso = new Date().toISOString();
        const activeUser = profileOverride || user;
        await supabase.from('profiles').upsert(
          {
            id: sessionUser.id,
            email: sessionUser.email || activeUser?.email || '',
            display_name: activeUser?.display_name || 'user',
            app_state: {
              loans: nextLoans,
              bills: nextBills,
              history: nextHistory,
              updated_at: nowIso,
            },
            updated_at: nowIso,
          },
          { onConflict: 'id' }
        );
        setIsOnlineSynced(true);
        setLastSyncedAt(nowIso);
        await saveLastSyncToStorage(nowIso);
      } catch {
        // Offline - local storage remains primary
      }
    },
    [user]
  );

  useEffect(() => {
    let mounted = true;

    loadInitialDataFromStorage().then(async (data) => {
      if (!mounted) return;
      setUser(data.user);
      setLoans(data.loans);
      setBills(data.bills);
      setHistory(data.history);
      setLastSyncedAt(data.lastSync);
      setNavStack([
        {
          currentScreen: data.user ? 'HOME' : 'LOGIN',
          selectedLoanId: null,
          editingLoanId: null,
        },
      ]);

      // Check if an OAuth callback URL is present on initial launch
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        await handleOAuthRedirectUrl(window.location.href);
      } else {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleOAuthRedirectUrl(initialUrl);
        }
      }
    });

    // Listen for Android / iOS deep link OAuth callbacks
    const linkSub = Linking.addEventListener('url', (event) => {
      handleOAuthRedirectUrl(event.url);
    });

    // Listen for Supabase Auth session changes (Google OAuth, Email login, Sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (
          session?.user &&
          (event === 'SIGNED_IN' ||
            event === 'INITIAL_SESSION' ||
            event === 'TOKEN_REFRESHED')
        ) {
          const su = session.user;
          const rawName =
            su.user_metadata?.full_name ||
            su.user_metadata?.name ||
            su.email?.split('@')[0] ||
            'user';
          const firstName = String(rawName).trim().split(' ')[0].toLowerCase();
          const providerType =
            su.app_metadata?.provider === 'google' ? 'google' : 'supabase';

          const supaProfile: UserProfile = {
            id: su.id,
            display_name: firstName,
            email: su.email || '',
            auth_provider: providerType,
            created_at: su.created_at || new Date().toISOString(),
          };

          // Pull or initialize cloud profile & app_state from Supabase
          try {
            const { data: row } = await supabase
              .from('profiles')
              .select('display_name, app_state')
              .eq('id', su.id)
              .maybeSingle();

            if (row?.display_name) {
              supaProfile.display_name = String(row.display_name).toLowerCase();
            }

            const cloudState = row?.app_state as
              | {
                  loans?: Loan[];
                  bills?: Bill[];
                  history?: PaymentHistoryEntry[];
                }
              | undefined;

            if (
              cloudState &&
              (Array.isArray(cloudState.loans) ||
                Array.isArray(cloudState.bills) ||
                Array.isArray(cloudState.history))
            ) {
              const cLoans = cloudState.loans || [];
              const cBills = cloudState.bills || [];
              const cHistory = cloudState.history || [];
              setLoans(cLoans);
              setBills(cBills);
              setHistory(cHistory);
              await Promise.all([
                saveLoansToStorage(cLoans),
                saveBillsToStorage(cBills),
                saveHistoryToStorage(cHistory),
              ]);
            } else {
              // Initialize cloud profile with current local state
              const nowIso = new Date().toISOString();
              await supabase.from('profiles').upsert(
                {
                  id: su.id,
                  email: supaProfile.email,
                  display_name: supaProfile.display_name,
                  app_state: {
                    loans: stateRef.current.loans,
                    bills: stateRef.current.bills,
                    history: stateRef.current.history,
                    updated_at: nowIso,
                  },
                  updated_at: nowIso,
                },
                { onConflict: 'id' }
              );
            }
          } catch {
            // Ignore network error during initial cloud fetch
          }

          setUser(supaProfile);
          setIsOnlineSynced(true);
          const nowIso = new Date().toISOString();
          setLastSyncedAt(nowIso);
          await Promise.all([
            saveUserToStorage(supaProfile),
            saveLastSyncToStorage(nowIso),
          ]);
          setNavStack([
            { currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null },
          ]);
        }
      }
    );

    return () => {
      mounted = false;
      linkSub.remove();
      authListener?.subscription?.unsubscribe();
    };
  }, [handleOAuthRedirectUrl]);

  const navigate = useCallback(
    (
      screen: ScreenName,
      params?: { selectedLoanId?: string | null; editingLoanId?: string | null }
    ) => {
      setNavStack((prev) => [
        ...prev,
        {
          currentScreen: screen,
          selectedLoanId:
            params?.selectedLoanId !== undefined
              ? params.selectedLoanId
              : prev[prev.length - 1]?.selectedLoanId ?? null,
          editingLoanId:
            params?.editingLoanId !== undefined
              ? params.editingLoanId
              : prev[prev.length - 1]?.editingLoanId ?? null,
        },
      ]);
    },
    []
  );

  const goBack = useCallback(() => {
    setNavStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, prev.length - 1);
    });
  }, []);

  const goHome = useCallback(() => {
    setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navStack.length > 1) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [navStack.length, goBack]);

  const setMonthYearFilter = useCallback((year: number, month: number | null) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  const syncNow = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      if (!sessionUser) {
        setIsOnlineSynced(false);
        return;
      }
      await pushStateToSupabase(
        stateRef.current.loans,
        stateRef.current.bills,
        stateRef.current.history
      );
    } catch {
      setIsOnlineSynced(false);
    }
  }, [pushStateToSupabase]);

  const login = useCallback(
    async (
      email: string,
      password?: string,
      provider: 'local' | 'google' | 'facebook' = 'local'
    ): Promise<{ error?: string }> => {
      // 1. Real Supabase OAuth (Google / Facebook) for both Web and Android APK
      if (provider === 'google' || provider === 'facebook') {
        try {
          if (Platform.OS === 'web') {
            const redirectTo =
              typeof window !== 'undefined' && window.location
                ? window.location.origin
                : undefined;
            const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'select_account',
                },
              },
            });
            if (error) {
              return { error: error.message };
            }
            return {};
          } else {
            // Native Android / iOS APK Deep Link OAuth
            const redirectUrl = 'utangtracker://auth/callback';
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'select_account',
                },
              },
            });
            if (error) {
              return { error: error.message };
            }
            if (data?.url) {
              await Linking.openURL(data.url);
              return {};
            }
          }
        } catch (err: any) {
          return {
            error:
              err?.message || `Unable to start ${provider} sign-in. Check your connection.`,
          };
        }
      }

      // 2. Email & Password Login (Supabase Auth + Offline Fallback)
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { error: 'Please enter your email address.' };
      }

      if (password && provider === 'local') {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!error && data.user) {
            const supaProfile: UserProfile = {
              id: data.user.id,
              display_name: cleanEmail.split('@')[0] || 'user',
              email: cleanEmail,
              auth_provider: 'supabase',
              created_at: data.user.created_at || new Date().toISOString(),
            };
            setUser(supaProfile);
            await saveUserToStorage(supaProfile);
            setIsOnlineSynced(true);
            setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
            return {};
          }
        } catch {
          // Fallback to local offline session
        }
      }

      const displayName = cleanEmail.split('@')[0] || 'maria';
      const localProfile: UserProfile = {
        id: `user-${Date.now()}`,
        display_name: displayName,
        email: cleanEmail,
        auth_provider: provider,
        created_at: new Date().toISOString(),
      };
      setUser(localProfile);
      await saveUserToStorage(localProfile);
      setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
      return {};
    },
    []
  );

  const loginDemo = useCallback(async () => {
    const seed = getDemoSeedData();
    setUser(seed.user);
    setLoans(seed.loans);
    setBills(seed.bills);
    setHistory(seed.history);
    setSelectedYear(2026);
    setSelectedMonth(7);
    await Promise.all([
      saveUserToStorage(seed.user),
      saveLoansToStorage(seed.loans),
      saveBillsToStorage(seed.bills),
      saveHistoryToStorage(seed.history),
    ]);
    setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password?: string,
      username?: string
    ): Promise<{ error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { error: 'Please enter a valid email address.' };
      }
      const displayName = (username?.trim() || cleanEmail.split('@')[0] || 'user').toLowerCase();

      if (password && password.length >= 6) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
          });
          if (!error && data.user) {
            const supaProfile: UserProfile = {
              id: data.user.id,
              display_name: displayName,
              email: cleanEmail,
              auth_provider: 'supabase',
              created_at: new Date().toISOString(),
            };
            setUser(supaProfile);
            setLoans([]);
            setBills([]);
            setHistory([]);
            await Promise.all([
              saveUserToStorage(supaProfile),
              saveLoansToStorage([]),
              saveBillsToStorage([]),
              saveHistoryToStorage([]),
            ]);
            setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
            return {};
          }
        } catch {
          // Offline fallback
        }
      }

      const newProfile: UserProfile = {
        id: `user-${Date.now()}`,
        display_name: displayName,
        email: cleanEmail,
        auth_provider: 'local',
        created_at: new Date().toISOString(),
      };
      setUser(newProfile);
      setLoans([]);
      setBills([]);
      setHistory([]);
      await Promise.all([
        saveUserToStorage(newProfile),
        saveLoansToStorage([]),
        saveBillsToStorage([]),
        saveHistoryToStorage([]),
      ]);
      setNavStack([{ currentScreen: 'HOME', selectedLoanId: null, editingLoanId: null }]);
      return {};
    },
    []
  );

  const updateUsername = useCallback(
    async (newName: string) => {
      if (!user || !newName.trim()) return;
      const updated: UserProfile = {
        ...user,
        display_name: newName.trim().toLowerCase(),
      };
      setUser(updated);
      await saveUserToStorage(updated);
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network error during signout
    }
    setUser(null);
    setIsOnlineSynced(false);
    await saveUserToStorage(null);
    setNavStack([{ currentScreen: 'LOGIN', selectedLoanId: null, editingLoanId: null }]);
  }, []);

  const resetAllData = useCallback(
    async (loadDemo: boolean) => {
      if (loadDemo) {
        const seed = getDemoSeedData();
        setUser(seed.user);
        setLoans(seed.loans);
        setBills(seed.bills);
        setHistory(seed.history);
        setSelectedYear(2026);
        setSelectedMonth(7);
        await Promise.all([
          saveUserToStorage(seed.user),
          saveLoansToStorage(seed.loans),
          saveBillsToStorage(seed.bills),
          saveHistoryToStorage(seed.history),
        ]);
      } else {
        setLoans([]);
        setBills([]);
        setHistory([]);
        await Promise.all([
          saveLoansToStorage([]),
          saveBillsToStorage([]),
          saveHistoryToStorage([]),
        ]);
      }
    },
    []
  );

  const saveLoanFromForm = useCallback(
    async (payload: AddLoanPayload) => {
      const now = new Date().toISOString();
      const count =
        payload.term_type === 'NONE'
          ? 1
          : Math.max(1, Math.min(60, payload.installment_count || 1));

      const installmentAmount =
        payload.amount_mode === 'PER_DUE'
          ? Math.round(payload.input_amount * 100) / 100
          : Math.round((payload.input_amount / count) * 100) / 100;

      const totalAmount =
        payload.amount_mode === 'TOTAL'
          ? Math.round(payload.input_amount * 100) / 100
          : Math.round(installmentAmount * count * 100) / 100;

      const loanId = payload.loan_id || `loan-${Date.now()}`;
      const schedule = generateDueDatesForLoan(loanId, payload, installmentAmount);
      const firstUnpaid = schedule.find((d) => d.status === 'UNPAID');

      const existingIdx = loans.findIndex((l) => l.loan_id === payload.loan_id);

      const newLoan: Loan = {
        loan_id: loanId,
        user_id: user?.id || 'local-maria-001',
        creditor_name: payload.creditor_name.trim().toUpperCase(),
        amount:
          payload.term_type === 'NONE' ? totalAmount : installmentAmount,
        total_amount: totalAmount,
        installment_amount: installmentAmount,
        installment_count: count,
        term_type: payload.term_type,
        weekly_day: payload.term_type === 'WEEKLY' ? payload.weekly_day : null,
        monthly_day: payload.term_type === 'MONTHLY' ? payload.monthly_day : null,
        due_date: payload.has_due_date ? firstUnpaid?.due_date || payload.due_date : null,
        borrowed_date: payload.borrowed_date || '2026-08-01',
        has_due_date: payload.has_due_date,
        due_dates_list: schedule,
        details_notes: payload.details_notes || '',
        status: 'UNPAID',
        is_deleted: false,
        sync_status: 'PENDING_UPSERT',
        updated_at: now,
      };

      let nextLoans: Loan[];
      if (existingIdx >= 0) {
        nextLoans = [...loans];
        nextLoans[existingIdx] = newLoan;
      } else {
        nextLoans = [newLoan, ...loans];
      }

      setLoans(nextLoans);
      await saveLoansToStorage(nextLoans);

      // Update active filter year/month so the user immediately sees the newly added loan
      if (newLoan.due_date) {
        const parts = newLoan.due_date.split('-');
        if (parts.length === 3) {
          setSelectedYear(parseInt(parts[0], 10));
          setSelectedMonth(parseInt(parts[1], 10) - 1);
        }
      }

      scheduleLoanReminder(newLoan).catch(() => {});
      syncNow().catch(() => {});
    },
    [loans, user, syncNow]
  );

  const markLoanDueDatePaid = useCallback(
    async (loanId: string, dueDateId?: string, note?: string) => {
      const idx = loans.findIndex((l) => l.loan_id === loanId);
      if (idx < 0) return;

      const target = loans[idx];
      const now = new Date().toISOString();
      const schedule = target.due_dates_list || [];
      const cleanNote = note?.trim() || '';

      if (schedule.length > 0) {
        const targetDue =
          (dueDateId && schedule.find((d) => d.id === dueDateId)) ||
          schedule.find((d) => d.status === 'UNPAID');

        if (!targetDue) return;

        const updatedSchedule: LoanDueDate[] = schedule.map((d) =>
          d.id === targetDue.id
            ? { ...d, status: 'PAID', paid_note: cleanNote || d.paid_note }
            : d
        );

        const nextUnpaid = updatedSchedule.find((d) => d.status === 'UNPAID');
        const allPaid = !nextUnpaid;

        const updatedLoan: Loan = {
          ...target,
          due_dates_list: updatedSchedule,
          due_date: nextUnpaid ? nextUnpaid.due_date : target.due_date,
          status: allPaid ? 'PAID' : 'UNPAID',
          updated_at: now,
          sync_status: 'PENDING_UPSERT',
        };

        const nextLoans = [...loans];
        nextLoans[idx] = updatedLoan;
        setLoans(nextLoans);
        await saveLoansToStorage(nextLoans);

        const histEntry: PaymentHistoryEntry = {
          history_id: `hist-${Date.now()}`,
          loan_id: target.loan_id,
          due_date_id: targetDue.id,
          bill_id: null,
          paid_month_key: targetDue.due_date.slice(0, 7),
          user_id: target.user_id,
          creditor_name: target.creditor_name,
          event_type: allPaid ? 'MARKED_PAID' : 'INSTALLMENT_PAID',
          amount_paid: targetDue.due_amount,
          note: cleanNote || `Due date ${targetDue.due_date} settled`,
          recorded_at: now,
          sync_status: 'PENDING_UPSERT',
        };
        const nextHistory = [histEntry, ...history];
        setHistory(nextHistory);
        await saveHistoryToStorage(nextHistory);
        return;
      }

      // Single due date without schedule array
      const updatedLoan: Loan = {
        ...target,
        status: 'PAID',
        updated_at: now,
        sync_status: 'PENDING_UPSERT',
      };
      const nextLoans = [...loans];
      nextLoans[idx] = updatedLoan;
      setLoans(nextLoans);
      await saveLoansToStorage(nextLoans);

      const histEntry: PaymentHistoryEntry = {
        history_id: `hist-${Date.now()}`,
        loan_id: target.loan_id,
        due_date_id: null,
        bill_id: null,
        paid_month_key: target.due_date ? target.due_date.slice(0, 7) : now.slice(0, 7),
        user_id: target.user_id,
        creditor_name: target.creditor_name,
        event_type: 'MARKED_PAID',
        amount_paid: target.amount,
        note: cleanNote || 'Marked as paid',
        recorded_at: now,
        sync_status: 'PENDING_UPSERT',
      };
      const nextHistory = [histEntry, ...history];
      setHistory(nextHistory);
      await saveHistoryToStorage(nextHistory);
    },
    [loans, history]
  );

  const unmarkLoanDueDatePaid = useCallback(
    async (loanId: string, dueDateId?: string) => {
      const idx = loans.findIndex((l) => l.loan_id === loanId);
      if (idx < 0) return;

      const target = loans[idx];
      const now = new Date().toISOString();
      const schedule = target.due_dates_list || [];

      if (schedule.length > 0) {
        const targetDue =
          (dueDateId && schedule.find((d) => d.id === dueDateId)) ||
          [...schedule].reverse().find((d) => d.status === 'PAID');

        if (!targetDue) return;

        const updatedSchedule: LoanDueDate[] = schedule.map((d) =>
          d.id === targetDue.id ? { ...d, status: 'UNPAID' } : d
        );

        const firstUnpaid = updatedSchedule.find((d) => d.status === 'UNPAID');

        const updatedLoan: Loan = {
          ...target,
          due_dates_list: updatedSchedule,
          due_date: firstUnpaid ? firstUnpaid.due_date : target.due_date,
          status: 'UNPAID',
          updated_at: now,
          sync_status: 'PENDING_UPSERT',
        };

        const nextLoans = [...loans];
        nextLoans[idx] = updatedLoan;
        setLoans(nextLoans);
        await saveLoansToStorage(nextLoans);

        // Remove the matching payment history record
        let removedOne = false;
        const nextHistory = history.filter((h) => {
          if (removedOne) return true;
          if (h.loan_id === loanId && h.due_date_id === targetDue.id) {
            removedOne = true;
            return false;
          }
          if (
            !h.due_date_id &&
            h.loan_id === loanId &&
            h.paid_month_key === targetDue.due_date.slice(0, 7)
          ) {
            removedOne = true;
            return false;
          }
          return true;
        });

        setHistory(nextHistory);
        await saveHistoryToStorage(nextHistory);
        return;
      }

      // Single due date without schedule array
      const updatedLoan: Loan = {
        ...target,
        status: 'UNPAID',
        updated_at: now,
        sync_status: 'PENDING_UPSERT',
      };
      const nextLoans = [...loans];
      nextLoans[idx] = updatedLoan;
      setLoans(nextLoans);
      await saveLoansToStorage(nextLoans);

      let removedOne = false;
      const nextHistory = history.filter((h) => {
        if (!removedOne && h.loan_id === loanId) {
          removedOne = true;
          return false;
        }
        return true;
      });
      setHistory(nextHistory);
      await saveHistoryToStorage(nextHistory);
    },
    [loans, history]
  );

  const markLoanFullOrPartialPaid = useCallback(
    async (loanId: string, amountPaid?: number, note?: string) => {
      const idx = loans.findIndex((l) => l.loan_id === loanId);
      if (idx < 0) return;

      const target = loans[idx];
      const now = new Date().toISOString();
      const cleanNote = note?.trim() || '';
      const paidVal =
        amountPaid !== undefined && amountPaid > 0 ? amountPaid : target.amount;
      const remaining = Math.max(0, Math.round((target.amount - paidVal) * 100) / 100);
      const isFullyPaid = remaining <= 0;

      const updatedLoan: Loan = {
        ...target,
        amount: isFullyPaid ? target.total_amount : remaining,
        status: isFullyPaid ? 'PAID' : 'UNPAID',
        updated_at: now,
        sync_status: 'PENDING_UPSERT',
      };

      const nextLoans = [...loans];
      nextLoans[idx] = updatedLoan;
      setLoans(nextLoans);
      await saveLoansToStorage(nextLoans);

      const defaultNote = isFullyPaid
        ? 'Settled in full'
        : `Partial payment (${remaining} remaining)`;

      const histEntry: PaymentHistoryEntry = {
        history_id: `hist-${Date.now()}`,
        loan_id: target.loan_id,
        due_date_id: null,
        bill_id: null,
        paid_month_key: now.slice(0, 7),
        user_id: target.user_id,
        creditor_name: target.creditor_name,
        event_type: isFullyPaid ? 'MARKED_PAID' : 'PARTIAL_PAID',
        amount_paid: paidVal,
        note: cleanNote
          ? `${cleanNote} (${defaultNote.toLowerCase()})`
          : defaultNote,
        recorded_at: now,
        sync_status: 'PENDING_UPSERT',
      };
      const nextHistory = [histEntry, ...history];
      setHistory(nextHistory);
      await saveHistoryToStorage(nextHistory);
    },
    [loans, history]
  );

  const deleteLoan = useCallback(
    async (loanId: string) => {
      const nextLoans = loans.filter((l) => l.loan_id !== loanId);
      setLoans(nextLoans);
      await saveLoansToStorage(nextLoans);
    },
    [loans]
  );

  const toggleBillPaidForMonth = useCallback(
    async (billId: string, yearMonthKey: string, note?: string) => {
      const idx = bills.findIndex((b) => b.bill_id === billId);
      if (idx < 0) return;

      const target = bills[idx];
      const now = new Date().toISOString();
      const cleanNote = note?.trim() || '';
      const currentPaidMonths = target.paid_months || [];
      const alreadyPaid = currentPaidMonths.includes(yearMonthKey);

      const nextPaidMonths = alreadyPaid
        ? currentPaidMonths.filter((m) => m !== yearMonthKey)
        : [...currentPaidMonths, yearMonthKey];

      const updatedBill: Bill = {
        ...target,
        paid_months: nextPaidMonths,
        is_paid: !alreadyPaid,
        updated_at: now,
        sync_status: 'PENDING_UPSERT',
      };

      const nextBills = [...bills];
      nextBills[idx] = updatedBill;
      setBills(nextBills);
      await saveBillsToStorage(nextBills);

      if (!alreadyPaid) {
        const histEntry: PaymentHistoryEntry = {
          history_id: `hist-bill-${Date.now()}`,
          loan_id: null,
          due_date_id: null,
          bill_id: target.bill_id,
          paid_month_key: yearMonthKey,
          user_id: target.user_id,
          creditor_name: target.bill_name.toUpperCase(),
          event_type: 'BILL_PAID',
          amount_paid: target.amount,
          note: cleanNote || target.notes || `Bill settled for ${yearMonthKey}`,
          recorded_at: now,
          sync_status: 'PENDING_UPSERT',
        };
        const nextHistory = [histEntry, ...history];
        setHistory(nextHistory);
        await saveHistoryToStorage(nextHistory);
      } else {
        const nextHistory = history.filter(
          (h) => !(h.bill_id === billId && h.paid_month_key === yearMonthKey)
        );
        setHistory(nextHistory);
        await saveHistoryToStorage(nextHistory);
      }
    },
    [bills, history]
  );

  const saveBill = useCallback(
    async (billInput: {
      bill_id?: string;
      bill_name: string;
      icon_type: BillIconType;
      amount: number;
      due_day: number | null;
      has_due_date?: boolean;
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      const hasDueDate =
        billInput.has_due_date !== undefined
          ? billInput.has_due_date
          : billInput.due_day !== null && billInput.due_day > 0;
      const clampedDay = hasDueDate
        ? Math.max(1, Math.min(31, billInput.due_day || 25))
        : null;
      const dueDateStr = clampedDay
        ? `2026-08-${String(clampedDay).padStart(2, '0')}`
        : '';

      const existingIdx = bills.findIndex((b) => b.bill_id === billInput.bill_id);
      let nextBills: Bill[];

      if (existingIdx >= 0 && billInput.bill_id) {
        const existing = bills[existingIdx];
        const updated: Bill = {
          ...existing,
          bill_name: billInput.bill_name.trim().toLowerCase(),
          icon_type: billInput.icon_type,
          amount: billInput.amount,
          due_day: clampedDay,
          has_due_date: hasDueDate,
          notes: billInput.notes?.trim() || '',
          due_date: dueDateStr,
          updated_at: now,
        };
        nextBills = [...bills];
        nextBills[existingIdx] = updated;
      } else {
        const created: Bill = {
          bill_id: `bill-${Date.now()}`,
          user_id: user?.id || 'local-maria-001',
          bill_name: billInput.bill_name.trim().toLowerCase(),
          icon_type: billInput.icon_type,
          amount: billInput.amount,
          due_day: clampedDay,
          has_due_date: hasDueDate,
          notes: billInput.notes?.trim() || '',
          due_date: dueDateStr,
          paid_months: [],
          is_paid: false,
          is_deleted: false,
          sync_status: 'PENDING_UPSERT',
          updated_at: now,
        };
        nextBills = [...bills, created];
      }

      setBills(nextBills);
      await saveBillsToStorage(nextBills);
    },
    [bills, user]
  );

  const deleteBill = useCallback(
    async (billId: string) => {
      const nextBills = bills.filter((b) => b.bill_id !== billId);
      setBills(nextBills);
      await saveBillsToStorage(nextBills);
    },
    [bills]
  );

  const undoHistoryPayment = useCallback(
    async (historyId: string) => {
      const entry = history.find((h) => h.history_id === historyId);
      if (!entry) return;

      if (entry.loan_id) {
        const lIdx = loans.findIndex((l) => l.loan_id === entry.loan_id);
        if (lIdx >= 0) {
          const loan = loans[lIdx];
          let updatedLoan: Loan = { ...loan, status: 'UNPAID' };

          if (entry.due_date_id && loan.due_dates_list?.length) {
            const newSchedule: LoanDueDate[] = loan.due_dates_list.map((d) =>
              d.id === entry.due_date_id ? { ...d, status: 'UNPAID' } : d
            );
            const firstUnpaid = newSchedule.find((d) => d.status === 'UNPAID');
            updatedLoan = {
              ...updatedLoan,
              due_dates_list: newSchedule,
              due_date: firstUnpaid ? firstUnpaid.due_date : loan.due_date,
            };
          } else if (entry.event_type === 'PARTIAL_PAID') {
            updatedLoan = {
              ...updatedLoan,
              amount: Math.min(loan.total_amount, loan.amount + entry.amount_paid),
            };
          }

          const nextLoans = [...loans];
          nextLoans[lIdx] = updatedLoan;
          setLoans(nextLoans);
          await saveLoansToStorage(nextLoans);
        }
      } else if (entry.bill_id && entry.paid_month_key) {
        const bIdx = bills.findIndex((b) => b.bill_id === entry.bill_id);
        if (bIdx >= 0) {
          const bill = bills[bIdx];
          const updatedBill: Bill = {
            ...bill,
            paid_months: (bill.paid_months || []).filter(
              (m) => m !== entry.paid_month_key
            ),
            is_paid: false,
          };
          const nextBills = [...bills];
          nextBills[bIdx] = updatedBill;
          setBills(nextBills);
          await saveBillsToStorage(nextBills);
        }
      }

      const nextHistory = history.filter((h) => h.history_id !== historyId);
      setHistory(nextHistory);
      await saveHistoryToStorage(nextHistory);
    },
    [history, loans, bills]
  );

  const value = useMemo<AppContextType>(
    () => ({
      user,
      loans,
      bills,
      history,
      isOnlineSynced,
      lastSyncedAt,
      selectedYear,
      selectedMonth,
      setMonthYearFilter,
      nav,
      navigate,
      goBack,
      goHome,
      login,
      loginDemo,
      register,
      updateUsername,
      logout,
      resetAllData,
      saveLoanFromForm,
      markLoanDueDatePaid,
      unmarkLoanDueDatePaid,
      markLoanFullOrPartialPaid,
      deleteLoan,
      toggleBillPaidForMonth,
      saveBill,
      deleteBill,
      undoHistoryPayment,
      syncNow,
    }),
    [
      user,
      loans,
      bills,
      history,
      isOnlineSynced,
      lastSyncedAt,
      selectedYear,
      selectedMonth,
      setMonthYearFilter,
      nav,
      navigate,
      goBack,
      goHome,
      login,
      loginDemo,
      register,
      updateUsername,
      logout,
      resetAllData,
      saveLoanFromForm,
      markLoanDueDatePaid,
      unmarkLoanDueDatePaid,
      markLoanFullOrPartialPaid,
      deleteLoan,
      toggleBillPaidForMonth,
      saveBill,
      deleteBill,
      undoHistoryPayment,
      syncNow,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
