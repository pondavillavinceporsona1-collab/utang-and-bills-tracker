import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS } from '../theme/colors';
import { NeoButton } from '../components/NeoButton';
import { GearIcon, HistoryIcon } from '../components/VectorIcons';
import { AnimatedModal } from '../components/AnimatedModal';

export default function HomeScreen() {
  const { user, navigate, updateUsername } = useApp();
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [draftName, setDraftName] = useState(user?.display_name || 'maria');

  const handleSaveName = async () => {
    await updateUsername(draftName);
    setNameModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER: Username (left) + Settings Gear (right) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setDraftName(user?.display_name || 'maria');
            setNameModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.greetingText}>
            {(user?.display_name || 'maria').toLowerCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate('SETTINGS')}
          style={styles.gearBtn}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
        >
          <GearIcon size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 2. BODY: 3 Large Primary Action Buttons */}
      <View style={styles.body}>
        <NeoButton
          label="UTANG"
          variant="offset"
          backgroundColor={COLORS.utangYellow}
          onPress={() => navigate('LOAN_LIST')}
          style={styles.hubBtn}
          textStyle={styles.hubBtnText}
        />

        <NeoButton
          label="DASHBOARD"
          variant="offset"
          backgroundColor={COLORS.dashboardCyan}
          onPress={() => navigate('DASHBOARD')}
          style={styles.hubBtn}
          textStyle={styles.hubBtnText}
        />

        <NeoButton
          label="BILLS"
          variant="offset"
          backgroundColor={COLORS.billsGreen}
          onPress={() => navigate('BILLS')}
          style={styles.hubBtn}
          textStyle={styles.hubBtnText}
        />
      </View>

      {/* 3. FOOTER: History Button at Bottom-Right */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigate('HISTORY')}
          style={styles.historyBtn}
          activeOpacity={0.7}
          accessibilityLabel="Open history"
        >
          <HistoryIcon size={30} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Quick Username Edit Modal */}
      <AnimatedModal
        visible={nameModalVisible}
        title="EDIT DISPLAY NAME"
        subtitle="Tap save to update your Home greeting"
        onClose={() => setNameModalVisible(false)}
      >
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          style={styles.modalInput}
          placeholder="maria"
          autoCapitalize="none"
        />
        <NeoButton
          label="save"
          backgroundColor={COLORS.utangYellow}
          onPress={handleSaveName}
          style={{ minHeight: 48 }}
          textStyle={{ fontSize: 16 }}
        />
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: {
    fontFamily: FONTS.regular,
    fontSize: 30,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    gap: 24,
    marginVertical: 20,
  },
  hubBtn: {
    minHeight: 82,
  },
  hubBtnText: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  historyBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    height: 46,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
});
