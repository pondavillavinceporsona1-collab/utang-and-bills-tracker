import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Bill, BillIconType } from '../types';
import {
  COLORS,
  FONTS,
  MONTH_SHORT,
  formatYearMonthKey,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { AnimatedModal } from '../components/AnimatedModal';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { BillVectorIcon } from '../components/VectorIcons';

const PRESETS: Array<{ name: string; icon: BillIconType; amount: string }> = [
  { name: 'netflix', icon: 'tv', amount: '549' },
  { name: 'spotify', icon: 'music', amount: '149' },
  { name: 'electricity', icon: 'bolt', amount: '1850' },
  { name: 'water', icon: 'droplet', amount: '420' },
  { name: 'wifi', icon: 'wifi', amount: '1299' },
  { name: 'rent', icon: 'home', amount: '4500' },
];

const ICON_OPTIONS: Array<{ type: BillIconType; label: string }> = [
  { type: 'bolt', label: 'power' },
  { type: 'droplet', label: 'water' },
  { type: 'wifi', label: 'wifi' },
  { type: 'home', label: 'rent' },
  { type: 'tv', label: 'stream' },
  { type: 'music', label: 'music' },
  { type: 'other', label: 'other' },
];

export default function BillsScreen() {
  const {
    bills,
    selectedYear,
    selectedMonth,
    setMonthYearFilter,
    toggleBillPaidForMonth,
    saveBill,
    deleteBill,
    goBack,
    goHome,
  } = useApp();

  const activeMonth0 = selectedMonth ?? 7; // Default August (7)
  const activeMonthShort = MONTH_SHORT[activeMonth0] || 'AUG';
  const activeYearMonthKey = formatYearMonthKey(selectedYear, activeMonth0);

  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payBillTarget, setPayBillTarget] = useState<Bill | null>(null);
  const [payBillNote, setPayBillNote] = useState('');
  const [unmarkBillTarget, setUnmarkBillTarget] = useState<Bill | null>(null);

  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [hasDueDate, setHasDueDate] = useState(true);
  const [billDueDay, setBillDueDay] = useState('25');
  const [billIcon, setBillIcon] = useState<BillIconType>('bolt');
  const [billNotes, setBillNotes] = useState('');

  const openEditBillModal = (bill: Bill) => {
    setEditingBill(bill);
    setBillName(bill.bill_name);
    setBillAmount(String(bill.amount || ''));
    const hasDue = bill.has_due_date !== false && bill.due_day !== null && bill.due_day > 0;
    setHasDueDate(hasDue);
    setBillDueDay(String(bill.due_day || 25));
    setBillIcon(bill.icon_type || 'other');
    setBillNotes(bill.notes || '');
    setModalVisible(true);
  };

  const openAddBillModal = () => {
    setEditingBill(null);
    setBillName('');
    setBillAmount('');
    setHasDueDate(true);
    setBillDueDay('25');
    setBillIcon('other');
    setBillNotes('');
    setModalVisible(true);
  };

  const handleSaveBill = async () => {
    if (!billName.trim()) return;
    await saveBill({
      bill_id: editingBill?.bill_id,
      bill_name: billName.trim(),
      icon_type: billIcon,
      amount: parseFloat(billAmount) || 0,
      due_day: hasDueDate ? parseInt(billDueDay, 10) || 25 : null,
      has_due_date: hasDueDate,
      notes: billNotes.trim(),
    });
    setModalVisible(false);
  };

  const handleDeleteBill = async () => {
    if (!editingBill) return;
    await deleteBill(editingBill.bill_id);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        title="BILLS"
        centerTitle
        showClock={false}
        onBackPress={goBack}
        onHomePress={goHome}
        rightElement={
          <TouchableOpacity
            style={styles.monthFilterBtn}
            onPress={() => setMonthModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.monthFilterText}>
              [{activeMonthShort} {selectedYear}]
            </Text>
          </TouchableOpacity>
        }
      />

      {/* 2. BODY: Minimalist Clickable Bill Rows + Explicit 'paid' Button */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {bills.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No monthly bills added yet.</Text>
          </View>
        ) : (
          bills.map((bill) => {
            const isPaidThisMonth = (bill.paid_months || []).includes(activeYearMonthKey);
            const hasDue =
              bill.has_due_date !== false &&
              bill.due_day !== null &&
              bill.due_day > 0;
            const dateText = hasDue
              ? `${activeMonthShort} ${bill.due_day}`
              : 'ANYTIME';

            return (
              <TouchableOpacity
                key={bill.bill_id}
                style={styles.billRow}
                onPress={() => openEditBillModal(bill)}
                activeOpacity={0.7}
              >
                <View style={styles.billLeft}>
                  <Text
                    style={[
                      styles.dateLabel,
                      !hasDue && styles.anytimeDateLabel,
                      isPaidThisMonth && styles.paidTextFaded,
                    ]}
                  >
                    {dateText}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameIconRow}>
                      <Text
                        style={[
                          styles.nameLabel,
                          isPaidThisMonth && styles.paidTextStrike,
                        ]}
                      >
                        {bill.bill_name}
                      </Text>
                      <View style={styles.iconWrap}>
                        <BillVectorIcon type={bill.icon_type} size={17} />
                      </View>
                    </View>
                    {bill.notes ? (
                      <Text style={styles.billNoteSub} numberOfLines={1}>
                        {bill.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paidActionBtn,
                    isPaidThisMonth && styles.paidActionBtnActive,
                  ]}
                  onPress={() => {
                    if (isPaidThisMonth) {
                      setUnmarkBillTarget(bill);
                    } else {
                      setPayBillNote(bill.notes || '');
                      setPayBillTarget(bill);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.paidActionText}>paid</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 3. FOOTER: Large Yellow 'add' Button */}
      <View style={styles.footer}>
        <NeoButton
          label="add"
          variant="offset"
          backgroundColor={COLORS.utangYellow}
          onPress={openAddBillModal}
          style={styles.addBtn}
          textStyle={styles.addBtnText}
        />
      </View>

      {/* Month & Year Picker Modal */}
      <MonthYearPickerModal
        visible={monthModalVisible}
        selectedYear={selectedYear}
        selectedMonth={activeMonth0}
        allowAllOption={false}
        onSelect={(y, m) => setMonthYearFilter(y, m ?? 7)}
        onClose={() => setMonthModalVisible(false)}
      />

      {/* Blurred-Backdrop View / Edit / Add Bill Modal */}
      <AnimatedModal
        visible={modalVisible}
        title={editingBill ? `BILL: ${editingBill.bill_name.toUpperCase()}` : 'ADD MONTHLY BILL'}
        subtitle={
          editingBill
            ? `Cycle: ${activeMonthShort} ${selectedYear}`
            : 'Add a utility, subscription, or custom bill'
        }
        onClose={() => setModalVisible(false)}
      >
        {!editingBill && (
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={[
                  styles.presetPill,
                  billName === p.name && styles.presetPillActive,
                ]}
                onPress={() => {
                  setBillName(p.name);
                  setBillIcon(p.icon);
                  setBillAmount(p.amount);
                }}
              >
                <Text style={styles.presetPillText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>NAME:</Text>
          <TextInput
            value={billName}
            onChangeText={setBillName}
            style={styles.fieldInput}
            placeholder="e.g. netflix, gym, association"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>AMOUNT:</Text>
          <TextInput
            value={billAmount}
            onChangeText={setBillAmount}
            keyboardType="numeric"
            style={styles.fieldInput}
            placeholder="0"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* DUE DAY vs NO DUE DATE (ANYTIME OF THE MONTH) */}
        <View style={styles.dueToggleRow}>
          <TouchableOpacity
            style={[
              styles.dueModeChip,
              hasDueDate && styles.dueModeChipActive,
            ]}
            onPress={() => setHasDueDate(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dueModeChipText}>specific due day</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dueModeChip,
              !hasDueDate && styles.dueModeChipActive,
            ]}
            onPress={() => setHasDueDate(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.dueModeChipText}>no due date (anytime)</Text>
          </TouchableOpacity>
        </View>

        {hasDueDate ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>DUE DAY (1-31):</Text>
            <TextInput
              value={billDueDay}
              onChangeText={setBillDueDay}
              keyboardType="numeric"
              style={styles.fieldInput}
              placeholder="25"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        ) : (
          <View style={styles.anytimeBanner}>
            <Text style={styles.anytimeBannerText}>
              Can be paid anytime during the month (no fixed due day)
            </Text>
          </View>
        )}

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>NOTE:</Text>
          <TextInput
            value={billNotes}
            onChangeText={setBillNotes}
            style={styles.fieldInput}
            placeholder="Optional note (e.g. Account #)"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.iconSelectRow}>
          {ICON_OPTIONS.map((opt) => {
            const active = billIcon === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[styles.iconOptionBtn, active && styles.iconOptionBtnActive]}
                onPress={() => setBillIcon(opt.type)}
              >
                <BillVectorIcon type={opt.type} size={16} />
                <Text style={styles.iconOptionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.modalBtnRow}>
          {editingBill && (
            <View style={{ width: 105 }}>
              <NeoButton
                label="delete"
                variant="offset"
                backgroundColor={COLORS.logoutRed}
                textColor="#FFFFFF"
                onPress={handleDeleteBill}
                style={{ minHeight: 48, paddingHorizontal: 10 }}
                textStyle={{ fontSize: 15 }}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <NeoButton
              label={editingBill ? 'save' : 'add'}
              variant="offset"
              backgroundColor={COLORS.utangYellow}
              onPress={handleSaveBill}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 16 }}
            />
          </View>
        </View>
      </AnimatedModal>

      {/* Mark Bill as Paid Modal (With Optional Payment Note) */}
      <AnimatedModal
        visible={!!payBillTarget}
        title={payBillTarget ? `PAY: ${payBillTarget.bill_name.toUpperCase()}` : 'PAY BILL'}
        subtitle={`Amount: ${payBillTarget?.amount || 0} (${activeMonthShort} ${selectedYear})`}
        onClose={() => setPayBillTarget(null)}
      >
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>NOTE:</Text>
          <TextInput
            value={payBillNote}
            onChangeText={setPayBillNote}
            style={styles.fieldInput}
            placeholder="Optional payment note (e.g. GCash ref)"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.modalBtnRow}>
          <View style={{ flex: 1 }}>
            <NeoButton
              label="cancel"
              variant="flat"
              backgroundColor={COLORS.surfaceSoft}
              onPress={() => setPayBillTarget(null)}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 15 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <NeoButton
              label="mark paid"
              variant="offset"
              backgroundColor={COLORS.markPaidLime}
              onPress={async () => {
                if (!payBillTarget) return;
                const bId = payBillTarget.bill_id;
                const noteText = payBillNote;
                setPayBillTarget(null);
                setPayBillNote('');
                await toggleBillPaidForMonth(bId, activeYearMonthKey, noteText);
              }}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 15 }}
            />
          </View>
        </View>
      </AnimatedModal>

      {/* Confirmation Pop-up Modal to Unmark Paid Bill */}
      <AnimatedModal
        visible={!!unmarkBillTarget}
        title="UNMARK BILL AS PAID?"
        subtitle={
          unmarkBillTarget
            ? `Are you sure you want to unmark ${unmarkBillTarget.bill_name.toUpperCase()} (${activeMonthShort} ${selectedYear}) as paid?`
            : ''
        }
        onClose={() => setUnmarkBillTarget(null)}
      >
        <View style={styles.modalBtnRow}>
          <View style={{ flex: 1 }}>
            <NeoButton
              label="cancel"
              variant="flat"
              backgroundColor={COLORS.surfaceSoft}
              onPress={() => setUnmarkBillTarget(null)}
              style={{ minHeight: 48 }}
              textStyle={{ fontSize: 15 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <NeoButton
              label="yes, unmark"
              variant="offset"
              backgroundColor={COLORS.utangYellow}
              onPress={async () => {
                if (!unmarkBillTarget) return;
                const bId = unmarkBillTarget.bill_id;
                setUnmarkBillTarget(null);
                await toggleBillPaidForMonth(bId, activeYearMonthKey);
              }}
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  monthFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  monthFilterText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
    marginTop: 18,
  },
  listContent: {
    paddingBottom: 20,
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1.25,
    borderBottomColor: COLORS.borderLight,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dateLabel: {
    fontFamily: FONTS.regular,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 78,
  },
  anytimeDateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  nameIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameLabel: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  billNoteSub: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paidTextFaded: {
    color: COLORS.textMuted,
  },
  paidTextStrike: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  iconWrap: {
    marginLeft: 8,
  },
  paidActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  paidActionBtnActive: {
    backgroundColor: COLORS.markPaidLime,
  },
  paidActionText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  addBtn: {
    minHeight: 62,
  },
  addBtnText: {
    fontSize: 22,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  presetPillActive: {
    backgroundColor: COLORS.utangYellow,
  },
  presetPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    width: 105,
  },
  fieldInput: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  dueToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dueModeChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
  },
  dueModeChipActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellow,
  },
  dueModeChipText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  anytimeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
    marginBottom: 10,
  },
  anytimeBannerText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  iconSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  iconOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
  },
  iconOptionBtnActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellowSoft,
  },
  iconOptionLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
});
