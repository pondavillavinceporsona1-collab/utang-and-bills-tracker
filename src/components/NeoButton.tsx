import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { COLORS, FONTS, NEO_STYLE } from '../theme/colors';

interface NeoButtonProps {
  label: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  variant?: 'offset' | 'flat' | 'pill';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

/**
 * Darkens a hex color by a given factor (0..1) so the 3D button lip
 * has unmistakable tactile depth while preserving the wireframe's color palette.
 */
function darkenHex(hex: string, factor = 0.18): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * (1 - factor)));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * (1 - factor)));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * (1 - factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  label,
  onPress,
  backgroundColor = COLORS.utangYellow,
  textColor = COLORS.textPrimary,
  variant = 'offset',
  style,
  textStyle,
  disabled = false,
}) => {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 7,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  const offsetPx = variant === 'offset' ? 4 : 1.5;

  const translateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, offsetPx],
  });

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, offsetPx],
  });

  const radius =
    variant === 'pill' ? NEO_STYLE.borderRadiusPill : NEO_STYLE.borderRadiusButton;

  // Separate sizing props so `face` and `offsetLayer` always match 1:1 in height
  const flatStyle = StyleSheet.flatten(style) || {};
  const {
    minHeight = 56,
    height,
    paddingVertical,
    paddingHorizontal,
    ...containerRestStyle
  } = flatStyle;

  const lipColor = darkenHex(backgroundColor, 0.17);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      style={[
        styles.container,
        containerRestStyle,
        disabled && { opacity: 0.5 },
        Platform.OS === 'web' ? ({ cursor: disabled ? 'default' : 'pointer', userSelect: 'none' } as any) : null,
      ]}
    >
      {variant === 'offset' && (
        <View
          pointerEvents="none"
          style={[
            styles.offsetLayer,
            {
              backgroundColor: lipColor,
              borderRadius: radius,
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.face,
          {
            minHeight,
            ...(height !== undefined ? { height } : {}),
            ...(paddingVertical !== undefined ? { paddingVertical } : {}),
            ...(paddingHorizontal !== undefined ? { paddingHorizontal } : {}),
            backgroundColor,
            borderRadius: radius,
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        {/* Subtle top keycap highlight so it reads immediately as a physical button */}
        <View
          pointerEvents="none"
          style={[
            styles.topBevelHighlight,
            {
              borderTopLeftRadius: Math.max(0, radius - 2),
              borderTopRightRadius: Math.max(0, radius - 2),
            },
          ]}
        />
        <Text
          selectable={false}
          style={[
            styles.label,
            { color: textColor },
            textStyle,
            Platform.OS === 'web' ? ({ userSelect: 'none' } as any) : null,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export default NeoButton;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginBottom: 4,
    marginRight: 4,
  },
  offsetLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  face: {
    width: '100%',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topBevelHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
