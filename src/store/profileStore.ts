import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface SocialLinks {
  twitter: string;
  linkedin: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  website: string;
  title: string;
  category: string;
  avatar?: string;
  socialLinks: SocialLinks;
}

interface Preferences {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  pushNotifications: boolean;
  loginNotifications: boolean;
  twoFactorEnabled: boolean;
}

interface Activity {
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  details?: any;
}

interface ProfileStore {
  profile: ProfileData | null;
  preferences: Preferences | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  
  // Actions
  updateProfile: (profileData: Partial<ProfileData>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updatePreferences: (preferences: Partial<Preferences>) => Promise<void>;
  uploadAvatar: (imageUrl: string) => Promise<void>;
  fetchActivities: (page?: number, limit?: number) => Promise<void>;
  setProfile: (profile: ProfileData) => void;
  setPreferences: (preferences: Preferences) => void;
  initializePreferences: (preferences: Preferences) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: null,
  preferences: null,
  activities: [],
  loading: false,
  error: null,


  setProfile: (profile) => {
    set({ profile });
  },

  setPreferences: (preferences) => {
    set({ preferences });
  },

  initializePreferences: (preferences) => {
    console.log('Initializing preferences:', preferences); // Debug log
    set({ preferences });
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      set(state => ({
        profile: { ...state.profile, ...response.user },
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      await apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updatePreferences: async (preferencesUpdate) => {
    const currentPreferences = get().preferences;
    const newPreferences = { ...currentPreferences, ...preferencesUpdate };
    
    // Optimistically update the UI
    set({ preferences: newPreferences });
    
    console.log('Updating preferences:', preferencesUpdate); // Debug log
    console.log('New preferences:', newPreferences); // Debug log
    
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.PREFERENCES, {
        method: 'PUT',
        body: JSON.stringify(preferencesUpdate),
      });
      
      // Update with server response
      set({ preferences: response.preferences });
    } catch (error: any) {
      // Revert on error
      set({ preferences: currentPreferences, error: error.message });
      throw error;
    }
  },

  uploadAvatar: async (imageUrl) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(API_ENDPOINTS.AUTH.AVATAR, {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      });
      
      set(state => ({
        profile: { ...state.profile!, avatar: response.avatar },
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchActivities: async (page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await apiRequest(
        `${API_ENDPOINTS.AUTH.ACTIVITY}?page=${page}&limit=${limit}`
      );
      
      set({ 
        activities: response.activities,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));