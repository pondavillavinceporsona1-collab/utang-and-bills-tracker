import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { TermType, WeekdayPill } from '../types';
import {
  COLORS,
  FONTS,
  MONTH_SHORT,
  formatFullDateLabel,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { WeeklyPillSelector } from '../components/WeeklyPillSelector';
import { MonthlyGridSelector } from '../components/MonthlyGridSelector';
import { CalendarPickerModal } from '../components/CalendarPickerModal';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { ChevronDownIcon } from '../components/VectorIcons';

export default function AddEditLoanScreen() {
  const {
    loans,
    nav,
    selectedYear,
    selectedMonth,
    saveLoanFromForm,
    goBack,
    goHome,
  } = useApp();

  const editingLoan = loans.find((l) => l.loan_id === nav.editingLoanId) || null;

  const [creditorName, setCreditorName] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [amountMode, setAmountMode] = useState<'PER_DUE' | 'TOTAL'>('PER_DUE');
  const [termType, setTermType] = useState<TermType>('NONE');
  const [installmentCount, setInstallmentCount] = useState<number>(5);
  const [weeklyDay, setWeeklyDay] = useState<WeekdayPill>('mon');
  const [monthlyDay, setMonthlyDay] = useState<number>(11);
  const [dueDate, setDueDate] = useState<string | null>('2026-08-11');
  const [startYear, setStartYear] = useState<number>(selectedYear || 2026);
  const [startMonth0, setStartMonth0] = useState<number>(selectedMonth ?? 7);
  const [detailsNotes, setDetailsNotes] = useState<string>('');

  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [startMonthModalVisible, setStartMonthModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingLoan) {
      setCreditorName(editingLoan.creditor_name);
      setInputAmount(
        String(editingLoan.installment_amount || editingLoan.amount || '')
      );
      setAmountMode('PER_DUE');
      setTermType(editingLoan.term_type);
      setInstallmentCount(editingLoan.installment_count || 5);
      setWeeklyDay(editingLoan.weekly_day || 'mon');
      setMonthlyDay(editingLoan.monthly_day || 11);
      setDueDate(editingLoan.has_due_date ? editingLoan.due_date : null);
      setDetailsNotes(editingLoan.details_notes || '');
      if (editingLoan.due_date) {
        const parts = editingLoan.due_date.split('-');
        if (parts.length === 3) {
          setStartYear(parseInt(parts[0], 10));
          setStartMonth0(parseInt(parts[1], 10) - 1);
        }
      }
    }
  }, [editingLoan]);

  const cycleTermType = () => {
    if (termType === 'NONE') setTermType('WEEKLY');
    else if (termType === 'WEEKLY') setTermType('MONTHLY');
    else setTermType('NONE');
  };

  const termLabel =
    termType === 'NONE' ? 'NONE' : termType === 'WEEKLY' ? 'weekly' : 'monthly';

  const handleSave = async () => {
    setErrorMsg(null);
    if (!creditorName.trim()) {
      setErrorMsg('Please enter a name.');
      return;
    }
    const numericAmt = parseFloat(inputAmount);
    if (isNaN(numericAmt) || numericAmt <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    const hasDueDate = termType !== 'NONE' ? true : dueDate !== null;

    await saveLoanFromForm({
      loan_id: editingLoan?.loan_id,
      creditor_name: creditorName,
      input_amount: numericAmt,
      amount_mode: termType === 'NONE' ? 'TOTAL' : amountMode,
      term_type: termType,
      installment_count: termType === 'NONE' ? 1 : installmentCount,
      weekly_day: termType === 'WEEKLY' ? weeklyDay : null,
      monthly_day: termType === 'MONTHLY' ? monthlyDay : null,
      due_date: termType === 'NONE' ? dueDate : null,
      borrowed_date: editingLoan?.borrowed_date || `${startYear}-${String(startMonth0 + 1).padStart(2, '0')}-01`,
      has_due_date: hasDueDate,
      start_year: startYear,
      start_month: startMonth0,
      details_notes: detailsNotes.trim(),
    });

    goBack();
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        showClock={false}
        onBackPress={goBack}
        onHomePress={goHome}
      />

      {/* 2. BODY: Wireframe Form Inputs + Dynamic Term Picker */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NAME */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>NAME:</Text>
          <TextInput
            value={creditorName}
            onChangeText={setCreditorName}
            style={styles.fieldInput}
            placeholder="e.g. KHORPIL"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
          />
        </View>

        {/* AMOUNT */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>AMOUNT:</Text>
          <TextInput
            value={inputAmount}
            onChangeText={setInputAmount}
            keyboardType="numeric"
            style={styles.fieldInput}
            placeholder="100"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* NOTE (For Created / Edited Loan) */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>NOTE:</Text>
          <TextInput
            value={detailsNotes}
            onChangeText={setDetailsNotes}
            style={styles.fieldInput}
            placeholder="Optional note (e.g. GCash, emergency)"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Per Due vs Total toggle for recurring loans */}
        {termType !== 'NONE' && (
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              style={[
                styles.modePill,
                amountMode === 'PER_DUE' && styles.modePillActive,
              ]}
              onPress={() => setAmountMode('PER_DUE')}
            >
              <Text style={styles.modePillText}>per due</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modePill,
                amountMode === 'TOTAL' && styles.modePillActive,
              ]}
              onPress={() => setAmountMode('TOTAL')}
            >
              <Text style={styles.modePillText}>total loan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TERM Selector */}
        <View style={styles.termRow}>
          <Text style={styles.fieldLabel}>TERM:</Text>
          <TouchableOpacity
            style={styles.termSelectorBtn}
            onPress={cycleTermType}
            activeOpacity={0.7}
          >
            <Text style={styles.termValueText}>{termLabel}</Text>
            <ChevronDownIcon size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Term Pills */}
        <View style={styles.termQuickRow}>
          {(['NONE', 'WEEKLY', 'MONTHLY'] as TermType[]).map((t) => {
            const active = termType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.termChip, active && styles.termChipActive]}
                onPress={() => setTermType(t)}
                activeOpacity={0.8}
              >
                <Text style={styles.termChipText}>
                  {t === 'NONE' ? 'NONE' : t.toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DYNAMIC SCHEDULE SECTION */}
        {termType === 'NONE' && (
          <View style={styles.noneDateSection}>
            <View style={styles.dueDateRow}>
              <Text style={styles.fieldLabel}>DUE DATE:</Text>
              <TouchableOpacity
                style={styles.dueDateTrigger}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.dueDateValue}>
                  {dueDate ? formatFullDateLabel(dueDate, true) : 'no due date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dueQuickToggleRow}>
              <TouchableOpacity
                style={[
                  styles.dueQuickOption,
                  dueDate === null && styles.dueQuickOptionActive,
                ]}
                onPress={() => setDueDate(null)}
              >
                <Text style={styles.dueQuickText}>no due date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dueQuickOption,
                  dueDate !== null && styles.dueQuickOptionActive,
                ]}
                onPress={() => setCalendarModalVisible(true)}
              >
                <Text style={styles.dueQuickText}>due date</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {termType === 'WEEKLY' && (
          <View style={styles.scheduleSection}>
            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>WEEKS:</Text>
              <View style={styles.stepperGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setInstallmentCount((c) => Math.max(1, c - 1))
                  }
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepCountText}>{installmentCount}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setInstallmentCount((c) => Math.min(52, c + 1))
                  }
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <WeeklyPillSelector
              selectedDay={weeklyDay}
              onSelectDay={setWeeklyDay}
            />
          </View>
        )}

        {termType === 'MONTHLY' && (
          <View style={styles.scheduleSection}>
            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>MONTHS:</Text>
              <View style={styles.stepperGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setInstallmentCount((c) => Math.max(1, c - 1))
                  }
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepCountText}>{installmentCount}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() =>
                    setInstallmentCount((c) => Math.min(36, c + 1))
                  }
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.startMonthChip}
                onPress={() => setStartMonthModalVisible(true)}
              >
                <Text style={styles.startMonthText}>
                  START: {MONTH_SHORT[startMonth0]} {startYear}
                </Text>
              </TouchableOpacity>
            </View>

            <MonthlyGridSelector
              selectedDay={monthlyDay}
              onSelectDay={setMonthlyDay}
            />
          </View>
        )}

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      </ScrollView>

      {/* 3. FOOTER: Large Yellow 'save' / 'add' Button */}
      <View style={styles.footer}>
        <NeoButton
          label={editingLoan ? 'save' : 'add'}
          variant="offset"
          backgroundColor={COLORS.utangYellow}
          onPress={handleSave}
          style={styles.saveBtn}
          textStyle={styles.saveBtnText}
        />
      </View>

      {/* Visual Calendar Modal for Single Due Date */}
      <CalendarPickerModal
        visible={calendarModalVisible}
        initialDate={dueDate}
        allowNoDueDate
        title="SELECT DUE DATE"
        onSelectDate={(d) => setDueDate(d)}
        onClose={() => setCalendarModalVisible(false)}
      />

      {/* Start Month & Year Modal for Recurring Loans */}
      <MonthYearPickerModal
        visible={startMonthModalVisible}
        selectedYear={startYear}
        selectedMonth={startMonth0}
        allowAllOption={false}
        onSelect={(y, m) => {
          setStartYear(y);
          if (m !== null) setStartMonth0(m);
        }}
        onClose={() => setStartMonthModalVisible(false)}
      />
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
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    height: 38,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  modeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  modePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  modePillActive: {
    backgroundColor: COLORS.utangYellow,
  },
  modePillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  termSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  termValueText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  termQuickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  termChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  termChipActive: {
    backgroundColor: COLORS.utangYellow,
  },
  termChipText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  noneDateSection: {
    marginTop: 4,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueDateTrigger: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  dueDateValue: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  dueQuickToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dueQuickOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  dueQuickOptionActive: {
    backgroundColor: COLORS.utangYellow,
  },
  dueQuickText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scheduleSection: {
    marginTop: 4,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  durationLabel: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  stepCountText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  startMonthChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellowSoft,
  },
  startMonthText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  errorText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.logoutRed,
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  saveBtn: {
    minHeight: 62,
  },
  saveBtnText: {
    fontSize: 22,
    fontWeight: '900',
  },
});
