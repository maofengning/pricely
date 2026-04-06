import { useCallback } from 'react';
import { useComplianceStore } from '@/stores';

/**
 * Hook for managing compliance risk warning state
 *
 * @returns Object with warning states and actions
 */
export function useCompliance() {
  const {
    homeWarningConfirmed,
    homeWarningConfirmedAt,
    tradeBannerDismissed,
    confirmHomeWarning,
    dismissTradeBanner,
    resetCompliance,
    shouldShowHomeWarning,
  } = useComplianceStore();

  return {
    // State
    homeWarningConfirmed,
    homeWarningConfirmedAt,
    tradeBannerDismissed,
    // Actions
    confirmHomeWarning,
    dismissTradeBanner,
    resetCompliance,
    shouldShowHomeWarning,
  };
}

/**
 * Hook for showing home page risk warning modal
 *
 * @returns Modal state and controls
 */
export function useHomeWarning() {
  const { homeWarningConfirmed, confirmHomeWarning } = useComplianceStore();

  // Derive showModal from homeWarningConfirmed directly
  // showModal is true when warning has NOT been confirmed
  const showModal = !homeWarningConfirmed;

  const handleConfirm = useCallback(() => {
    confirmHomeWarning();
  }, [confirmHomeWarning]);

  return {
    showModal,
    handleConfirm,
    isConfirmed: homeWarningConfirmed,
  };
}

/**
 * Hook for managing trade page risk warning banner
 *
 * @returns Banner visibility state and dismiss handler
 */
export function useTradeBanner() {
  const { tradeBannerDismissed, dismissTradeBanner } = useComplianceStore();

  const handleDismiss = useCallback(() => {
    dismissTradeBanner();
  }, [dismissTradeBanner]);

  return {
    showBanner: !tradeBannerDismissed,
    handleDismiss,
  };
}