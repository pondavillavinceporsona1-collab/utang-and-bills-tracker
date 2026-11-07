import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  ScrollView,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Loan, TermType } from '../types';
import {
  COLORS,
  FONTS,
  MONTH_NAMES,
  MONTH_SHORT,
  formatYearMonthKey,
} from '../theme/colors';
import { NeoButton } from '../components/NeoButton';
import { MonthYearPickerModal } from '../components/MonthYearPickerModal';
import { AnimatedModal } from '../components/AnimatedModal';
import {
  ArrowLeftIcon,
  HomeIcon,
  SortArrowIcon,
} from '../components/VectorIcons';

type UtangCategory =
  | 'DEADLINES'
  | 'ALL_UTANG'
  | 'DUE_DATES'
  | 'NO_DUE_DATE'
  | 'TERMS';

type TermFilterOption = 'ALL' | TermType;

interface DisplayLoanRow {
  loan: Loan;
  leftLabel: string;
  isSmallLeftLabel: boolean;
  sortKey: number;
}

const CATEGORY_OPTIONS: Array<{
  id: UtangCategory;
  label: string;
  desc: string;
}> = [
  {
    id: 'DEADLINES',
    label: 'DEADLINES',
    desc: 'Monthly deadlines + open loans at the bottom',
  },
  {
    id: 'ALL_UTANG',
    label: 'ALL UTANG',
    desc: 'List all active unpaid utangs across all dates',
  },
  {
    id: 'DUE_DATES',
    label: 'DUE DATES',
    desc: 'Strictly utangs with scheduled due dates in the month',
  },
  {
    id: 'NO_DUE_DATE',
    label: 'NO DUE DATE',
    desc: 'Strictly open-ended utangs without a due date',
  },
  {
    id: 'TERMS',
    label: 'TERMS',
    desc: 'Filter utangs by payment term (Monthly, Weekly, One-time)',
  },
];

const TERM_FILTER_OPTIONS: Array<{ id: TermFilterOption; label: string }> = [
  { id: 'ALL', label: 'ALL TERMS' },
  { id: 'MONTHLY', label: 'MONTHLY' },
  { id: 'WEEKLY', label: 'WEEKLY' },
  { id: 'NONE', label: 'ONE-TIME' },
];

/**
 * Spring-animated 3D double-bordered pill button for [JANUARY] and [DEADLINES]
 */
function AnimatedFilterPill({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const translateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pillBtnWrap,
        style,
        Platform.OS === 'web'
          ? ({ cursor: 'pointer', userSelect: 'none' } as any)
          : null,
      ]}
    >
      <View pointerEvents="none" style={styles.pillBtnOffset} />
      <Animated.View
        style={[
          styles.pillBtnFace,
          {
            transform: [{ translateX }, { translateY }, { scale }],
          },
        ]}
      >
        <Text selectable={false} style={styles.pillBtnText} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Spring-animated 3D circular sort button with smooth 180deg arrow rotation
 */
function AnimatedSortCircle({
  ascending,
  onPress,
}: {
  ascending: boolean;
  onPress: () => void;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(ascending ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: ascending ? 0 : 1,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [ascending, rotateAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const translateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel="Sort list"
      style={[
        styles.sortBtnWrap,
        Platform.OS === 'web'
          ? ({ cursor: 'pointer', userSelect: 'none' } as any)
          : null,
      ]}
    >
      <View pointerEvents="none" style={styles.sortBtnOffset} />
      <Animated.View
        style={[
          styles.sortBtnFace,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <SortArrowIcon size={17} ascending />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function LoanListScreen() {
  const {
    loans,
    selectedYear,
    selectedMonth,
    setMonthYearFilter,
    navigate,
    goBack,
    goHome,
  } = useApp();

  const [category, setCategory] = useState<UtangCategory>('DEADLINES');
  const [termFilter, setTermFilter] = useState<TermFilterOption>('ALL');

  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [termModalVisible, setTermModalVisible] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  // Live header clock ('11:15 pm' / 'AUGUST 2')
  const [clockTime, setClockTime] = useState('11:15 pm');
  const [clockDate, setClockDate] = useState('AUGUST 2');

  // Custom right scrollbar metrics
  const [scrollMetrics, setScrollMetrics] = useState({
    contentHeight: 1,
    layoutHeight: 1,
    offsetY: 0,
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      setClockTime(`${hours}:${mins} ${ampm}`);
      setClockDate(`${MONTH_NAMES[now.getMonth()]} ${now.getDate()}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  // Ensure selectedMonth is never null when inside DEADLINES or DUE_DATES
  const activeMonth0 = selectedMonth ?? 7; // Default August (index 7)

  useEffect(() => {
    if (
      (category === 'DEADLINES' || category === 'DUE_DATES') &&
      selectedMonth === null
    ) {
      setMonthYearFilter(selectedYear, 7);
    }
  }, [category, selectedMonth, selectedYear, setMonthYearFilter]);

  // Context-aware Left Button Label based on Category
  const leftButtonLabel = useMemo(() => {
    if (category === 'DEADLINES' || category === 'DUE_DATES') {
      const mName = MONTH_NAMES[activeMonth0] || 'AUGUST';
      return selectedYear === 2026 ? mName : `${mName.slice(0, 3)} ${selectedYear}`;
    }
    if (category === 'ALL_UTANG') {
      return 'ALL DATES';
    }
    if (category === 'NO_DUE_DATE') {
      return 'UNDATED';
    }
    // category === 'TERMS'
    const found = TERM_FILTER_OPTIONS.find((t) => t.id === termFilter);
    return found ? found.label : 'ALL TERMS';
  }, [category, activeMonth0, selectedYear, termFilter]);

  const handleLeftButtonPress = () => {
    if (category === 'DEADLINES' || category === 'DUE_DATES') {
      setMonthModalVisible(true);
      return;
    }
    if (category === 'ALL_UTANG') {
      // Clicking [ALL DATES] when in ALL UTANG lets you pick a specific month & switch to DEADLINES
      setMonthModalVisible(true);
      return;
    }
    if (category === 'TERMS') {
      setTermModalVisible(true);
      return;
    }
    // In NO_DUE_DATE mode, clicking [UNDATED] opens the category selector
    setCategoryModalVisible(true);
  };

  const categoryButtonLabel = useMemo(() => {
    const found = CATEGORY_OPTIONS.find((c) => c.id === category);
    return found ? found.label : 'DEADLINES';
  }, [category]);

  const rows = useMemo<DisplayLoanRow[]>(() => {
    const activeLoans = loans.filter((l) => !l.is_deleted && l.status === 'UNPAID');
    const targetYm = formatYearMonthKey(selectedYear, activeMonth0);

    // 1. DEADLINES or DUE_DATES mode
    if (category === 'DEADLINES' || category === 'DUE_DATES') {
      const datedRows: DisplayLoanRow[] = [];
      const undatedLoans: Loan[] = [];

      activeLoans.forEach((loan) => {
        if (!loan.has_due_date) {
          if (category === 'DEADLINES') {
            undatedLoans.push(loan);
          }
          return;
        }

        const matchingInstallment = loan.due_dates_list?.find(
          (d) => d.status === 'UNPAID' && d.due_date.slice(0, 7) === targetYm
        );

        if (matchingInstallment) {
          const dayNum = parseInt(matchingInstallment.due_date.split('-')[2], 10);
          datedRows.push({
            loan,
            leftLabel: String(dayNum),
            isSmallLeftLabel: false,
            sortKey: dayNum,
          });
        } else if (
          (!loan.due_dates_list || loan.due_dates_list.length === 0) &&
          loan.due_date &&
          loan.due_date.slice(0, 7) === targetYm
        ) {
          const dayNum = parseInt(loan.due_date.split('-')[2], 10);
          datedRows.push({
            loan,
            leftLabel: String(dayNum),
            isSmallLeftLabel: false,
            sortKey: dayNum,
          });
        }
      });

      datedRows.sort((a, b) =>
        sortAsc ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
      );

      // In DEADLINES mode, append undated loans at the bottom:
      // First undated loan shows 'no due date', subsequent undated loans show '----'
      const undatedRows: DisplayLoanRow[] = undatedLoans.map((loan, idx) => ({
        loan,
        leftLabel: idx === 0 ? 'no due date' : '----',
        isSmallLeftLabel: idx === 0,
        sortKey: 999 + idx,
      }));

      return [...datedRows, ...undatedRows];
    }

    // 2. NO_DUE_DATE mode
    if (category === 'NO_DUE_DATE') {
      const onlyUndated = activeLoans.filter((l) => !l.has_due_date);
      const sorted = [...onlyUndated].sort((a, b) =>
        sortAsc
          ? a.creditor_name.localeCompare(b.creditor_name)
          : b.creditor_name.localeCompare(a.creditor_name)
      );
      return sorted.map((loan, idx) => ({
        loan,
        leftLabel: idx === 0 ? 'no due date' : '----',
        isSmallLeftLabel: idx === 0,
        sortKey: idx,
      }));
    }

    // 3. ALL_UTANG mode
    if (category === 'ALL_UTANG') {
      const dated: DisplayLoanRow[] = [];
      const undated: Loan[] = [];

      activeLoans.forEach((loan) => {
        if (!loan.has_due_date) {
          undated.push(loan);
          return;
        }
        const nextDue =
          loan.due_dates_list?.find((d) => d.status === 'UNPAID')?.due_date ||
          loan.due_date;
        if (nextDue) {
          const parts = nextDue.split('-');
          const mIdx = parseInt(parts[1], 10) - 1;
          const dayNum = parseInt(parts[2], 10);
          const mShort = MONTH_SHORT[mIdx] || 'AUG';
          dated.push({
            loan,
            leftLabel: `${mShort} ${dayNum}`,
            isSmallLeftLabel: true,
            sortKey: parseInt(parts[0], 10) * 10000 + (mIdx + 1) * 100 + dayNum,
          });
        }
      });

      dated.sort((a, b) =>
        sortAsc ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
      );

      const undatedRows: DisplayLoanRow[] = undated.map((loan, idx) => ({
        loan,
        leftLabel: idx === 0 ? 'no due date' : '----',
        isSmallLeftLabel: idx === 0,
        sortKey: 99999999 + idx,
      }));

      return [...dated, ...undatedRows];
    }

    // 4. TERMS mode
    const filteredByTerm = activeLoans.filter((l) =>
      termFilter === 'ALL' ? true : l.term_type === termFilter
    );

    const list: DisplayLoanRow[] = filteredByTerm.map((loan, idx) => {
      const termLabel =
        loan.term_type === 'MONTHLY'
          ? 'monthly'
          : loan.term_type === 'WEEKLY'
          ? 'weekly'
          : loan.has_due_date
          ? 'one-time'
          : 'no due date';
      return {
        loan,
        leftLabel: termLabel,
        isSmallLeftLabel: true,
        sortKey:
          loan.term_type === 'WEEKLY'
            ? 1
            : loan.term_type === 'MONTHLY'
            ? 2
            : 3 + idx * 0.01,
      };
    });

    list.sort((a, b) =>
      sortAsc ? a.sortKey - b.sortKey : b.sortKey - a.sortKey
    );

    return list;
  }, [loans, category, selectedYear, activeMonth0, sortAsc, termFilter]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setScrollMetrics({
      contentHeight: Math.max(1, contentSize.height),
      layoutHeight: Math.max(1, layoutMeasurement.height),
      offsetY: Math.max(0, contentOffset.y),
    });
  };

  // Calculate custom right scrollbar thumb height & position
  const trackHeight = Math.max(120, scrollMetrics.layoutHeight - 16);
  const ratio = Math.min(
    1,
    scrollMetrics.layoutHeight / Math.max(1, scrollMetrics.contentHeight)
  );
  const thumbHeight = Math.max(44, trackHeight * ratio);
  const maxScroll = Math.max(
    1,
    scrollMetrics.contentHeight - scrollMetrics.layoutHeight
  );
  const scrollFraction = Math.min(1, Math.max(0, scrollMetrics.offsetY / maxScroll));
  const thumbTop = scrollFraction * Math.max(0, trackHeight - thumbHeight);

  return (
    <View style={styles.container}>
      {/* 1. HEADER: Compact Nav + Giant 'UTANG' + '11:15 pm / AUGUST 2' + Double-Bordered Filter Bar */}
      <View>
        {/* Subtle top navigation buttons */}
        <View style={styles.navIconRow}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.navIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeftIcon size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goHome}
            style={styles.navIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go home"
          >
            <HomeIcon size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Giant Wireframe Title Row: UTANG + 11:15 pm / AUGUST 2 */}
        <View style={styles.titleRow}>
          <Text style={styles.giantTitle}>UTANG</Text>
          <View style={styles.clockBlock}>
            <Text style={styles.clockTimeText}>{clockTime}</Text>
            <Text style={styles.clockDateText}>{clockDate}</Text>
          </View>
        </View>

        {/* Double-Bordered Animated Filter Bar: [AUGUST] [DEADLINES] (↓) */}
        <View style={styles.filterBar}>
          {/* Left Context-Aware Animated Filter Button */}
          <AnimatedFilterPill
            label={leftButtonLabel}
            onPress={handleLeftButtonPress}
          />

          {/* Middle Animated Category Dropdown Button */}
          <AnimatedFilterPill
            label={categoryButtonLabel}
            onPress={() => setCategoryModalVisible(true)}
            style={{ flex: 1 }}
          />

          {/* Right Animated Green Sort Arrow Circle */}
          <AnimatedSortCircle
            ascending={sortAsc}
            onPress={() => setSortAsc((prev) => !prev)}
          />
        </View>
      </View>

      {/* 2. BODY: Full-Scale Scrollable List + Top/Bottom Fade Masks + Right Scrollbar */}
      <View style={styles.body}>
        {rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              No utangs found for {leftButtonLabel} ({categoryButtonLabel})
            </Text>
          </View>
        ) : (
          <View style={styles.listViewport}>
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onContentSizeChange={(_w, h) =>
                setScrollMetrics((prev) => ({
                  ...prev,
                  contentHeight: Math.max(1, h),
                }))
              }
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setScrollMetrics((prev) => ({
                  ...prev,
                  layoutHeight: Math.max(1, h),
                }));
              }}
            >
              {rows.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.loan.loan_id}-${idx}`}
                  style={[
                    styles.loanRow,
                    Platform.OS === 'web'
                      ? ({ cursor: 'pointer', userSelect: 'none' } as any)
                      : null,
                  ]}
                  onPress={() => {
                    if (item.loan.has_due_date) {
                      navigate('VIEW_LOAN_DUE', {
                        selectedLoanId: item.loan.loan_id,
                      });
                    } else {
                      navigate('VIEW_LOAN_NO_DUE', {
                        selectedLoanId: item.loan.loan_id,
                      });
                    }
                  }}
                  activeOpacity={0.65}
                >
                  <View style={styles.leftColWrap}>
                    <Text
                      selectable={false}
                      style={
                        item.isSmallLeftLabel
                          ? styles.smallLeftLabel
                          : styles.bigDayLabel
                      }
                      numberOfLines={1}
                    >
                      {item.leftLabel}
                    </Text>
                  </View>

                  <Text
                    selectable={false}
                    style={styles.bigNameLabel}
                    numberOfLines={1}
                  >
                    {item.loan.creditor_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Top Edge Smooth Fade Mask (fades only the top-most row like the wireframe) */}
            <View pointerEvents="none" style={styles.topFade1} />
            <View pointerEvents="none" style={styles.topFade2} />
            <View pointerEvents="none" style={styles.topFade3} />

            {/* Bottom Edge Smooth Fade Mask (fades only the bottom-most row like the wireframe) */}
            <View pointerEvents="none" style={styles.bottomFade3} />
            <View pointerEvents="none" style={styles.bottomFade2} />
            <View pointerEvents="none" style={styles.bottomFade1} />

            {/* Wireframe Right-Side Vertical Scrollbar Track & Thumb */}
            <View pointerEvents="none" style={styles.scrollbarTrack}>
              <View
                style={[
                  styles.scrollbarThumb,
                  {
                    height: thumbHeight,
                    transform: [{ translateY: thumbTop }],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* 3. FOOTER: Giant Wireframe Yellow 'add' Button */}
      <View style={styles.footer}>
        <NeoButton
          label="add"
          variant="offset"
          backgroundColor={COLORS.utangYellow}
          onPress={() => navigate('ADD_EDIT_LOAN', { editingLoanId: null })}
          style={styles.giantAddBtn}
          textStyle={styles.giantAddBtnText}
        />
      </View>

      {/* Month & Year Picker Modal (No confusing 'ALL DATES' button inside DEADLINES/DUE_DATES) */}
      <MonthYearPickerModal
        visible={monthModalVisible}
        selectedYear={selectedYear}
        selectedMonth={activeMonth0}
        allowAllOption={false}
        onSelect={(year, month) => {
          setMonthYearFilter(year, month ?? 7);
          if (category === 'ALL_UTANG') {
            setCategory('DEADLINES');
          }
        }}
        onClose={() => setMonthModalVisible(false)}
      />

      {/* Category Dropdown Modal ([DEADLINES] / [ALL UTANG] / [DUE DATES] / [NO DUE DATE] / [TERMS]) */}
      <AnimatedModal
        visible={categoryModalVisible}
        title="VIEW CATEGORY"
        subtitle="Choose how to list and filter your utangs"
        onClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalList}>
          {CATEGORY_OPTIONS.map((opt) => {
            const active = category === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.categoryOptionCard,
                  active && styles.categoryOptionCardActive,
                ]}
                onPress={() => {
                  setCategory(opt.id);
                  setCategoryModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryOptionTitle}>{opt.label}</Text>
                <Text style={styles.categoryOptionDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedModal>

      {/* Term Filter Modal (When Category === 'TERMS' and user clicks the Left Button) */}
      <AnimatedModal
        visible={termModalVisible}
        title="FILTER BY TERM"
        subtitle="Select which payment term to show"
        onClose={() => setTermModalVisible(false)}
      >
        <View style={styles.modalList}>
          {TERM_FILTER_OPTIONS.map((opt) => {
            const active = termFilter === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.categoryOptionCard,
                  active && styles.categoryOptionCardActive,
                ]}
                onPress={() => {
                  setTermFilter(opt.id);
                  setTermModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryOptionTitle}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  navIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  navIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  giantTitle: {
    fontFamily: FONTS.bold,
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
    lineHeight: 48,
  },
  clockBlock: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  clockTimeText: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  clockDateText: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pillBtnWrap: {
    position: 'relative',
    marginBottom: 3,
    marginRight: 3,
  },
  pillBtnOffset: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 9,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  pillBtnFace: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  sortBtnWrap: {
    position: 'relative',
    width: 34,
    height: 34,
    marginBottom: 3,
    marginRight: 3,
  },
  sortBtnOffset: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    borderRadius: 17,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: '#98D85B',
  },
  sortBtnFace: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: '#A8E86B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginVertical: 4,
  },
  listViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 14,
    paddingRight: 16,
  },
  loanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 49,
    paddingVertical: 4,
  },
  leftColWrap: {
    width: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
  },
  bigDayLabel: {
    fontFamily: FONTS.regular,
    fontSize: 32,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  smallLeftLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bigNameLabel: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
    flex: 1,
  },
  // Top 3-step gradient fade overlay (fades only the top edge row like the wireframe)
  topFade1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.68)',
  },
  topFade2: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.42)',
  },
  topFade3: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.18)',
  },
  // Bottom 3-step gradient fade overlay (fades only the bottom edge row like the wireframe)
  bottomFade3: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.18)',
  },
  bottomFade2: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.45)',
  },
  bottomFade1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 14,
    height: 14,
    backgroundColor: 'rgba(250, 249, 245, 0.72)',
  },
  // Wireframe vertical scrollbar on the right edge
  scrollbarTrack: {
    position: 'absolute',
    right: 2,
    top: 8,
    bottom: 8,
    width: 6,
    borderRadius: 3,
    backgroundColor: '#E2E0D8',
    overflow: 'hidden',
  },
  scrollbarThumb: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#76746E',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 6,
  },
  giantAddBtn: {
    minHeight: 94,
  },
  giantAddBtnText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalList: {
    gap: 10,
  },
  categoryOptionCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryOptionCardActive: {
    backgroundColor: COLORS.utangYellow,
  },
  categoryOptionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  categoryOptionDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
