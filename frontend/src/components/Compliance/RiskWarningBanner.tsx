interface RiskWarningBannerProps {
  title?: string;
  content?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const DEFAULT_CONTENT =
  '本平台仅提供模拟交易服务，不涉及任何实盘交易。模拟交易结果不代表实盘收益，投资有风险，入市需谨慎。';

export function RiskWarningBanner({
  title = '风险提示',
  content = DEFAULT_CONTENT,
  dismissible = true,
  onDismiss,
}: RiskWarningBannerProps) {
  // Visibility is controlled by parent via onDismiss callback
  // This ensures consistent state with parent's store

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <div
      className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 rounded-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Warning Icon */}
          <svg
            className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>

          {/* Content */}
          <div className="flex-1">
            <h4 className="text-yellow-500 font-medium text-sm mb-1">{title}</h4>
            <p className="text-yellow-500/80 text-sm leading-relaxed">{content}</p>
          </div>
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="text-yellow-500/60 hover:text-yellow-500 transition-colors flex-shrink-0 p-1"
            aria-label="关闭风险提示"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}