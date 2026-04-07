import { useState } from 'react';
import type { Fund } from '@/types';

interface FundManagerProps {
  fund: Fund | null;
  isLoading?: boolean;
  onReset?: (initialCapital: number) => Promise<void>;
}

function formatMoney(value: number | undefined | null): string {
  if (value === undefined || value === null) return '--';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

export function FundManager({ fund, isLoading = false, onReset }: FundManagerProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAmount, setResetAmount] = useState<number>(100000);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!onReset) return;
    if (resetAmount < 10000 || resetAmount > 1000000) {
      setError('金额必须在10000到1000000之间');
      return;
    }

    setIsResetting(true);
    setError(null);
    try {
      await onReset(resetAmount);
      setShowResetModal(false);
    } catch {
      setError('重置失败，请稍后再试');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-secondary">
        <p>暂无资金信息</p>
      </div>
    );
  }

  return (
    <div>
      {/* Fund Overview */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-bg-tertiary rounded-lg p-4">
          <p className="text-text-secondary text-sm mb-1">总资产</p>
          <p className="text-text-primary text-xl font-medium">
            {formatMoney(fund.totalBalance)}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-4">
          <p className="text-text-secondary text-sm mb-1">可用资金</p>
          <p className="text-text-primary text-xl font-medium">
            {formatMoney(fund.available)}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-4">
          <p className="text-text-secondary text-sm mb-1">冻结资金</p>
          <p className="text-text-accent text-xl font-medium">
            {formatMoney(fund.frozen)}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-4">
          <p className="text-text-secondary text-sm mb-1">初始资金</p>
          <p className="text-text-secondary text-xl font-medium">
            {formatMoney(fund.initialCapital)}
          </p>
        </div>
      </div>

      {/* Profit/Loss Summary */}
      <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
        <p className="text-text-secondary text-sm mb-1">累计盈亏</p>
        <p
          className={`text-2xl font-medium ${
            fund.totalBalance >= fund.initialCapital ? 'text-buy' : 'text-sell'
          }`}
        >
          {formatMoney(fund.totalBalance - fund.initialCapital)}
          <span className="text-sm ml-2">
            ({((fund.totalBalance - fund.initialCapital) / fund.initialCapital * 100).toFixed(2)}%)
          </span>
        </p>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setShowResetModal(true)}
        className="w-full py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors"
      >
        重置模拟资金
      </button>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg p-6 w-full max-w-md">
            <h3 className="text-text-primary text-lg font-medium mb-4">重置模拟资金</h3>
            <p className="text-text-secondary text-sm mb-4">
              重置将清空所有持仓和挂单，并将资金重置为指定金额。
            </p>
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">
                初始资金金额
              </label>
              <input
                type="number"
                value={resetAmount}
                onChange={(e) => setResetAmount(parseFloat(e.target.value) || 0)}
                min={10000}
                max={1000000}
                step={10000}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
              />
              <p className="text-text-secondary text-xs mt-1">
                范围：10000 - 1000000
              </p>
            </div>
            {error && (
              <p className="text-sell text-sm mb-4">{error}</p>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 py-2 bg-sell text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}