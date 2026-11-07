import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, MONTH_NAMES } from '../theme/colors';
import { ArrowLeftIcon, HomeIcon } from './VectorIcons';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  centerTitle?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  showClock?: boolean;
  onHomePress?: () => void;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  centerTitle = false,
  showHome = true,
  showBack = true,
  showClock = true,
  onHomePress,
  onBackPress,
  rightElement,
}) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const h12 = hours % 12 || 12;
  const timeStr = `${h12}:${mins} ${ampm}`;
  const dateStr = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`;

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && onBackPress && (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.iconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeftIcon size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        {showHome && onHomePress && (
          <TouchableOpacity
            onPress={onHomePress}
            style={styles.iconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go to home"
          >
            <HomeIcon size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

        {!centerTitle && title ? (
          <View style={styles.titleBlock}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>
        ) : null}
      </View>

      {centerTitle && title ? (
        <View style={styles.centerBlock} pointerEvents="none">
          <Text style={styles.centerTitleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.rightRow}>
        {rightElement ? (
          rightElement
        ) : showClock ? (
          <View style={styles.clockBlock}>
            <Text style={styles.timeText}>{timeStr}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 54,
    position: 'relative',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginLeft: 4,
  },
  titleText: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  centerBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  subtitleText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
    marginTop: 1,
  },
  rightRow: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 2,
  },
  clockBlock: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dateText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
});
