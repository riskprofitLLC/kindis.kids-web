import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { storage } from '@/shared/lib/storage/web-storage'

export type FontSize = 'normal' | 'large' | 'xlarge'

interface UiSettingsState {
  fontSize: FontSize
  highContrast: boolean
  setFontSize: (size: FontSize) => void
  toggleHighContrast: () => void
}

export const useUiSettingsStore = create<UiSettingsState>()(
  persist(
    (set) => ({
      fontSize: 'normal',
      highContrast: false,
      setFontSize: (fontSize) => set({ fontSize }),
      toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
    }),
    {
      name: 'kindis-ui-settings',
      storage: createJSONStorage(() => storage),
    },
  ),
)
