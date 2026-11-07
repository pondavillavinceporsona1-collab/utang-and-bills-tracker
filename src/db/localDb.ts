import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Loan,
  Bill,
  PaymentHistoryEntry,
  LoanDueDate,
} from '../types';

const KEYS = {
  USER: '@utang_v4_user',
  LOANS: '@utang_v4_loans',
  BILLS: '@utang_v4_bills',
  HISTORY: '@utang_v4_history',
  LAST_SYNC: '@utang_v4_last_sync',
  INITIALIZED: '@utang_v4_initialized',
};

export const DEMO_USER: UserProfile = {
  id: 'local-maria-001',
  display_name: 'maria',
  email: 'maria@example.com',
  auth_provider: 'local',
  created_at: '2026-08-01T00:00:00.000Z',
};

function buildMonthlySchedule(
  loanId: string,
  startYear: number,
  startMonth0: number,
  dayOfMonth: number,
  count: number,
  dueAmount: number
): LoanDueDate[] {
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
      due_amount: dueAmount,
      installment_number: i + 1,
      status: 'UNPAID',
    });
  }
  return list;
}

export function getDemoSeedData(): {
  user: UserProfile;
  loans: Loan[];
  bills: Bill[];
  history: PaymentHistoryEntry[];
} {
  const now = '2026-08-02T23:15:00.000Z';

  const khorpilSchedule = buildMonthlySchedule('loan-khorpil', 2026, 7, 11, 5, 100);
  const skyroSchedule = buildMonthlySchedule('loan-skyro', 2026, 7, 11, 6, 375);
  const ateAnaSchedule = buildMonthlySchedule('loan-ate-ana', 2026, 7, 9, 4, 170);
  const shopeeSchedule = buildMonthlySchedule('loan-shopee', 2026, 7, 25, 3, 54);

  const loans: Loan[] = [
    {
      loan_id: 'loan-ate-ana',
      user_id: DEMO_USER.id,
      creditor_name: 'ATE ANA',
      amount: 170,
      total_amount: 680,
      installment_amount: 170,
      installment_count: 4,
      term_type: 'MONTHLY',
      weekly_day: null,
      monthly_day: 9,
      due_date: '2026-08-09',
      borrowed_date: '2026-07-09',
      has_due_date: true,
      due_dates_list: ateAnaSchedule,
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-khorpil',
      user_id: DEMO_USER.id,
      creditor_name: 'KHORPIL',
      amount: 100,
      total_amount: 500,
      installment_amount: 100,
      installment_count: 5,
      term_type: 'MONTHLY',
      weekly_day: null,
      monthly_day: 11,
      due_date: '2026-08-11',
      borrowed_date: '2026-08-01',
      has_due_date: true,
      due_dates_list: khorpilSchedule,
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-skyro',
      user_id: DEMO_USER.id,
      creditor_name: 'SKYRO',
      amount: 375,
      total_amount: 2250,
      installment_amount: 375,
      installment_count: 6,
      term_type: 'MONTHLY',
      weekly_day: null,
      monthly_day: 11,
      due_date: '2026-08-11',
      borrowed_date: '2026-06-11',
      has_due_date: true,
      due_dates_list: skyroSchedule,
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-shopee',
      user_id: DEMO_USER.id,
      creditor_name: 'SHOPEE',
      amount: 54,
      total_amount: 162,
      installment_amount: 54,
      installment_count: 3,
      term_type: 'MONTHLY',
      weekly_day: null,
      monthly_day: 25,
      due_date: '2026-08-25',
      borrowed_date: '2026-07-25',
      has_due_date: true,
      due_dates_list: shopeeSchedule,
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-vince',
      user_id: DEMO_USER.id,
      creditor_name: 'VINCE',
      amount: 500,
      total_amount: 500,
      installment_amount: 500,
      installment_count: 1,
      term_type: 'NONE',
      weekly_day: null,
      monthly_day: null,
      due_date: null,
      borrowed_date: '2025-08-12',
      has_due_date: false,
      due_dates_list: [],
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-vince-2',
      user_id: DEMO_USER.id,
      creditor_name: 'VINCE',
      amount: 250,
      total_amount: 250,
      installment_amount: 250,
      installment_count: 1,
      term_type: 'NONE',
      weekly_day: null,
      monthly_day: null,
      due_date: null,
      borrowed_date: '2025-09-01',
      has_due_date: false,
      due_dates_list: [],
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      loan_id: 'loan-vince-3',
      user_id: DEMO_USER.id,
      creditor_name: 'VINCE',
      amount: 150,
      total_amount: 150,
      installment_amount: 150,
      installment_count: 1,
      term_type: 'NONE',
      weekly_day: null,
      monthly_day: null,
      due_date: null,
      borrowed_date: '2025-10-05',
      has_due_date: false,
      due_dates_list: [],
      details_notes: '',
      status: 'UNPAID',
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
  ];

  const bills: Bill[] = [
    {
      bill_id: 'bill-electricity',
      user_id: DEMO_USER.id,
      bill_name: 'electricity',
      icon_type: 'bolt',
      amount: 1850,
      due_day: 25,
      due_date: '2026-08-25',
      paid_months: [],
      is_paid: false,
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      bill_id: 'bill-water',
      user_id: DEMO_USER.id,
      bill_name: 'water',
      icon_type: 'droplet',
      amount: 420,
      due_day: 25,
      due_date: '2026-08-25',
      paid_months: [],
      is_paid: false,
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      bill_id: 'bill-wifi',
      user_id: DEMO_USER.id,
      bill_name: 'wifi',
      icon_type: 'wifi',
      amount: 1299,
      due_day: 25,
      due_date: '2026-08-25',
      paid_months: [],
      is_paid: false,
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
    {
      bill_id: 'bill-rent',
      user_id: DEMO_USER.id,
      bill_name: 'rent',
      icon_type: 'home',
      amount: 4500,
      due_day: 25,
      due_date: '2026-08-25',
      paid_months: [],
      is_paid: false,
      is_deleted: false,
      sync_status: 'SYNCED',
      updated_at: now,
    },
  ];

  const history: PaymentHistoryEntry[] = [
    {
      history_id: 'hist-seed-khorpil-paid',
      loan_id: 'loan-khorpil',
      due_date_id: null,
      bill_id: null,
      paid_month_key: '2026-08',
      user_id: DEMO_USER.id,
      creditor_name: 'KHORPIL',
      event_type: 'MARKED_PAID',
      amount_paid: 100,
      note: 'Previous installment settled',
      recorded_at: '2026-08-25T23:15:00.000Z',
      sync_status: 'SYNCED',
    },
  ];

  return { user: DEMO_USER, loans, bills, history };
}

export async function loadInitialDataFromStorage(): Promise<{
  user: UserProfile | null;
  loans: Loan[];
  bills: Bill[];
  history: PaymentHistoryEntry[];
  lastSync: string | null;
}> {
  try {
    const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
    if (!initialized) {
      const seed = getDemoSeedData();
      await Promise.all([
        AsyncStorage.setItem(KEYS.USER, JSON.stringify(seed.user)),
        AsyncStorage.setItem(KEYS.LOANS, JSON.stringify(seed.loans)),
        AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(seed.bills)),
        AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(seed.history)),
        AsyncStorage.setItem(KEYS.INITIALIZED, 'true'),
      ]);
      return { ...seed, lastSync: null };
    }

    const [uRaw, lRaw, bRaw, hRaw, sRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.USER),
      AsyncStorage.getItem(KEYS.LOANS),
      AsyncStorage.getItem(KEYS.BILLS),
      AsyncStorage.getItem(KEYS.HISTORY),
      AsyncStorage.getItem(KEYS.LAST_SYNC),
    ]);

    let parsedLoans: Loan[] = lRaw ? JSON.parse(lRaw) : [];
    // Sync demo seed rows with the wireframe ('9 ATE ANA', '11 KHORPIL', '11 SKYRO', '25 SHOPEE', 'no due date VINCE', '---- VINCE')
    if (parsedLoans.some((l) => l.loan_id === 'loan-ate-ana')) {
      parsedLoans = parsedLoans.filter((l) => l.loan_id !== 'loan-iem');
      const seed = getDemoSeedData();
      seed.loans.forEach((seedLoan) => {
        if (!parsedLoans.some((l) => l.loan_id === seedLoan.loan_id)) {
          parsedLoans.push(seedLoan);
        }
      });
      await AsyncStorage.setItem(KEYS.LOANS, JSON.stringify(parsedLoans));
    }

    return {
      user: uRaw ? JSON.parse(uRaw) : null,
      loans: parsedLoans,
      bills: bRaw ? JSON.parse(bRaw) : [],
      history: hRaw ? JSON.parse(hRaw) : [],
      lastSync: sRaw || null,
    };
  } catch {
    const seed = getDemoSeedData();
    return { ...seed, lastSync: null };
  }
}

export async function saveUserToStorage(user: UserProfile | null): Promise<void> {
  if (!user) {
    await AsyncStorage.removeItem(KEYS.USER);
  } else {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  }
}

export async function saveLoansToStorage(loans: Loan[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOANS, JSON.stringify(loans));
}

export async function saveBillsToStorage(bills: Bill[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
}

export async function saveHistoryToStorage(history: PaymentHistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export async function saveLastSyncToStorage(iso: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, iso);
}
