import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const C = Colors.light;

interface AppInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad';
  secureTextEntry?: boolean;
  editable?: boolean;
  style?: ViewStyle;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const AppInput: React.FC<AppInputProps> = ({
  label, placeholder, value, onChangeText, error, helperText,
  leftIcon, rightIcon, onRightIconPress, multiline, numberOfLines,
  keyboardType = 'default', secureTextEntry, editable = true, style,
  autoCapitalize = 'sentences',
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? C.danger : focused ? C.primary : C.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, { borderColor, borderWidth: focused ? 2 : 1 }, !editable && styles.disabled]}>
        {leftIcon ? <Ionicons name={leftIcon} size={18} color={C.textSecondary} style={styles.iconLeft} /> : null}
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines ? numberOfLines * 24 : 80, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconRight}>
            <Ionicons name={rightIcon} size={18} color={C.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {helperText && !error ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  label: { fontSize: Typography.sm, fontWeight: '600', color: C.textPrimary, marginBottom: Spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: C.surface, paddingHorizontal: Spacing.md },
  input: { flex: 1, fontSize: Typography.md, color: C.textPrimary, paddingVertical: Spacing.sm + 2 },
  iconLeft: { marginRight: Spacing.xs },
  iconRight: { marginLeft: Spacing.xs, padding: 2 },
  disabled: { backgroundColor: C.surfaceVariant, opacity: 0.7 },
  errorText: { color: C.danger, fontSize: Typography.xs, marginTop: 2 },
  helper: { color: C.textMuted, fontSize: Typography.xs, marginTop: 2 },
});
