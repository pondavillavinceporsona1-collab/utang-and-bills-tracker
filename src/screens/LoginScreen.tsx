import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS } from '../theme/colors';
import { NeoButton } from '../components/NeoButton';
import { GoogleIcon, FacebookIcon } from '../components/VectorIcons';

export default function LoginScreen() {
  const { login, loginDemo, navigate } = useApp();
  const [email, setEmail] = useState('maria@example.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);
    const res = await login(email, password, 'local');
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setErrorMsg(null);
    const res = await login(email, undefined, provider);
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. HEADER */}
      <View style={styles.header}>
        <Text style={styles.helloText}>HELLO</Text>
        <Text style={styles.subText}>Log in</Text>
      </View>

      {/* 2. BODY */}
      <View style={styles.body}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="name@email.com"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.btnWrap}>
          <NeoButton
            label="log in"
            variant="pill"
            backgroundColor={COLORS.dashboardCyan}
            onPress={handleLogin}
            style={styles.loginBtn}
            textStyle={styles.loginBtnText}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigate('REGISTER')}
          style={styles.linkTouch}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>create new account</Text>
        </TouchableOpacity>
      </View>

      {/* 3. FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.continueText}>or continue with</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('google')}
            activeOpacity={0.75}
            accessibilityLabel="Sign in with Google"
          >
            <GoogleIcon size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('facebook')}
            activeOpacity={0.75}
            accessibilityLabel="Sign in with Facebook"
          >
            <FacebookIcon size={26} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.demoChip}
          onPress={loginDemo}
          activeOpacity={0.75}
        >
          <Text style={styles.demoChipText}>load demo account (maria)</Text>
        </TouchableOpacity>

        <Text style={styles.versionBadge}>Utang & Bills Tracker • ver. 0.1 (beta)</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
    paddingVertical: 36,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  helloText: {
    fontFamily: FONTS.bold,
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subText: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  body: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  input: {
    height: 44,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.logoutRed,
    marginBottom: 8,
    textAlign: 'center',
  },
  btnWrap: {
    marginTop: 10,
  },
  loginBtn: {
    minHeight: 46,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  linkTouch: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  linkText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  continueText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 18,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
  },
  demoChipText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  versionBadge: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 10,
  },
});
