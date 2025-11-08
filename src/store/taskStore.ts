import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface TaskAssignment {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  submission?: {
    note?: string;
    attachment?: {
      label?: string;
      url?: string;
      name?: string;
    };
    submitted_at?: string;
  };
  attachments?: any[];
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  created_by?: {
    name: string;
    email: string;
  };
  assigned_candidates: any[];
}

interface TaskState {
  tasks: Task[];
  myTasks: TaskAssignment[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (payload: Partial<Task> & { assignees: string[] }) => Promise<void>;
  shareTask: (taskId: string) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  submitTask: (taskId: string, payload: { note?: string; attachment?: any }) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  myTasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await apiRequest(API_ENDPOINTS.TASKS.BASE);
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (payload) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.TASKS.BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  shareTask: async (taskId) => {
    try {
      await apiRequest(API_ENDPOINTS.TASKS.SHARE(taskId), {
        method: 'POST',
      });
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true, error: null });
    try {
      const myTasks = await apiRequest(API_ENDPOINTS.TASKS.MINE);
      set({ myTasks, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  submitTask: async (taskId, payload) => {
    try {
      await apiRequest(API_ENDPOINTS.TASKS.SUBMIT(taskId), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await get().fetchMyTasks();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));

export default useTaskStore;
