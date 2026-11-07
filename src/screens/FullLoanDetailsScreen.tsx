import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { PaymentHistoryEntry } from '../types';
import {
  COLORS,
  FONTS,
  formatFullDateLabel,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { AnimatedModal } from '../components/AnimatedModal';

export default function FullLoanDetailsScreen() {
  const {
    loans,
    history,
    nav,
    navigate,
    deleteLoan,
    undoHistoryPayment,
    goBack,
    goHome,
  } = useApp();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedHistoryToUndo, setSelectedHistoryToUndo] =
    useState<PaymentHistoryEntry | null>(null);

  const loan = loans.find((l) => l.loan_id === nav.selectedLoanId) || loans[0];

  const schedule = loan?.due_dates_list || [];
  const paidInstallments = schedule.filter((d) => d.status === 'PAID').length;

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
        <TopBar showClock={false} onBackPress={goBack} onHomePress={goHome} />
      </View>
    );
  }

  const loanHistory = history.filter(
    (h) =>
      h.loan_id === loan.loan_id ||
      (!h.bill_id &&
        h.creditor_name.toUpperCase() === loan.creditor_name.toUpperCase())
  );

  const handleConfirmDelete = async () => {
    setDeleteModalVisible(false);
    await deleteLoan(loan.loan_id);
    navigate('LOAN_LIST');
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        title={loan.creditor_name}
        subtitle={`STATUS: ${loan.status}`}
        centerTitle
        showClock={false}
        onBackPress={goBack}
        onHomePress={goHome}
      />

      {/* 2. BODY: Complete Loan Summary + Remaining Balance + Clickable Payment History */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.metaValue}>{loan.total_amount || loan.amount}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>REMAINING BALANCE</Text>
            <Text style={styles.metaValue}>{remainingBalance}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>PER DUE / ACTIVE</Text>
            <Text style={styles.metaValue}>
              {loan.installment_amount || loan.amount}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>TERM</Text>
            <Text style={styles.metaValue}>{loan.term_type}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>BORROWED DATE</Text>
            <Text style={styles.metaValue}>
              {formatFullDateLabel(loan.borrowed_date, true)}
            </Text>
          </View>

          {schedule.length > 0 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>PROGRESS</Text>
              <Text style={styles.metaValue}>
                {paidInstallments} of {schedule.length} paid
              </Text>
            </View>
          )}

          {loan.details_notes ? (
            <View style={styles.noteBox}>
              <Text style={styles.metaLabel}>LOAN NOTE</Text>
              <Text style={styles.loanNoteValue}>{loan.details_notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
          {loanHistory.length > 0 && (
            <Text style={styles.tapHintText}>tap a paid item to unmark</Text>
          )}
        </View>

        {loanHistory.length === 0 ? (
          <Text style={styles.emptyHistory}>
            No payments recorded for this loan yet.
          </Text>
        ) : (
          loanHistory.map((h) => (
            <TouchableOpacity
              key={h.history_id}
              style={[
                styles.historyItem,
                Platform.OS === 'web'
                  ? ({ cursor: 'pointer', userSelect: 'none' } as any)
                  : null,
              ]}
              onPress={() => setSelectedHistoryToUndo(h)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={styles.historyTopLine}>
                  <Text style={styles.historyEvent}>
                    {h.event_type === 'PARTIAL_PAID' ? 'PARTIAL PAID' : 'PAID'}
                  </Text>
                  <View style={styles.paidSmallBadge}>
                    <Text style={styles.paidSmallTag}>paid</Text>
                  </View>
                </View>

                <Text style={styles.historyDate}>
                  {formatFullDateLabel(h.recorded_at.slice(0, 10), true)}
                </Text>

                {h.note ? (
                  <Text style={styles.historyNoteText}>{h.note}</Text>
                ) : null}
              </View>

              <Text style={styles.historyAmount}>{h.amount_paid}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 3. FOOTER: Edit & Delete (With Double-Check Confirmation) */}
      <View style={styles.footer}>
        <View style={styles.btnCol}>
          <NeoButton
            label="edit"
            variant="offset"
            backgroundColor={COLORS.utangYellow}
            onPress={() =>
              navigate('ADD_EDIT_LOAN', { editingLoanId: loan.loan_id })
            }
            style={styles.footerBtn}
            textStyle={styles.footerBtnText}
          />
        </View>
        <View style={styles.btnCol}>
          <NeoButton
            label="delete"
            variant="offset"
            backgroundColor={COLORS.logoutRed}
            onPress={() => setDeleteModalVisible(true)}
            style={styles.footerBtn}
            textStyle={styles.footerBtnText}
          />
        </View>
      </View>

      {/* Delete Loan Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        itemName={loan.creditor_name}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Unmark Payment History Item Confirmation Modal */}
      <AnimatedModal
        visible={!!selectedHistoryToUndo}
        title="UNMARK AS PAID?"
        subtitle={
          selectedHistoryToUndo
            ? `Are you sure you want to unmark this payment of ${selectedHistoryToUndo.amount_paid} for ${loan.creditor_name} and restore it to unpaid?`
            : ''
        }
        onClose={() => setSelectedHistoryToUndo(null)}
      >
        {selectedHistoryToUndo && (
          <View style={{ gap: 12 }}>
            {selectedHistoryToUndo.note ? (
              <View style={styles.undoNotePreview}>
                <Text style={styles.metaLabel}>NOTE</Text>
                <Text style={styles.loanNoteValue}>
                  {selectedHistoryToUndo.note}
                </Text>
              </View>
            ) : null}

            <View style={styles.confirmBtnRow}>
              <View style={styles.btnCol}>
                <NeoButton
                  label="cancel"
                  variant="flat"
                  backgroundColor={COLORS.surfaceSoft}
                  onPress={() => setSelectedHistoryToUndo(null)}
                  style={{ minHeight: 48 }}
                  textStyle={{ fontSize: 15 }}
                />
              </View>
              <View style={styles.btnCol}>
                <NeoButton
                  label="yes, unmark"
                  variant="offset"
                  backgroundColor={COLORS.utangYellow}
                  onPress={async () => {
                    const targetId = selectedHistoryToUndo.history_id;
                    setSelectedHistoryToUndo(null);
                    await undoHistoryPayment(targetId);
                  }}
                  style={{ minHeight: 48 }}
                  textStyle={{ fontSize: 15 }}
                />
              </View>
            </View>
          </View>
        )}
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
  body: {
    flex: 1,
    marginTop: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    backgroundColor: COLORS.surfaceSoft,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  noteBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 4,
  },
  loanNoteValue: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  tapHintText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyHistory: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    borderRadius: 8,
  },
  historyTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyEvent: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  paidSmallBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
  },
  paidSmallTag: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  historyDate: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyNoteText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 3,
  },
  historyAmount: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  undoNotePreview: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSoft,
    gap: 4,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  btnCol: {
    flex: 1,
  },
  footerBtn: {
    minHeight: 56,
  },
  footerBtnText: {
    fontSize: 18,
    fontWeight: '900',
  },
});
