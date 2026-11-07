import { Platform } from 'react-native';

export const COLORS = {
  outerCanvas: '#EFECE6',
  background: '#FFFFFF',
  surfaceSoft: '#F8F8F6',
  surfaceMuted: '#F1F1EE',
  textPrimary: '#111111',
  textSecondary: '#555555',
  textMuted: '#8A8A86',
  textFaded: '#C4C4BE',
  border: '#111111',
  borderLight: '#E2E2DC',

  // Primary Wireframe Action Colors (Refined Studio Palette — Easy on the Eyes)
  utangYellow: '#F4DA58',
  utangYellowSoft: '#FBF1B8',
  dashboardCyan: '#1BB5DA',
  dashboardCyanSoft: '#BCECF7',
  billsGreen: '#5CE61C',
  billsGreenSoft: '#C9F7B2',
  markPaidLime: '#B8F265',
  markPaidLimeSoft: '#E2FAD0',
  logoutRed: '#F24E4E',
  logoutRedSoft: '#FAD1D1',

  // Urgency & Status Colors
  urgentRed: '#E53935',
  warningAmber: '#F59E0B',
  syncedGreen: '#22C55E',

  // Dashboard Donut Chart Palette (Matching Wireframe)
  chartSkyroBlue: '#4C7BF4',
  chartAteAnaPurple: '#A688FA',
  chartKhorpilAmber: '#F5B041',
  chartShopeeYellow: '#F4DA58',
  chartVinceTeal: '#38B2AC',
};

export const FONTS = {
  regular: Platform.select({
    web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
  medium: Platform.select({
    web: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif-medium',
  }),
  bold: Platform.select({
    web: '"Space Grotesk", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'sans-serif',
  }),
};

export const NEO_STYLE = {
  screenBorderWidth: 2,
  cardBorderWidth: 1.75,
  borderRadiusScreen: 32,
  borderRadiusCard: 16,
  borderRadiusButton: 14,
  borderRadiusPill: 999,
};

export const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

export const MONTH_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export function formatYearMonthKey(year: number, monthIndex0: number): string {
  const mm = String(monthIndex0 + 1).padStart(2, '0');
  return `${year}-${mm}`;
}

export function formatFullDateLabel(dateStr: string | null | undefined, includeYear = false): string {
  if (!dateStr) return 'NO DUE DATE';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const mName = MONTH_NAMES[monthIdx] || 'AUGUST';
  return includeYear ? `${mName} ${day}, ${year}` : `${mName} ${day}`;
}
