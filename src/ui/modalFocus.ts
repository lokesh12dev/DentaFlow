import { useEffect } from 'react';
import { Platform } from 'react-native';

const FOCUSABLE_SELECTOR = '[tabindex="0"],input,select,textarea,button,a[href]';

/**
 * Focus management for modal surfaces on web (ModalSheet, CommandPalette):
 * - moves focus into the dialog when it opens (keyboard and screen-reader users
 *   enter the dialog, not the page behind it);
 * - keeps Tab focus cycling inside the dialog while it is open;
 * - closes on Escape (the native Modal `onRequestClose` only covers Android back).
 *
 * The dialog subtree is located by `role="dialog"`, which React Native Web renders
 * from `accessibilityRole="dialog"`. On native platforms this hook is a no-op:
 * the system Modal handles dismissal and screen readers isolate the modal context,
 * so we also set `aria-modal` on the sheet containers (typed as a no-op on native).
 */
export function useModalFocus({ active, onClose }: { active: boolean; onClose: () => void }): void {
  useEffect(() => {
    if (!active || Platform.OS !== 'web') return;
    const dialog = (): HTMLElement | null => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
      // Multiple stacked modals are not supported by the app's flows; the last
      // mounted portal sits on top, so it is the one receiving user interaction.
      return dialogs[dialogs.length - 1] ?? null;
    };
    const focusables = (): HTMLElement[] => {
      const node = dialog();
      if (!node) return [];
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
    };
    const node = dialog();
    if (node && !(document.activeElement && node.contains(document.activeElement))) {
      // Respect an already-focused element (e.g. an auto-focused search field
      // inside the dialog) instead of overriding it.
      focusables()[0]?.focus();
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      if (event.shiftKey) {
        (items[index > 0 ? index - 1 : items.length - 1])?.focus();
      } else {
        (items[index === -1 || index === items.length - 1 ? 0 : index + 1])?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [active, onClose]);
}
