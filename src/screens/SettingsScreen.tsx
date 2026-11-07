import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS } from '../theme/colors';
import { TopBar } from '../components/TopBar';
import { NeoButton } from '../components/NeoButton';
import { AnimatedModal } from '../components/AnimatedModal';

export default function SettingsScreen() {
  const {
    user,
    goBack,
    goHome,
    logout,
    updateUsername,
    resetAllData,
    syncNow,
    isOnlineSynced,
  } = useApp();

  const [profileModal, setProfileModal] = useState(false);
  const [dataModal, setDataModal] = useState(false);
  const [draftName, setDraftName] = useState(user?.display_name || 'maria');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    await updateUsername(draftName);
    setProfileModal(false);
    setStatusMessage('Display name updated');
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER */}
      <TopBar
        title="SETTINGS"
        subtitle="VER. 0.1 BETA"
        centerTitle
        showClock={false}
        onBackPress={goBack}
        onHomePress={goHome}
      />

      {/* 2. BODY: Clean Minimal Options */}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => {
            setDraftName(user?.display_name || 'maria');
            setProfileModal(true);
          }}
          activeOpacity={0.75}
        >
          <View style={styles.optionTextCol}>
            <Text style={styles.optionLabel}>ACCOUNT</Text>
            <Text style={styles.optionValue}>
              {user?.display_name || 'maria'} • {user?.email || 'offline profile'}
            </Text>
          </View>
          <Text style={styles.actionBadge}>edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={async () => {
            await syncNow();
            setStatusMessage('Local & Supabase storage verified');
          }}
          activeOpacity={0.75}
        >
          <View style={styles.optionTextCol}>
            <Text style={styles.optionLabel}>STORAGE & SYNC</Text>
            <Text style={styles.optionValue}>
              {isOnlineSynced ? 'Supabase Cloud Synced' : 'Offline Local Storage Active'}
            </Text>
          </View>
          <Text style={styles.actionBadge}>sync</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => setDataModal(true)}
          activeOpacity={0.75}
        >
          <View style={styles.optionTextCol}>
            <Text style={styles.optionLabel}>DATA OPTIONS</Text>
            <Text style={styles.optionValue}>Reset to empty slate or reload demo data</Text>
          </View>
          <Text style={styles.actionBadge}>manage</Text>
        </TouchableOpacity>

        {statusMessage ? (
          <Text style={styles.feedbackText}>{statusMessage}</Text>
        ) : null}
      </View>

      {/* 3. FOOTER: Direct, Instant LOG OUT Button */}
      <View style={styles.footer}>
        <NeoButton
          label="LOG OUT"
          variant="offset"
          backgroundColor={COLORS.logoutRed}
          textColor="#111111"
          onPress={logout}
          style={styles.logoutBtn}
          textStyle={styles.logoutBtnText}
        />
      </View>

      {/* Edit Profile Modal */}
      <AnimatedModal
        visible={profileModal}
        title="EDIT USERNAME"
        subtitle="Displayed on the top-left of your Home screen"
        onClose={() => setProfileModal(false)}
      >
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          style={styles.input}
          placeholder="maria"
          autoCapitalize="none"
        />
        <NeoButton
          label="save"
          backgroundColor={COLORS.utangYellow}
          onPress={handleSaveProfile}
          style={{ minHeight: 48 }}
          textStyle={{ fontSize: 16 }}
        />
      </AnimatedModal>

      {/* Data Reset / Demo Modal */}
      <AnimatedModal
        visible={dataModal}
        title="MANAGE APP DATA"
        subtitle="Switch between a clean empty account or wireframe demo data"
        onClose={() => setDataModal(false)}
      >
        <View style={{ gap: 12 }}>
          <NeoButton
            label="start fresh (clear all)"
            variant="flat"
            backgroundColor={COLORS.logoutRedSoft}
            onPress={async () => {
              await resetAllData(false);
              setDataModal(false);
              setStatusMessage('Cleared all loans, bills, and history');
            }}
            style={{ minHeight: 48 }}
            textStyle={{ fontSize: 15 }}
          />
          <NeoButton
            label="load wireframe demo data"
            variant="flat"
            backgroundColor={COLORS.utangYellow}
            onPress={async () => {
              await resetAllData(true);
              setDataModal(false);
              setStatusMessage('Demo data restored (August 2026)');
            }}
            style={{ minHeight: 48 }}
            textStyle={{ fontSize: 15 }}
          />
        </View>
      </AnimatedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  optionTextCol: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
  },
  optionValue: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 3,
  },
  actionBadge: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.utangYellowSoft,
  },
  feedbackText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  logoutBtn: {
    minHeight: 62,
  },
  logoutBtnText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  input: {
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
