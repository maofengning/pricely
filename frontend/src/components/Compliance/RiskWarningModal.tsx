import { useState, useEffect, useRef, useCallback } from 'react';

interface RiskWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title?: string;
  content?: string;
}

const DEFAULT_CONTENT = `
您即将进入模拟交易页面，请注意：

1. 本平台仅提供模拟交易服务，不涉及任何真实资金交易。
2. 模拟交易结果不代表实盘收益，仅供参考和学习使用。
3. 本平台不提供任何投资建议，所有交易决策由您自行做出。
4. 请勿根据模拟交易结果进行实盘操作，投资有风险，入市需谨慎。
5. 股票交易存在风险，过往业绩不代表未来表现。
`.trim();

export function RiskWarningModal({
  isOpen,
  onConfirm,
  title = '模拟交易风险提示',
  content,
}: RiskWarningModalProps) {
  const [checked, setChecked] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button when modal opens
    confirmButtonRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Handle escape key - user must confirm to continue
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Do nothing - user must confirm to continue
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
  }, []);

  const handleConfirm = useCallback(() => {
    if (checked) {
      onConfirm();
    }
  }, [checked, onConfirm]);

  // Handle Enter key on confirm button
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' && checked) {
      onConfirm();
    }
  }, [checked, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-warning-title"
      aria-describedby="risk-warning-content"
    >
      <div
        ref={modalRef}
        className="bg-bg-secondary rounded-lg max-w-lg w-full mx-4 p-6 shadow-xl border border-border"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-yellow-500 flex-shrink-0"
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
          <h2
            id="risk-warning-title"
            className="text-xl font-bold text-text-primary"
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div
          id="risk-warning-content"
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto"
        >
          <div className="text-text-secondary text-sm whitespace-pre-wrap leading-relaxed">
            {content || DEFAULT_CONTENT}
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="w-4 h-4 mt-1 rounded border-border bg-bg-tertiary accent-blue-500 cursor-pointer"
            aria-label="确认已阅读并理解风险提示"
          />
          <span className="text-text-secondary text-sm leading-relaxed group-hover:text-text-primary transition-colors">
            我已阅读并理解以上风险提示，并同意承担模拟交易的所有风险
          </span>
        </label>

        {/* Confirm Button */}
        <button
          ref={confirmButtonRef}
          onClick={handleConfirm}
          onKeyDown={handleKeyDown}
          disabled={!checked}
          className="w-full py-3 bg-text-accent text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-text-accent font-medium"
          aria-label="确认进入模拟交易"
        >
          确认进入
        </button>

        {/* Footer note */}
        <p className="text-text-tertiary text-xs text-center mt-3">
          确认后将不再显示此提示
        </p>
      </div>
    </div>
  );
}