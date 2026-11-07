import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
  COLORS,
  FONTS,
  formatFullDateLabel,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { AnimatedModal } from '../components/AnimatedModal';

export default function ViewLoanNoDueScreen() {
  const {
    loans,
    nav,
    navigate,
    markLoanFullOrPartialPaid,
    goBack,
    goHome,
  } = useApp();

  const loan = loans.find((l) => l.loan_id === nav.selectedLoanId) || loans[0];
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  if (!loan) {
    return (
      <View style={styles.container}>
        <TopBar showClock={false} onBackPress={goBack} onHomePress={goHome} />
      </View>
    );
  }

  const remainingBalance = loan.status === 'PAID' ? 0 : loan.amount;

  const handleFullPay = async () => {
    const cleanNote = paymentNote.trim();
    setPaymentNote('');
    await markLoanFullOrPartialPaid(loan.loan_id, loan.amount, cleanNote);
    setPayModalVisible(false);
    navigate('HISTORY');
  };

  const handlePartialPay = async () => {
    const val = parseFloat(partialAmount);
    if (!val || val <= 0) return;
    const cleanNote = paymentNote.trim();
    setPaymentNote('');
    await markLoanFullOrPartialPaid(loan.loan_id, val, cleanNote);
    setPayModalVisible(false);
    setPartialAmount('');
    if (val >= loan.amount) {
      navigate('HISTORY');
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <View>
        <TopBar showClock={false} onBackPress={goBack} onHomePress={goHome} />
      </View>

      {/* 2. BODY: NAME, AMOUNT, REMAINING BALANCE, BORROWED DATE, NOTE, NO DUE DATE */}
      <View style={styles.body}>
        <View style={styles.infoStack}>
          <Text style={styles.infoText}>NAME:     {loan.creditor_name}</Text>
          <Text style={styles.infoText}>
            AMOUNT:   {loan.total_amount || loan.amount}
          </Text>
          <Text style={styles.remainingText}>
            REMAINING BALANCE: {remainingBalance}
          </Text>
          <View style={styles.borrowedBlock}>
            <Text style={styles.borrowedLabel}>BORROWED DATE:</Text>
            <Text style={styles.borrowedValue}>
              {formatFullDateLabel(loan.borrowed_date, true)}
            </Text>
          </View>
          {loan.details_notes ? (
            <Text style={styles.loanNoteText}>NOTE: {loan.details_notes}</Text>
          ) : null}
          <Text style={styles.noDueDateText}>NO DUE DATE</Text>
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
          onPress={() => setPayModalVisible(true)}
          style={styles.markPaidBtn}
          textStyle={styles.markPaidText}
        />
      </View>

      {/* Full vs Partial Payment Modal (With Optional Payment Note) */}
      <AnimatedModal
        visible={payModalVisible}
        title={`SETTLE: ${loan.creditor_name}`}
        subtitle={`Remaining balance: ${remainingBalance}`}
        onClose={() => setPayModalVisible(false)}
      >
        <View style={{ gap: 12 }}>
          <View>
            <Text style={styles.noteFieldLabel}>PAYMENT NOTE (OPTIONAL):</Text>
            <TextInput
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder="e.g. Paid via GCash, cash handoff..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.noteInput}
            />
          </View>

          <NeoButton
            label={`pay full (${remainingBalance})`}
            variant="offset"
            backgroundColor={COLORS.markPaidLime}
            onPress={handleFullPay}
            style={{ minHeight: 50 }}
            textStyle={{ fontSize: 16 }}
          />

          <View style={styles.dividerRow}>
            <Text style={styles.orText}>or enter partial payment</Text>
          </View>

          <View style={styles.partialRow}>
            <TextInput
              value={partialAmount}
              onChangeText={setPartialAmount}
              keyboardType="numeric"
              placeholder="Amount e.g. 200"
              placeholderTextColor={COLORS.textMuted}
              style={styles.partialInput}
            />
            <View style={{ width: 120 }}>
              <NeoButton
                label="pay partial"
                variant="offset"
                backgroundColor={COLORS.utangYellow}
                onPress={handlePartialPay}
                style={{ minHeight: 46, paddingHorizontal: 10 }}
                textStyle={{ fontSize: 13 }}
              />
            </View>
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
  body: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  infoStack: {
    gap: 12,
  },
  infoText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  remainingText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  borrowedBlock: {
    marginTop: 2,
  },
  borrowedLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  borrowedValue: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  loanNoteText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noDueDateText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  detailsLinkTouch: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailsLinkText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingTop: 6,
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
  noteFieldLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  noteInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  dividerRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  orText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  partialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partialInput: {
    flex: 1,
    height: 46,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
});
