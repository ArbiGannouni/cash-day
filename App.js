import React, { useState, useEffect } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { migrateDb } from './src/database/db';

import { Home, Mic, Sparkles, Settings as SettingsIcon } from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/hooks/ThemeContext';
import { SecurityProvider, useSecurity } from './src/hooks/SecurityContext';
import LockScreen from './src/components/LockScreen';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import VoiceInputScreen from './src/screens/VoiceInputScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import IncomeScreen from './src/screens/IncomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 20,
          height: 70,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Insights" component={InsightsScreen} options={{ tabBarLabel: 'Analysis', tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> }} />
      <Tab.Screen name="VoiceInput" component={VoiceInputScreen} options={{ tabBarLabel: 'AI Voice', tabBarIcon: ({ color, size }) => <Mic color={color} size={size + 4} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

function RootApp() {
  const { theme, themeMode } = useTheme();
  const { isLocked } = useSecurity();

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="Income" component={IncomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SQLiteProvider databaseName="flous_chhar_v2.db" onInit={migrateDb}>
      <ThemeProvider>
        <SecurityProvider>
          <RootApp />
        </SecurityProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
