import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WeekdayPill } from '../types';
import { COLORS, FONTS } from '../theme/colors';

interface WeeklyPillSelectorProps {
  selectedDay: WeekdayPill | null;
  onSelectDay: (day: WeekdayPill) => void;
}

const ROWS: WeekdayPill[][] = [
  ['mon', 'tues', 'wed'],
  ['thur', 'fri', 'sat'],
  ['sun'],
];

export const WeeklyPillSelector: React.FC<WeeklyPillSelectorProps> = ({
  selectedDay,
  onSelectDay,
}) => {
  return (
    <View style={styles.container}>
      {ROWS.map((row, rIdx) => (
        <View key={`row-${rIdx}`} style={styles.row}>
          {row.map((day) => {
            const active = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => onSelectDay(day)}
                activeOpacity={0.75}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
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

export default WeeklyPillSelector;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 10,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  pill: {
    minWidth: 78,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.utangYellow,
  },
  pillText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pillTextActive: {
    color: COLORS.textPrimary,
  },
});
