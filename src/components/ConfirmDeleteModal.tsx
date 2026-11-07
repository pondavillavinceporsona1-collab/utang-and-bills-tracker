import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedModal } from './AnimatedModal';
import { COLORS, FONTS } from '../theme/colors';

interface ConfirmDeleteModalProps {
  visible: boolean;
  itemName: string;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  itemName,
  title = 'CONFIRM DELETE',
  message,
  confirmLabel = 'delete',
  onCancel,
  onConfirm,
}) => {
  return (
    <AnimatedModal visible={visible} title={title} onClose={onCancel}>
      <Text style={styles.bodyText}>
        {message || `Remove "${itemName}" permanently? This action cannot be undone.`}
      </Text>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelText}>cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </AnimatedModal>
  );
};

export default ConfirmDeleteModal;

const styles = StyleSheet.create({
  bodyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    backgroundColor: COLORS.logoutRed,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
