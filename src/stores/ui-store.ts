import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// UI Store for global UI state
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Notifications
  notifications: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
  }[];
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Mobile menu
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      searchResults: [],
      setSearchResults: (searchResults) => set({ searchResults }),
      isSearchOpen: false,
      setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      
      notifications: [],
      addNotification: (notification) => {
        const id = Date.now().toString();
        const timestamp = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }],
        }));
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }));
        }, 5000);
      },
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),
      
      globalLoading: false,
      setGlobalLoading: (globalLoading) => set({ globalLoading }),
      
      isMobileMenuOpen: false,
      setIsMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    }),
    {
      name: 'ui-store',
    }
  )
);