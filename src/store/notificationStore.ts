import { create } from 'zustand';
import API_ENDPOINTS, { apiRequest } from '../config/api';

export interface NotificationEvent {
  id: string;
  type: string;
  applicant_name: string;
  email: string;
  job_title?: string;
  timestamp: string;
  message: string;
  meta?: {
    applicationId?: string | null;
    url?: string;
    [key: string]: any;
  };
  read?: boolean;
}

interface NotificationState {
  notifications: NotificationEvent[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  dropdownOpen: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => void;
  toggleDropdown: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,
  dropdownOpen: false,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.JOB_APPLICATIONS.NOTIFICATIONS);
      const notifications = (response.notifications || []).map((item: NotificationEvent) => ({
        ...item,
        read: false,
      }));
      set({
        notifications,
        loading: false,
        unreadCount: notifications.length,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  markNotificationRead: (id) => {
    set((state) => {
      const target = state.notifications.find((note) => note.id === id);
      const remaining = state.notifications.filter((note) => note.id !== id);
      return {
        notifications: remaining,
        unreadCount:
          target && !target.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  toggleDropdown: () => {
    set((state) => ({ dropdownOpen: !state.dropdownOpen }));
  },
}));

export default useNotificationStore;
