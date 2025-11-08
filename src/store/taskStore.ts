import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface TaskAttachment {
  label?: string;
  name?: string;
  url?: string;
  type?: string;
  size?: number;
}

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
  attachments?: TaskAttachment[];
}

export interface TaskAssigneeMeta {
  application?: {
    _id: string;
    applicant_name: string;
    email: string;
    job_title?: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: string;
  shared_at?: string;
  submission?: TaskAssignment['submission'];
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  label?: string;
  attachments?: TaskAttachment[];
  created_by?: {
    _id?: string;
    name: string;
    email: string;
  };
  assigned_candidates: TaskAssigneeMeta[];
  created_at?: string;
  updated_at?: string;
}

interface TaskState {
  tasks: Task[];
  myTasks: TaskAssignment[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (payload: Partial<Task> & { assignees: string[] }) => Promise<void>;
  shareTask: (taskId: string) => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  submitTask: (taskId: string, payload: { note?: string; attachment?: any }) => Promise<void>;
  updateTask: (taskId: string, payload: Partial<Task> & { assignees?: string[] }) => Promise<Task>;
  moveTask: (taskId: string, status: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  myTasks: [],
  currentTask: null,
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
      throw error;
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

  updateTask: async (taskId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await apiRequest(API_ENDPOINTS.TASKS.BY_ID(taskId), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      set((state) => ({
        tasks: state.tasks.map((task) => (task._id === taskId ? updated : task)),
        currentTask: state.currentTask?._id === taskId ? updated : state.currentTask,
        loading: false,
      }));
      return updated;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  moveTask: async (taskId, status) => {
    await get().updateTask(taskId, { status });
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.TASKS.BY_ID(taskId), {
        method: 'DELETE',
      });
      set((state) => ({
        tasks: state.tasks.filter((task) => task._id !== taskId),
        currentTask: state.currentTask?._id === taskId ? null : state.currentTask,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentTask: (task) => set({ currentTask: task }),
}));

export default useTaskStore;
