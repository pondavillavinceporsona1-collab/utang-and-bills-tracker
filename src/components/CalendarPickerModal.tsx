import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedModal } from './AnimatedModal';
import { COLORS, FONTS, MONTH_NAMES } from '../theme/colors';
import { ArrowLeftIcon, ChevronRightIcon } from './VectorIcons';

interface CalendarPickerModalProps {
  visible: boolean;
  initialDate: string | null; // YYYY-MM-DD or null
  allowNoDueDate?: boolean;
  title?: string;
  onSelectDate: (dateStr: string | null) => void;
  onClose: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarPickerModal({
  visible,
  initialDate,
  allowNoDueDate = true,
  title = 'SELECT DATE',
  onSelectDate,
  onClose,
}: CalendarPickerModalProps) {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(7); // 0-indexed (7 = August)

  useEffect(() => {
    if (visible && initialDate) {
      const parts = initialDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setYear(y);
          setMonth(m);
        }
      }
    }
  }, [visible, initialDate]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <AnimatedModal visible={visible} title={title} onClose={onClose}>
      {/* Year & Month Switcher */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth} activeOpacity={0.7}>
          <ArrowLeftIcon size={18} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navMonthText}>{MONTH_NAMES[month]}</Text>
          <View style={styles.yearMiniStepper}>
            <TouchableOpacity onPress={() => setYear((y) => y - 1)} style={styles.yearMiniBtn}>
              <Text style={styles.yearMiniBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.navYearText}>{year}</Text>
            <TouchableOpacity onPress={() => setYear((y) => y + 1)} style={styles.yearMiniBtn}>
              <Text style={styles.yearMiniBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth} activeOpacity={0.7}>
          <ChevronRightIcon size={18} />
        </TouchableOpacity>
      </View>

      {/* Weekday Header */}
      <View style={styles.weekHeader}>
        {WEEKDAYS.map((w, idx) => (
          <Text key={idx} style={styles.weekHeaderText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
          }
          const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = initialDate === dateFormatted;

          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => {
                onSelectDate(dateFormatted);
                onClose();
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {allowNoDueDate && (
        <TouchableOpacity
          style={[styles.noDueBtn, initialDate === null && styles.noDueBtnActive]}
          onPress={() => {
            onSelectDate(null);
            onClose();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.noDueBtnText}>NO DUE DATE (OPEN-ENDED)</Text>
        </TouchableOpacity>
      )}
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    alignItems: 'center',
  },
  navMonthText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  yearMiniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  yearMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellowSoft,
  },
  yearMiniBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  navYearText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekHeaderText: {
    width: '13.5%',
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
    marginBottom: 14,
  },
  dayCellEmpty: {
    width: '13.5%',
    aspectRatio: 1,
  },
  dayCell: {
    width: '13.5%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  dayCellSelected: {
    borderColor: COLORS.border,
    borderWidth: 1.75,
    backgroundColor: COLORS.utangYellow,
  },
  dayText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    fontWeight: '900',
  },
  noDueBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
  },
  noDueBtnActive: {
    backgroundColor: COLORS.utangYellow,
  },
  noDueBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
});
