import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { PaymentHistoryEntry } from '../types';
import {
  COLORS,
  FONTS,
  MONTH_NAMES,
  MONTH_SHORT,
  formatYearMonthKey,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { AnimatedModal } from '../components/AnimatedModal';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { NeoButton } from '../components/NeoButton';

export default function HistoryScreen() {
  const {
    history,
    selectedYear,
    selectedMonth,
    setMonthYearFilter,
    undoHistoryPayment,
    goBack,
    goHome,
  } = useApp();

  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PaymentHistoryEntry | null>(null);

  const filterLabel =
    selectedMonth === null
      ? 'ALL'
      : `${MONTH_SHORT[selectedMonth]} ${selectedYear}`;

  const groupedHistory = useMemo(() => {
    const filtered = history.filter((h) => {
      if (selectedMonth === null) return true;
      const targetKey = formatYearMonthKey(selectedYear, selectedMonth);
      if (h.paid_month_key) {
        return h.paid_month_key === targetKey;
      }
      return h.recorded_at.slice(0, 7) === targetKey;
    });

    const groups: Record<string, PaymentHistoryEntry[]> = {};
    filtered.forEach((entry) => {
      const ym = entry.paid_month_key || entry.recorded_at.slice(0, 7);
      const parts = ym.split('-');
      const year = parseInt(parts[0], 10) || 2026;
      const mIdx = parseInt(parts[1], 10) - 1;
      const groupTitle =
        !isNaN(mIdx) && mIdx >= 0 && mIdx < 12
          ? `${MONTH_NAMES[mIdx]} ${year}`
          : `AUGUST ${year}`;
      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }
      groups[groupTitle].push(entry);
    });
    return groups;
  }, [history, selectedYear, selectedMonth]);

  const groupKeys = Object.keys(groupedHistory);

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        title="HISTORY"
        subtitle="AUGUST 2  11:15 pm"
        centerTitle
        showClock={false}
        onBackPress={goBack}
        onHomePress={goHome}
        rightElement={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setMonthModalVisible(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.filterBtnText}>[{filterLabel}]</Text>
          </TouchableOpacity>
        }
      />

      {/* 2. BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupKeys.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No payment records for {filterLabel}</Text>
            <TouchableOpacity
              style={styles.showAllBtn}
              onPress={() => setMonthYearFilter(selectedYear, null)}
            >
              <Text style={styles.showAllText}>show all history</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupKeys.map((monthHeading) => (
            <View key={monthHeading} style={styles.monthSection}>
              <Text style={styles.monthHeader}>{monthHeading}</Text>
              {groupedHistory[monthHeading].map((item) => {
                const dayNum = new Date(item.recorded_at).getDate() || 25;
                return (
                  <TouchableOpacity
                    key={item.history_id}
                    style={styles.historyRow}
                    onPress={() => setSelectedEntry(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dayText}>{dayNum}</Text>
                    <Text style={styles.nameText}>{item.creditor_name}</Text>
                    <Text style={styles.paidTag}>paid</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Month & Year Picker Modal */}
      <MonthYearPickerModal
        visible={monthModalVisible}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        allowAllOption
        onSelect={setMonthYearFilter}
        onClose={() => setMonthModalVisible(false)}
      />

      {/* Payment Receipt & Undo Confirmation Modal */}
      <AnimatedModal
        visible={!!selectedEntry}
        title="UNMARK AS PAID?"
        subtitle={
          selectedEntry
            ? `Are you sure you want to unmark ${selectedEntry.creditor_name} as paid and restore it to your active list?`
            : ''
        }
        onClose={() => setSelectedEntry(null)}
      >
        {selectedEntry && (
          <View style={styles.receiptBox}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>AMOUNT PAID</Text>
              <Text style={styles.receiptVal}>{selectedEntry.amount_paid}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>STATUS</Text>
              <Text style={styles.receiptVal}>PAID</Text>
            </View>
            {selectedEntry.note ? (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>NOTE</Text>
                <Text style={styles.receiptVal}>{selectedEntry.note}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <View style={{ flex: 1 }}>
                <NeoButton
                  label="cancel"
                  variant="flat"
                  backgroundColor={COLORS.surfaceSoft}
                  onPress={() => setSelectedEntry(null)}
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
                    await undoHistoryPayment(selectedEntry.history_id);
                    setSelectedEntry(null);
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
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
    marginTop: 18,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayText: {
    fontFamily: FONTS.regular,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 38,
  },
  nameText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginRight: 10,
    letterSpacing: 0.4,
  },
  paidTag: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  showAllBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  showAllText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  receiptBox: {
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  receiptLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  receiptVal: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
