import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

interface MonthlyGridSelectorProps {
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}

const ROWS: Array<Array<number | null>> = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, null, null, null, null],
];

export const MonthlyGridSelector: React.FC<MonthlyGridSelectorProps> = ({
  selectedDay,
  onSelectDay,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topBand} />
      {ROWS.map((row, rIdx) => (
        <View
          key={`r-${rIdx}`}
          style={[styles.row, rIdx === ROWS.length - 1 && { borderBottomWidth: 0 }]}
        >
          {row.map((day, cIdx) => {
            const isLastCol = cIdx === 6;
            if (day === null) {
              return (
                <View
                  key={`empty-${rIdx}-${cIdx}`}
                  style={[styles.cell, isLastCol && { borderRightWidth: 0 }]}
                />
              );
            }
            const active = selectedDay === day;
            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.cell,
                  isLastCol && { borderRightWidth: 0 },
                  active && styles.cellActive,
                ]}
                onPress={() => onSelectDay(day)}
                activeOpacity={0.75}
              >
                <Text style={[styles.cellText, active && styles.cellTextActive]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default MonthlyGridSelector;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    marginVertical: 8,
  },
  topBand: {
    height: 22,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1.25,
    borderBottomColor: COLORS.border,
  },
  cell: {
    flex: 1,
    height: 36,
    borderRightWidth: 1.25,
    borderRightColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  cellActive: {
    backgroundColor: COLORS.utangYellow,
  },
  cellText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cellTextActive: {
    fontWeight: '900',
  },
});
