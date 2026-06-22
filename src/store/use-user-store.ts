import { create } from "zustand";
import { UserProfile } from "@/types";

interface UserState {
  profile: UserProfile | null;
  theme: 'light' | 'dark';
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (profileUpdates: Partial<UserProfile>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  theme: 'light',
  setProfile: (profile) => set({ profile }),
  updateProfile: (profileUpdates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...profileUpdates, updatedAt: new Date().toISOString() } : null
  })),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
    set({ theme });
  },
}));
