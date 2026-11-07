export type TermType = 'NONE' | 'WEEKLY' | 'MONTHLY';

export type WeekdayPill = 'mon' | 'tues' | 'wed' | 'thur' | 'fri' | 'sat' | 'sun';

export type LoanStatus = 'UNPAID' | 'PAID';

export type SyncStatus = 'SYNCED' | 'PENDING_UPSERT' | 'PENDING_DELETE';

export type HistoryEventType =
  | 'CREATED'
  | 'EDITED'
  | 'INSTALLMENT_PAID'
  | 'PARTIAL_PAID'
  | 'MARKED_PAID'
  | 'BILL_PAID';

export type BillIconType = 'bolt' | 'droplet' | 'wifi' | 'home' | 'tv' | 'music' | 'other';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  auth_provider: 'local' | 'google' | 'facebook' | 'supabase';
  created_at: string;
}

export interface LoanDueDate {
  id: string;
  loan_id: string;
  due_date: string; // YYYY-MM-DD
  due_amount: number;
  installment_number: number;
  status: LoanStatus;
  paid_note?: string;
}

export interface Loan {
  loan_id: string;
  user_id: string;
  creditor_name: string;
  amount: number; // Remaining or active amount
  total_amount: number; // Original total loan amount
  installment_amount: number; // Amount per scheduled due date
  installment_count: number; // e.g. 1 for NONE, 5 for 5 months
  term_type: TermType;
  weekly_day: WeekdayPill | null;
  monthly_day: number | null; // 1..31
  due_date: string | null; // Next active unpaid due date YYYY-MM-DD, or null
  borrowed_date: string; // YYYY-MM-DD
  has_due_date: boolean;
  due_dates_list: LoanDueDate[];
  details_notes: string;
  status: LoanStatus;
  is_deleted: boolean;
  sync_status: SyncStatus;
  updated_at: string;
}

export interface Bill {
  bill_id: string;
  user_id: string;
  bill_name: string;
  icon_type: BillIconType;
  amount: number;
  due_day: number | null; // 1..31 recurring day of month, or null if no due date (anytime)
  has_due_date?: boolean; // false if bill can be paid anytime of the month
  notes?: string;
  due_date: string; // Default reference date YYYY-MM-DD
  paid_months: string[]; // Array of 'YYYY-MM' strings e.g. ['2026-08']
  is_paid: boolean; // Legacy fallback
  is_deleted: boolean;
  sync_status: SyncStatus;
  updated_at: string;
}

export interface PaymentHistoryEntry {
  history_id: string;
  loan_id: string | null;
  due_date_id?: string | null;
  bill_id?: string | null;
  paid_month_key?: string | null; // e.g. '2026-08'
  user_id: string;
  creditor_name: string;
  event_type: HistoryEventType;
  amount_paid: number;
  note?: string;
  recorded_at: string; // ISO string
  sync_status: SyncStatus;
}

export type ScreenName =
  | 'LOGIN'
  | 'REGISTER'
  | 'HOME'
  | 'SETTINGS'
  | 'HISTORY'
  | 'LOAN_LIST'
  | 'VIEW_LOAN_DUE'
  | 'VIEW_LOAN_NO_DUE'
  | 'ADD_EDIT_LOAN'
  | 'DASHBOARD'
  | 'BILLS'
  | 'FULL_LOAN_DETAILS';

export interface NavigationState {
  currentScreen: ScreenName;
  selectedLoanId?: string | null;
  editingLoanId?: string | null;
}

export interface AddLoanPayload {
  loan_id?: string;
  creditor_name: string;
  input_amount: number;
  amount_mode: 'PER_DUE' | 'TOTAL';
  term_type: TermType;
  installment_count: number;
  weekly_day: WeekdayPill | null;
  monthly_day: number | null;
  due_date: string | null;
  borrowed_date: string;
  has_due_date: boolean;
  start_year?: number;
  start_month?: number; // 0..11
  details_notes?: string;
}

export interface AppContextType {
  user: UserProfile | null;
  loans: Loan[];
  bills: Bill[];
  history: PaymentHistoryEntry[];
  isOnlineSynced: boolean;
  lastSyncedAt: string | null;
  // Global Month & Year Filter State
  selectedYear: number;
  selectedMonth: number | null; // 0..11, or null for 'ALL'
  setMonthYearFilter: (year: number, month: number | null) => void;
  nav: NavigationState;
  navigate: (screen: ScreenName, params?: { selectedLoanId?: string | null; editingLoanId?: string | null }) => void;
  goBack: () => void;
  goHome: () => void;
  login: (email: string, password?: string, provider?: 'local' | 'google' | 'facebook') => Promise<{ error?: string }>;
  loginDemo: () => Promise<void>;
  register: (email: string, password?: string, username?: string) => Promise<{ error?: string }>;
  updateUsername: (newName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetAllData: (loadDemo: boolean) => Promise<void>;
  saveLoanFromForm: (payload: AddLoanPayload) => Promise<void>;
  markLoanDueDatePaid: (loanId: string, dueDateId?: string, note?: string) => Promise<void>;
  unmarkLoanDueDatePaid: (loanId: string, dueDateId?: string) => Promise<void>;
  markLoanFullOrPartialPaid: (loanId: string, amountPaid?: number, note?: string) => Promise<void>;
  deleteLoan: (loanId: string) => Promise<void>;
  toggleBillPaidForMonth: (billId: string, yearMonthKey: string, note?: string) => Promise<void>;
  saveBill: (
    billInput: {
      bill_id?: string;
      bill_name: string;
      icon_type: BillIconType;
      amount: number;
      due_day: number | null;
      has_due_date?: boolean;
      notes?: string;
    }
  ) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  undoHistoryPayment: (historyId: string) => Promise<void>;
  syncNow: () => Promise<void>;
}
