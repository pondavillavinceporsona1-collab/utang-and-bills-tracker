import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Loan, Bill } from '../types';

// Safely configure notification behavior (alert, sound, badge)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Gracefully ignored on platforms where notification handler cannot be set (e.g. some web configs)
}

/**
 * Request notification permissions safely across platforms.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[NotificationService] permission check failed:', error);
    return false;
  }
}

/**
 * Format date string into human-readable wireframe month-day display (e.g., 'AUG 25')
 */
export function formatMonthDay(dateStr: string): string {
  try {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${months[monthIdx]} ${day}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

const BILL_EMOJIS: Record<string, string> = {
  bolt: '⚡',
  droplet: '💧',
  wifi: '📶',
  home: '🏠',
};

/**
 * Calculate trigger time for reminders.
 * Schedules for 9:00 AM 1 day before the due date.
 * If that has passed, attempts 9:00 AM on the due date.
 * If already overdue or web/test mode, falls back to a 10s delay.
 */
function calculateTrigger(dueDateStr: string): Notifications.NotificationTriggerInput {
  try {
    const now = new Date();
    // Parse target date at 9:00 AM local time
    const [year, month, day] = dueDateStr.split('-').map((n) => parseInt(n, 10));
    const targetDueDate = new Date(year, month - 1, day, 9, 0, 0);

    // 1 day before due date at 9:00 AM
    const reminderDate = new Date(targetDueDate.getTime() - 24 * 60 * 60 * 1000);

    if (reminderDate.getTime() > now.getTime()) {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      };
    }

    if (targetDueDate.getTime() > now.getTime()) {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDueDate,
      };
    }

    // If due date has already arrived or passed, schedule in 10 seconds for demo preview
    return {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    };
  } catch {
    return {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    };
  }
}

/**
 * Schedule loan payment reminder with Karlan et al. (NBER) "Personal Touch" enhancement.
 * Notification explicitly names the creditor and amount to significantly increase repayment rates.
 * e.g., "Due Tomorrow: ₱100 for KHORPIL"
 */
export async function scheduleLoanReminder(loan: Loan): Promise<string | null> {
  try {
    if (!loan.has_due_date || !loan.due_date || loan.status === 'PAID') {
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission && Platform.OS !== 'android') {
      // Return null quietly if permissions are not available
      return null;
    }

    const formattedAmount = `₱${loan.amount.toLocaleString()}`;
    const formattedDue = formatMonthDay(loan.due_date);

    // Karlan et al. research-backed personalized phrasing
    const title = `Due Tomorrow: ${formattedAmount} for ${loan.creditor_name}`;
    const body = `Hi Maria, don't forget your utang of ${formattedAmount} for ${loan.creditor_name} is due on ${formattedDue}. Keeping promises keeps credit open! 🤝`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'LOAN_DUE',
          loan_id: loan.loan_id,
          creditor_name: loan.creditor_name,
        },
        sound: true,
      },
      trigger: calculateTrigger(loan.due_date),
    });

    return notificationId;
  } catch (error) {
    // Fail silently on emulators or web environments without crashing
    console.warn('[NotificationService] scheduleLoanReminder non-fatal error:', error);
    return null;
  }
}

/**
 * Schedule bill payment reminder with Karlan et al. "Personal Touch" enhancement.
 * e.g., "Bill Due AUG 25: electricity ⚡"
 */
export async function scheduleBillReminder(bill: Bill): Promise<string | null> {
  try {
    if (bill.is_paid || !bill.due_date) {
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission && Platform.OS !== 'android') {
      return null;
    }

    const emoji = BILL_EMOJIS[bill.icon_type] || '🧾';
    const formattedDue = formatMonthDay(bill.due_date);
    const formattedAmount = `₱${bill.amount.toLocaleString()}`;

    // Research-backed specific phrasing naming the exact utility and date
    const title = `Bill Due ${formattedDue}: ${bill.bill_name} ${emoji}`;
    const body = `Reminder to pay your ${formattedAmount} ${bill.bill_name} bill before ${formattedDue} to prevent service interruption.`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'BILL_DUE',
          bill_id: bill.bill_id,
          bill_name: bill.bill_name,
        },
        sound: true,
      },
      trigger: calculateTrigger(bill.due_date),
    });

    return notificationId;
  } catch (error) {
    console.warn('[NotificationService] scheduleBillReminder non-fatal error:', error);
    return null;
  }
}

/**
 * Cancel a specific scheduled notification
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.warn('[NotificationService] cancelReminder non-fatal error:', error);
  }
}

/**
 * Cancel all scheduled notifications (e.g. on logout or full reset)
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[NotificationService] cancelAllReminders non-fatal error:', error);
  }
}
