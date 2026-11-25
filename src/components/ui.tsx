import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export type IconName = SymbolViewProps['name'];

export function Icon({ name, size = 22, color = Colors.text }: { name: IconName; size?: number; color?: string }) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}

// Scrollable page that leaves room for the status bar and tab bar
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'quiet';
  busy?: boolean;
  disabled?: boolean;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Big, easy to hit button used across the app
export function Button({ label, onPress, icon, variant = 'secondary', busy, disabled, large, style }: ButtonProps) {
  const primary = variant === 'primary';
  const fg = primary ? Colors.onAccent : variant === 'quiet' ? Colors.accent : Colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        large && styles.buttonLarge,
        primary && styles.buttonPrimary,
        variant === 'quiet' && styles.buttonQuiet,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}>
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={large ? 26 : 20} /> : null}
      <Text style={[styles.buttonText, large && styles.buttonTextLarge, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

// Small rounded chip, used for the Map categories
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// Colored note for problems like a missing key or denied permission
export function Notice({ text, tone = 'info', action }: { text: string; tone?: 'info' | 'danger'; action?: ReactNode }) {
  return (
    <View style={[styles.notice, tone === 'danger' && styles.noticeDanger]}>
      <Text style={[styles.noticeText, tone === 'danger' && { color: Colors.danger }]}>{text}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl * 2 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: { fontSize: FontSize.title, fontWeight: '800', color: Colors.text },
  muted: { fontSize: FontSize.body, color: Colors.muted, lineHeight: 21 },
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonLarge: { minHeight: 72, borderRadius: Radius.lg },
  buttonPrimary: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  buttonQuiet: { backgroundColor: Colors.accentSoft, borderColor: Colors.accentSoft },
  buttonText: { fontSize: FontSize.large, fontWeight: '700' },
  buttonTextLarge: { fontSize: FontSize.title },
  chip: {
    paddingHorizontal: Spacing.md,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: FontSize.body, fontWeight: '600', color: Colors.text },
  chipTextSelected: { color: Colors.onAccent },
  notice: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  noticeDanger: { backgroundColor: '#FDECEA' },
  noticeText: { fontSize: FontSize.body, color: Colors.text, lineHeight: 21 },
});
