import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface AttendanceRecord {
  _id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  notes?: string;
}

interface AttendanceState {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  fetchMyAttendance: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  loading: false,
  error: null,

  fetchMyAttendance: async () => {
    set({ loading: true, error: null });
    try {
      const records = await apiRequest(API_ENDPOINTS.ATTENDANCE.MINE);
      set({ records, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  checkIn: async () => {
    await apiRequest(API_ENDPOINTS.ATTENDANCE.CHECK_IN, { method: 'POST' });
    await get().fetchMyAttendance();
  },

  checkOut: async () => {
    await apiRequest(API_ENDPOINTS.ATTENDANCE.CHECK_OUT, { method: 'POST' });
    await get().fetchMyAttendance();
  },
}));

export default useAttendanceStore;
