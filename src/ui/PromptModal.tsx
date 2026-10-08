import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii } from './theme';

type PromptModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmColor?: string;
  closeOnBackdrop?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
};

export function PromptModal({
  visible,
  title,
  message,
  confirmLabel = 'Okay',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  confirmColor = colors.gold,
  closeOnBackdrop = true,
  onCancel,
  onConfirm,
  children,
}: PromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <Pressable style={styles.backdrop} onPress={closeOnBackdrop ? onCancel : undefined} />
        <View style={styles.card}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.cardInner}
          >
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {children}
            <View style={styles.actions}>
              <Pressable onPress={onCancel} style={styles.cancelButton}>
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={confirmDisabled}
                style={[
                  styles.confirmButton,
                  { backgroundColor: confirmColor },
                  confirmDisabled && styles.confirmDisabled,
                ]}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    zIndex: 1,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    color: colors.text,
  },
  message: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 21,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '700',
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
