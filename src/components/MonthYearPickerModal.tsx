import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedModal } from './AnimatedModal';
import { COLORS, FONTS, MONTH_SHORT } from '../theme/colors';
import { ArrowLeftIcon, ChevronRightIcon } from './VectorIcons';

interface MonthYearPickerModalProps {
  visible: boolean;
  selectedYear: number;
  selectedMonth: number | null; // 0..11 or null for ALL
  allowAllOption?: boolean;
  onSelect: (year: number, month: number | null) => void;
  onClose: () => void;
}

export function MonthYearPickerModal({
  visible,
  selectedYear,
  selectedMonth,
  allowAllOption = true,
  onSelect,
  onClose,
}: MonthYearPickerModalProps) {
  const [year, setYear] = useState(selectedYear);

  useEffect(() => {
    if (visible) {
      setYear(selectedYear);
    }
  }, [visible, selectedYear]);

  return (
    <AnimatedModal
      visible={visible}
      title="SELECT MONTH & YEAR"
      subtitle="Pick any year and month to filter deadlines"
      onClose={onClose}
    >
      {/* Year Stepper */}
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={styles.yearStepBtn}
          onPress={() => setYear((y) => y - 1)}
          activeOpacity={0.7}
        >
          <ArrowLeftIcon size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{year}</Text>
        </View>

        <TouchableOpacity
          style={styles.yearStepBtn}
          onPress={() => setYear((y) => y + 1)}
          activeOpacity={0.7}
        >
          <ChevronRightIcon size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Quick Year Pills */}
      <View style={styles.quickYearRow}>
        {[2025, 2026, 2027, 2028].map((y) => {
          const active = year === y;
          return (
            <TouchableOpacity
              key={y}
              style={[styles.quickYearPill, active && styles.quickYearPillActive]}
              onPress={() => setYear(y)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickYearText, active && styles.quickYearTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 12-Month Grid */}
      <View style={styles.monthGrid}>
        {MONTH_SHORT.map((mLabel, idx) => {
          const isSelected = selectedYear === year && selectedMonth === idx;
          return (
            <TouchableOpacity
              key={mLabel}
              style={[styles.monthCell, isSelected && styles.monthCellSelected]}
              onPress={() => {
                onSelect(year, idx);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.monthCellText, isSelected && styles.monthCellTextSelected]}>
                {mLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Quick Actions */}
      <View style={styles.footerRow}>
        {allowAllOption && (
          <TouchableOpacity
            style={[
              styles.allBtn,
              selectedMonth === null && styles.allBtnSelected,
            ]}
            onPress={() => {
              onSelect(year, null);
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.allBtnText}>ALL DATES</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => {
            onSelect(2026, 7); // Default August 2026 baseline
            onClose();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.todayBtnText}>AUG 2026</Text>
        </TouchableOpacity>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  yearStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBadge: {
    flex: 1,
    marginHorizontal: 10,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  quickYearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  quickYearPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  quickYearPillActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellow,
  },
  quickYearText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickYearTextActive: {
    color: COLORS.textPrimary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  monthCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  monthCellSelected: {
    backgroundColor: COLORS.utangYellow,
  },
  monthCellText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  monthCellTextSelected: {
    color: COLORS.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  allBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
  },
  allBtnSelected: {
    backgroundColor: COLORS.dashboardCyan,
  },
  allBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  todayBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.markPaidLime,
    alignItems: 'center',
  },
  todayBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
});
