import { create } from 'zustand';

type ToastTone = 'success' | 'warning' | 'danger' | 'neutral';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface UIState {
  toast: ToastState | null;
  commandOpen: boolean;
  showToast: (message: string, tone?: ToastTone) => void;
  hideToast: () => void;
  setCommandOpen: (open: boolean) => void;
}

function safeToastMessage(message: string, tone: ToastTone): string {
  const technical = /(stack trace|postgres|supabase|edge function|fetch failed|network request failed|typeerror|referenceerror|\bat .+\(.+:\d+:\d+\))/i.test(message);
  if (technical || message.length > 220) {
    return tone === 'danger'
      ? 'This action could not be completed. Check your connection and try again.'
      : 'The latest update is unavailable. Refresh and try again.';
  }
  return message;
}

export const useUIStore = create<UIState>((set) => ({
  toast: null,
  commandOpen: false,
  showToast: (message, tone = 'neutral') => {
    const id = Date.now();
    set({ toast: { id, message: safeToastMessage(message, tone), tone } });
    setTimeout(() => set((state) => state.toast?.id === id ? { toast: null } : state), 3200);
  },
  hideToast: () => set({ toast: null }),
  setCommandOpen: (commandOpen) => set({ commandOpen })
}));
