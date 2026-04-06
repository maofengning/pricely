// Compliance-related types

export interface ComplianceState {
  // Whether user has confirmed home page risk warning
  homeWarningConfirmed: boolean;
  // Timestamp when confirmed
  homeWarningConfirmedAt: string | null;
  // Whether user has dismissed trade page banner (for this session)
  tradeBannerDismissed: boolean;
}

export interface ComplianceActions {
  // Confirm home page risk warning
  confirmHomeWarning: () => void;
  // Dismiss trade page banner (session only)
  dismissTradeBanner: () => void;
  // Reset all compliance state (for testing or logout)
  resetCompliance: () => void;
  // Check if home warning should be shown
  shouldShowHomeWarning: () => boolean;
}

export type ComplianceStore = ComplianceState & ComplianceActions;