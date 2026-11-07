import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { COLORS, NEO_STYLE } from './src/theme/colors';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import LoanListScreen from './src/screens/LoanListScreen';
import ViewLoanDueScreen from './src/screens/ViewLoanDueScreen';
import ViewLoanNoDueScreen from './src/screens/ViewLoanNoDueScreen';
import AddEditLoanScreen from './src/screens/AddEditLoanScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BillsScreen from './src/screens/BillsScreen';
import FullLoanDetailsScreen from './src/screens/FullLoanDetailsScreen';

function ScreenRouter() {
  const { nav } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, [nav.currentScreen, nav.selectedLoanId, fadeAnim, slideAnim]);

  const renderScreen = () => {
    switch (nav.currentScreen) {
      case 'LOGIN':
        return <LoginScreen />;
      case 'REGISTER':
        return <RegisterScreen />;
      case 'HOME':
        return <HomeScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      case 'HISTORY':
        return <HistoryScreen />;
      case 'LOAN_LIST':
        return <LoanListScreen />;
      case 'VIEW_LOAN_DUE':
        return <ViewLoanDueScreen />;
      case 'VIEW_LOAN_NO_DUE':
        return <ViewLoanNoDueScreen />;
      case 'ADD_EDIT_LOAN':
        return <AddEditLoanScreen />;
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'BILLS':
        return <BillsScreen />;
      case 'FULL_LOAN_DETAILS':
        return <FullLoanDetailsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.animatedScreen,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {renderScreen()}
    </Animated.View>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'utang-google-fonts';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Space+Grotesk:wght@700;800;900&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.phoneFrame}>
            <ScreenRouter />
          </View>
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? COLORS.outerCanvas : COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'web' ? 20 : 0,
  },
  phoneFrame: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 390 : 480,
    maxHeight: Platform.OS === 'web' ? 780 : undefined,
    borderRadius: Platform.OS === 'web' ? NEO_STYLE.borderRadiusScreen : 0,
    borderWidth: Platform.OS === 'web' ? 2.5 : 0,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  animatedScreen: {
    flex: 1,
  },
});
