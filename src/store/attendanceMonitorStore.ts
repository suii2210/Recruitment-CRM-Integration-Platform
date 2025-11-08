import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface AttendanceMonitorRecord {
  id: string;
  applicant_name: string;
  email?: string;
  job_title?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'checked_in' | 'checked_out' | 'pending';
}

interface AttendanceMonitorState {
  records: AttendanceMonitorRecord[];
  loading: boolean;
  error: string | null;
  fetchRecent: (date?: string) => Promise<void>;
}

export const useAttendanceMonitorStore = create<AttendanceMonitorState>((set) => ({
  records: [],
  loading: false,
  error: null,

  fetchRecent: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      const response = await apiRequest(`${API_ENDPOINTS.ATTENDANCE.ADMIN_RECENT}${query}`);
      set({ records: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load attendance records', loading: false });
    }
  },
}));

export default useAttendanceMonitorStore;
