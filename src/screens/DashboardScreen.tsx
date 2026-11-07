import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
  COLORS,
  FONTS,
  MONTH_NAMES,
  MONTH_SHORT,
  formatYearMonthKey,
} from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { DonutChart, DonutSlice } from '../components/DonutChart';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { SortArrowIcon } from '../components/VectorIcons';

const CHART_PALETTE = [
  COLORS.chartSkyroBlue,
  COLORS.chartAteAnaPurple,
  COLORS.chartKhorpilAmber,
  COLORS.chartShopeeYellow,
  COLORS.chartVinceTeal,
];

export default function DashboardScreen() {
  const {
    loans,
    selectedYear,
    selectedMonth,
    setMonthYearFilter,
    navigate,
    goBack,
    goHome,
  } = useApp();

  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [sortLatestAsc, setSortLatestAsc] = useState(false);

  const centerTitle =
    selectedMonth === null
      ? 'ALL'
      : MONTH_NAMES[selectedMonth] || 'AUGUST';

  const centerSubtitle =
    selectedMonth === null || selectedYear === 2026 ? undefined : String(selectedYear);

  const { slices, filteredLoans } = useMemo(() => {
    const activeLoans = loans.filter((l) => !l.is_deleted && l.status === 'UNPAID');
    const targetYm =
      selectedMonth !== null ? formatYearMonthKey(selectedYear, selectedMonth) : null;

    const sliceList: DonutSlice[] = [];
    let colorIdx = 0;

    activeLoans.forEach((loan) => {
      if (targetYm !== null) {
        if (!loan.has_due_date) return;
        const inst = loan.due_dates_list?.find(
          (d) => d.status === 'UNPAID' && d.due_date.slice(0, 7) === targetYm
        );
        if (inst) {
          sliceList.push({
            label: loan.creditor_name,
            amount: inst.due_amount,
            color: CHART_PALETTE[colorIdx % CHART_PALETTE.length],
          });
          colorIdx++;
        } else if (
          (!loan.due_dates_list || loan.due_dates_list.length === 0) &&
          loan.due_date?.slice(0, 7) === targetYm
        ) {
          sliceList.push({
            label: loan.creditor_name,
            amount: loan.amount,
            color: CHART_PALETTE[colorIdx % CHART_PALETTE.length],
          });
          colorIdx++;
        }
      } else {
        sliceList.push({
          label: loan.creditor_name,
          amount: loan.amount,
          color: CHART_PALETTE[colorIdx % CHART_PALETTE.length],
        });
        colorIdx++;
      }
    });

    const list = [...activeLoans].sort((a, b) => {
      return sortLatestAsc
        ? a.creditor_name.localeCompare(b.creditor_name)
        : b.amount - a.amount;
    });

    return { slices: sliceList, filteredLoans: list };
  }, [loans, selectedYear, selectedMonth, sortLatestAsc]);

  const dateFilterLabel =
    selectedMonth === null
      ? 'DATE:ALL'
      : `DATE:${MONTH_SHORT[selectedMonth]} ${selectedYear}`;

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        title="DASHBOARD"
        onBackPress={goBack}
        onHomePress={goHome}
      />

      {/* 2. BODY & 3. FOOTER (Scrollable Wireframe View) */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.utangOutlineTitle}>UTANG</Text>

        <DonutChart
          slices={slices}
          centerTitle={centerTitle}
          centerSubtitle={centerSubtitle}
          onPressCenter={() => setMonthModalVisible(true)}
        />

        <View style={styles.allUtangSection}>
          <Text style={styles.allUtangHeader}>All Utang:</Text>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.sortTouch}
              onPress={() => setSortLatestAsc((p) => !p)}
              activeOpacity={0.7}
            >
              <Text style={styles.controlText}>LATEST</Text>
              <SortArrowIcon size={12} ascending={sortLatestAsc} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortTouch}
              onPress={() => setMonthModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.controlText}>{dateFilterLabel}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.entityStack}>
            {filteredLoans.map((loan) => (
              <TouchableOpacity
                key={loan.loan_id}
                style={styles.entityRow}
                onPress={() => {
                  if (loan.has_due_date) {
                    navigate('VIEW_LOAN_DUE', { selectedLoanId: loan.loan_id });
                  } else {
                    navigate('VIEW_LOAN_NO_DUE', { selectedLoanId: loan.loan_id });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.entityName}>{loan.creditor_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  utangOutlineTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  allUtangSection: {
    marginTop: 14,
  },
  allUtangHeader: {
    fontFamily: FONTS.regular,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  sortTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  controlText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  entityStack: {
    gap: 6,
  },
  entityRow: {
    paddingVertical: 4,
  },
  entityName: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
});
