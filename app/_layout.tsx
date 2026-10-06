import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StartupGate } from '@/components/StartupGate';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Fond de toutes les pages = fond de l'appli : sur ordi, le contenu est centré et les côtés restent bleu nuit
const withAppBackground = (theme: typeof DefaultTheme) => ({ ...theme, colors: { ...theme.colors, background: '#0c1521' } });

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0c1521' }}>
    <ThemeProvider value={withAppBackground(colorScheme === 'dark' ? DarkTheme : DefaultTheme)}>
      <StartupGate>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="game/[day]"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="arcade/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="admin" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/mentions" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="survey" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="recap" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      </StartupGate>
      <StatusBar style="auto" />
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}