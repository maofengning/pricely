import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComplianceStore } from '@/types';

export const useComplianceStore = create<ComplianceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      homeWarningConfirmed: false,
      homeWarningConfirmedAt: null,
      tradeBannerDismissed: false,

      // Actions
      confirmHomeWarning: () => {
        set({
          homeWarningConfirmed: true,
          homeWarningConfirmedAt: new Date().toISOString(),
        });
      },

      dismissTradeBanner: () => {
        set({ tradeBannerDismissed: true });
      },

      resetCompliance: () => {
        set({
          homeWarningConfirmed: false,
          homeWarningConfirmedAt: null,
          tradeBannerDismissed: false,
        });
      },

      shouldShowHomeWarning: () => {
        const state = get();
        return !state.homeWarningConfirmed;
      },
    }),
    {
      name: 'compliance-storage',
      // Persist home warning confirmation, but not trade banner dismissal (session only)
      partialize: (state) => ({
        homeWarningConfirmed: state.homeWarningConfirmed,
        homeWarningConfirmedAt: state.homeWarningConfirmedAt,
      }),
    }
  )
);