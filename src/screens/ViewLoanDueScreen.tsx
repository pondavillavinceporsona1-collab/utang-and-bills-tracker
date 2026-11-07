import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { LoanDueDate } from '../types';
import {
  COLORS,
  FONTS,
  formatFullDateLabel,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { AnimatedModal } from '../components/AnimatedModal';

export default function ViewLoanDueScreen() {
  const {
    loans,
    nav,
    navigate,
    markLoanDueDatePaid,
    unmarkLoanDueDatePaid,
    goBack,
    goHome,
  } = useApp();

  const loan = loans.find((l) => l.loan_id === nav.selectedLoanId) || loans[0];
  const schedule = loan?.due_dates_list || [];
  const firstUnpaid = schedule.find((d) => d.status === 'UNPAID');

  const [selectedDueId, setSelectedDueId] = useState<string | undefined>(
    firstUnpaid?.id
  );
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [unmarkTarget, setUnmarkTarget] = useState<LoanDueDate | null>(null);

  useEffect(() => {
    setSelectedDueId(firstUnpaid?.id);
  }, [loan?.loan_id, firstUnpaid?.id]);

  const remainingBalance = useMemo(() => {
    if (!loan) return 0;
    if (schedule.length > 0) {
      return (
        Math.round(
          schedule
            .filter((d) => d.status === 'UNPAID')
            .reduce((sum, d) => sum + (d.due_amount || 0), 0) * 100
        ) / 100
      );
    }
    return loan.status === 'PAID' ? 0 : loan.amount;
  }, [loan, schedule]);

  if (!loan) {
    return (
      <View style={styles.container}>
        <TopBar onBackPress={goBack} onHomePress={goHome} showClock={false} />
        <View style={styles.centerEmpty}>
          <Text style={styles.emptyText}>Loan not found.</Text>
        </View>
      </View>
    );
  }

  const handleMarkPaid = async () => {
    const cleanNote = paymentNote.trim();
    setPaymentNote('');
    await markLoanDueDatePaid(loan.loan_id, selectedDueId, cleanNote);
    const remainingUnpaid = (loan.due_dates_list || []).filter(
      (d) => d.status === 'UNPAID' && d.id !== selectedDueId
    );
    if (remainingUnpaid.length === 0) {
      navigate('HISTORY');
    }
  };

  const handleConfirmUnmark = async () => {
    if (!unmarkTarget) return;
    const targetId = unmarkTarget.id;
    setUnmarkTarget(null);
    await unmarkLoanDueDatePaid(loan.loan_id, targetId);
    setSelectedDueId(targetId);
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER: Back / Home + NAME, AMOUNT, REMAINING BALANCE */}
      <View>
        <TopBar showClock={false} onBackPress={goBack} onHomePress={goHome} />

        <View style={styles.metaBlock}>
          <Text style={styles.metaLine}>NAME: {loan.creditor_name}</Text>
          <Text style={styles.metaLine}>
            AMOUNT: {loan.installment_amount || loan.amount}
          </Text>
          <Text style={styles.remainingLine}>
            REMAINING BALANCE: {remainingBalance}
          </Text>
          {loan.details_notes ? (
            <Text style={styles.loanNoteLine}>NOTE: {loan.details_notes}</Text>
          ) : null}
        </View>
      </View>

      {/* 2. BODY: DUE dates- Scrollable Schedule + Payment Note + Full Loan Details Link */}
      <View style={styles.body}>
        <Text style={styles.dueHeaderLabel}>
          {schedule.length > 1
            ? 'DUE dates-'
            : `DUE: ${formatFullDateLabel(loan.due_date)}`}
        </Text>

        {schedule.length > 1 && (
          <ScrollView
            style={styles.datesScroll}
            contentContainerStyle={styles.datesContent}
            showsVerticalScrollIndicator={false}
          >
            {schedule.map((item) => {
              const isPaid = item.status === 'PAID';
              const isSelected = selectedDueId === item.id && !isPaid;
              const includeYear = !item.due_date.startsWith('2026-');

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dateItemRow,
                    isSelected && styles.dateItemSelected,
                    Platform.OS === 'web'
                      ? ({ cursor: 'pointer', userSelect: 'none' } as any)
                      : null,
                  ]}
                  onPress={() => {
                    if (isPaid) {
                      setUnmarkTarget(item);
                    } else {
                      setSelectedDueId(item.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      selectable={false}
                      style={[
                        styles.dateItemText,
                        isPaid && styles.dateItemPaidText,
                        isSelected && styles.dateItemSelectedText,
                      ]}
                    >
                      {formatFullDateLabel(item.due_date, includeYear)}
                    </Text>
                    {isPaid && item.paid_note ? (
                      <Text selectable={false} style={styles.paidNoteSub}>
                        note: {item.paid_note}
                      </Text>
                    ) : null}
                  </View>
                  {isPaid ? (
                    <View style={styles.paidSmallBadge}>
                      <Text selectable={false} style={styles.paidSmallTag}>
                        paid
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Payment Note Input for the Active Due Date */}
        <View style={styles.noteInputWrap}>
          <TextInput
            value={paymentNote}
            onChangeText={setPaymentNote}
            style={styles.noteInput}
            placeholder="Add payment note (optional)..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <TouchableOpacity
          onPress={() =>
            navigate('FULL_LOAN_DETAILS', { selectedLoanId: loan.loan_id })
          }
          style={styles.detailsLinkTouch}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsLinkText}>
            click here to see full loan details
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. FOOTER: Large Lime-Green 'MARK AS PAID' Button */}
      <View style={styles.footer}>
        <NeoButton
          label="MARK AS PAID"
          variant="offset"
          backgroundColor={COLORS.markPaidLime}
          onPress={handleMarkPaid}
          style={styles.markPaidBtn}
          textStyle={styles.markPaidText}
        />
      </View>

      {/* Confirmation Pop-up Modal to Reverse / Unmark Paid Due Date */}
      <AnimatedModal
        visible={!!unmarkTarget}
        title="UNMARK AS PAID?"
        subtitle={
          unmarkTarget
            ? `Are you sure you want to unmark ${formatFullDateLabel(
                unmarkTarget.due_date,
                true
              )} for ${loan.creditor_name} as paid?`
            : ''
        }
        onClose={() => setUnmarkTarget(null)}
      >
        <View style={styles.confirmBtnRow}>
          <View style={styles.confirmBtnCol}>
            <NeoButton
              label="cancel"
              variant="flat"
              backgroundColor={COLORS.surfaceSoft}
              onPress={() => setUnmarkTarget(null)}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 15 }}
            />
          </View>
          <View style={styles.confirmBtnCol}>
            <NeoButton
              label="yes, unmark"
              variant="offset"
              backgroundColor={COLORS.utangYellow}
              onPress={handleConfirmUnmark}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 15 }}
            />
          </View>
        </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 26,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  metaBlock: {
    marginTop: 10,
    gap: 6,
  },
  metaLine: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  remainingLine: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  loanNoteLine: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  body: {
    flex: 1,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  dueHeaderLabel: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  datesScroll: {
    flex: 1,
  },
  datesContent: {
    gap: 6,
    paddingVertical: 4,
  },
  dateItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateItemSelected: {
    backgroundColor: COLORS.utangYellowSoft,
    borderWidth: 1.75,
    borderColor: COLORS.border,
  },
  dateItemText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  dateItemSelectedText: {
    color: COLORS.textPrimary,
  },
  dateItemPaidText: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  paidNoteSub: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paidSmallBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
  },
  paidSmallTag: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  noteInputWrap: {
    marginTop: 8,
  },
  noteInput: {
    height: 38,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  detailsLinkTouch: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  markPaidBtn: {
    minHeight: 72,
  },
  markPaidText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  confirmBtnCol: {
    flex: 1,
  },
  centerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
