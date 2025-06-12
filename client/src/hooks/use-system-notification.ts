import { create } from 'zustand';

interface SystemNotificationState {
  isOpen: boolean;
  title: string;
  message: string;
  onAccept?: () => void;
  show: (title: string, message: string, onAccept?: () => void) => void;
  hide: () => void;
}

export const useSystemNotification = create<SystemNotificationState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onAccept: undefined,
  show: (title, message, onAccept) => set({ isOpen: true, title, message, onAccept }),
  hide: () => set({ isOpen: false }),
}));