import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface UIState {
  isFocusMode: boolean
  theme: Theme
  toggleFocusMode: () => void
  setFocusMode: (state: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const useUIStore = create<UIState>((set) => ({
  isFocusMode: false,
  theme: 'dark',
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFocusMode: (isFocusMode) => set({ isFocusMode }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setTheme: (theme) => set({ theme }),
}))
