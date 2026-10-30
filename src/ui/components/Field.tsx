import React, { useState } from 'react';
import { Pressable, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import type { LucideIcon } from '../icons';
import { ChevronDown, Search, X } from '../icons';
import { radii, sizes, spacing, typography, fonts } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { AppText } from './Typography';

export function Field({ label, value, onChangeText, placeholder, error, helper, icon: Icon, trailing, multiline = false, keyboardType, secureTextEntry, autoCapitalize, style, ...props }: Omit<TextInputProps, 'style'> & { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; error?: string; helper?: string; icon?: LucideIcon; trailing?: React.ReactNode; multiline?: boolean; keyboardType?: KeyboardTypeOptions; secureTextEntry?: boolean; autoCapitalize?: TextInputProps['autoCapitalize']; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return <View style={[{ gap: spacing[2] }, style]}>
    <AppText variant="label">{label}</AppText>
    <View style={{ minHeight: multiline ? 112 : sizes.input, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: spacing[2], borderWidth: focused ? 2 : 1, borderColor: error ? theme.colors.danger : focused ? theme.colors.focus : theme.colors.borderStrong, borderRadius: radii.md, backgroundColor: theme.colors.surface, paddingHorizontal: spacing[3], paddingVertical: multiline ? spacing[3] : 0 }}>
      {Icon ? <Icon size={18} color={theme.colors.textMuted} style={multiline ? { marginTop: 2 } : undefined} /> : null}
      <TextInput {...props} accessibilityLabel={label} accessibilityHint={error ? `Error: ${error}` : helper} accessibilityState={{ disabled: Boolean(props.editable === false) }} value={value} onFocus={(event) => { setFocused(true); props.onFocus?.(event); }} onBlur={(event) => { setFocused(false); props.onBlur?.(event); }} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textMuted} multiline={multiline} keyboardType={keyboardType} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize} style={[{ flex: 1, color: theme.colors.text, fontFamily: fonts.regular, ...typography.body, minHeight: multiline ? 84 : undefined, textAlignVertical: multiline ? 'top' : 'center', paddingVertical: 0 }]} />
      {trailing}
    </View>
    {error || helper ? <AppText variant="caption" tone={error ? 'danger' : 'secondary'}>{error ?? helper}</AppText> : null}
  </View>;
}

export function SearchField({ value, onChangeText, placeholder = 'Search', style, autoFocus = false }: { value: string; onChangeText: (value: string) => void; placeholder?: string; style?: StyleProp<ViewStyle>; autoFocus?: boolean }) {
  const theme = useTheme();
  return <View style={[{ height: sizes.input, flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderRadius: radii.md, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing[3] }, style]}>
    <Search size={19} color={theme.colors.textMuted} />
    <TextInput accessibilityLabel={placeholder} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textMuted} returnKeyType="search" autoFocus={autoFocus} style={{ flex: 1, color: theme.colors.text, fontFamily: fonts.regular, ...typography.body, paddingVertical: 0 }} />
    {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}><X size={18} color={theme.colors.textMuted} /></Pressable> : null}
  </View>;
}

export function SelectField({ label, value, placeholder, onPress, error, icon: Icon }: { label: string; value?: string; placeholder: string; onPress: () => void; error?: string; icon?: LucideIcon }) {
  const theme = useTheme();
  return <View style={{ gap: spacing[2] }}>
    <AppText variant="label">{label}</AppText>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value ?? placeholder}`} onPress={onPress} style={({ pressed }) => ({ height: sizes.input, flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderWidth: 1, borderColor: error ? theme.colors.danger : theme.colors.borderStrong, borderRadius: radii.md, backgroundColor: theme.colors.surface, paddingHorizontal: spacing[3], opacity: pressed ? 0.72 : 1 })}>
      {Icon ? <Icon size={18} color={theme.colors.textMuted} /> : null}
      <AppText style={{ flex: 1 }} tone={value ? 'primary' : 'muted'}>{value ?? placeholder}</AppText>
      <ChevronDown size={18} color={theme.colors.textMuted} />
    </Pressable>
    {error ? <AppText variant="caption" tone="danger">{error}</AppText> : null}
  </View>;
}
