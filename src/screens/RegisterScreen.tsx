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

export default function RegisterScreen() {
  const { register, login, navigate } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (password !== repeatPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    const res = await register(email, password, username || undefined);
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
        <Text style={styles.subText}>Create account</Text>
      </View>

      {/* 2. BODY */}
      <View style={styles.body}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>username (optional)</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
            placeholder="e.g. maria"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>repeat password</Text>
          <TextInput
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <View style={styles.btnWrap}>
          <NeoButton
            label="create account"
            variant="offset"
            backgroundColor={COLORS.utangYellow}
            onPress={handleRegister}
            style={styles.createBtn}
            textStyle={styles.createBtnText}
          />
        </View>

        <TouchableOpacity
          onPress={() => navigate('LOGIN')}
          style={styles.linkTouch}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>back to log in</Text>
        </TouchableOpacity>
      </View>

      {/* 3. FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.continueText}>or continue with</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => login(email || 'maria@example.com', undefined, 'google')}
            activeOpacity={0.75}
          >
            <GoogleIcon size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => login(email || 'maria@example.com', undefined, 'facebook')}
            activeOpacity={0.75}
          >
            <FacebookIcon size={26} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
  },
  helloText: {
    fontFamily: FONTS.bold,
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  body: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 11,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1.75,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
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
  createBtn: {
    minHeight: 48,
  },
  createBtnText: {
    fontSize: 15,
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
  },
  continueText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
