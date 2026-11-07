import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { G, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS } from '../theme/colors';

export interface DonutSlice {
  label: string;
  amount: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerTitle?: string;
  centerSubtitle?: string;
  onPressCenter?: () => void;
}

function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function createDonutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const clampedEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
  const startOuter = polarToCartesian(cx, cy, outerR, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    'Z',
  ].join(' ');
}

export const DonutChart: React.FC<DonutChartProps> = ({
  slices,
  centerTitle = 'AUGUST',
  centerSubtitle,
  onPressCenter,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slices, centerTitle, scaleAnim, fadeAnim]);

  const total = slices.reduce((sum, s) => sum + (s.amount > 0 ? s.amount : 0), 0);
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 88;
  const innerR = 46;

  let cumulativeAngle = 0;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={styles.chartBox}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total <= 0 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={(outerR + innerR) / 2}
              stroke={COLORS.borderLight}
              strokeWidth={outerR - innerR}
              fill="none"
            />
          ) : (
            <G>
              {slices.map((slice, idx) => {
                if (slice.amount <= 0) return null;
                const pct = (slice.amount / total) * 100;
                const sweep = (slice.amount / total) * 360;
                const startAngle = cumulativeAngle;
                const endAngle = cumulativeAngle + sweep;
                const midAngle = startAngle + sweep / 2;
                cumulativeAngle = endAngle;

                const pathData = createDonutSegmentPath(
                  cx,
                  cy,
                  outerR,
                  innerR,
                  startAngle,
                  endAngle
                );

                const labelPoint = polarToCartesian(cx, cy, outerR + 28, midAngle);

                return (
                  <G key={`${slice.label}-${idx}`}>
                    <Path
                      d={pathData}
                      fill={slice.color}
                      stroke={COLORS.border}
                      strokeWidth={1.5}
                    />
                    {pct >= 4 && (
                      <G>
                        <SvgText
                          x={labelPoint.x}
                          y={labelPoint.y - 4}
                          fill={COLORS.textPrimary}
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                        >
                          {slice.label.toUpperCase()}
                        </SvgText>
                        <SvgText
                          x={labelPoint.x}
                          y={labelPoint.y + 8}
                          fill={COLORS.textSecondary}
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {`${pct.toFixed(1)}%`}
                        </SvgText>
                      </G>
                    )}
                  </G>
                );
              })}
              <Circle
                cx={cx}
                cy={cy}
                r={innerR}
                fill={COLORS.background}
                stroke={COLORS.border}
                strokeWidth={1.5}
              />
            </G>
          )}
        </Svg>

        {/* Tappable Center Hole */}
        <TouchableOpacity
          activeOpacity={onPressCenter ? 0.7 : 1}
          onPress={onPressCenter}
          style={styles.centerOverlay}
        >
          <Text style={styles.centerTitleText} numberOfLines={1}>
            {centerTitle}
          </Text>
          {centerSubtitle ? (
            <Text style={styles.centerSubtitleText}>{centerSubtitle}</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default DonutChart;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartBox: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerOverlay: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  centerTitleText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  centerSubtitleText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
