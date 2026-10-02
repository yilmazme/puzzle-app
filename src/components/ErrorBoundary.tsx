import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../settings';
import { colors } from '../theme';

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useSettings();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t('errorTitle')}</Text>
      <Text style={styles.message}>{t('errorMessage')}</Text>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={onRetry}
      >
        <Text style={styles.buttonText}>{t('tryAgain')}</Text>
      </Pressable>
    </View>
  );
}

type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  message: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
