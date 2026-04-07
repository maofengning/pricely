import type { TradeLog, LogPatternType } from '@/types';
import { LOG_PATTERN_TYPE_LABELS, PERIOD_LABELS } from '@/types';

interface LogEntryProps {
  log: TradeLog;
  onView?: (log: TradeLog) => void;
  onEdit?: (log: TradeLog) => void;
  onDelete?: (log: TradeLog) => void;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '-';
  return price.toFixed(2);
}

function formatProfitLoss(profitLoss?: number): { text: string; className: string } {
  if (profitLoss === undefined || profitLoss === null) {
    return { text: '-', className: 'text-text-secondary' };
  }
  const sign = profitLoss >= 0 ? '+' : '';
  const className = profitLoss >= 0 ? 'text-kline-up' : 'text-kline-down';
  return { text: `${sign}${profitLoss.toFixed(2)}`, className };
}

function formatPatternType(patternType?: LogPatternType): string {
  if (!patternType) return '-';
  return LOG_PATTERN_TYPE_LABELS[patternType] || patternType;
}

function formatPeriod(period: string): string {
  return PERIOD_LABELS[period as keyof typeof PERIOD_LABELS] || period;
}

export function LogEntry({ log, onView, onEdit, onDelete }: LogEntryProps) {
  const profitLossDisplay = formatProfitLoss(log.profitLoss);
  const isProfit = log.profitLoss !== undefined && log.profitLoss >= 0;

  return (
    <div
      className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-border-hover transition-colors cursor-pointer"
      onClick={() => onView?.(log)}
      data-testid={`log-entry-${log.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-medium">{log.stockCode}</span>
          {log.stockName && (
            <span className="text-text-secondary text-sm">{log.stockName}</span>
          )}
          <span className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded">
            {formatPeriod(log.period)}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${profitLossDisplay.className}`}>
            {profitLossDisplay.text}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <span className="text-text-secondary text-xs block mb-1">入场价</span>
          <span className="text-text-primary">{formatPrice(log.entryPrice)}</span>
        </div>
        <div>
          <span className="text-text-secondary text-xs block mb-1">出场价</span>
          <span className="text-text-primary">{formatPrice(log.exitPrice)}</span>
        </div>
        <div>
          <span className="text-text-secondary text-xs block mb-1">数量</span>
          <span className="text-text-primary">{log.quantity}</span>
        </div>
      </div>

      {/* Risk Management */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-text-secondary text-xs block mb-1">止损</span>
          <span className={log.stopLoss ? 'text-red-500' : 'text-text-secondary'}>
            {formatPrice(log.stopLoss)}
          </span>
        </div>
        <div>
          <span className="text-text-secondary text-xs block mb-1">止盈</span>
          <span className={log.takeProfit ? 'text-green-500' : 'text-text-secondary'}>
            {formatPrice(log.takeProfit)}
          </span>
        </div>
      </div>

      {/* Pattern and Tags */}
      <div className="flex items-center gap-2 mb-3">
        {log.patternType && (
          <span className={`px-2 py-1 text-xs rounded ${
            isProfit ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
          }`}>
            {formatPatternType(log.patternType)}
          </span>
        )}
        {log.tags.length > 0 && (
          <div className="flex gap-1">
            {log.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded"
              >
                {tag}
              </span>
            ))}
            {log.tags.length > 3 && (
              <span className="text-text-secondary text-xs">
                +{log.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {log.notes && (
        <div className="text-text-secondary text-sm mb-3 truncate">
          {log.notes}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-text-tertiary text-xs">
          {formatDateTime(log.tradeTime || log.createdAt)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(log);
            }}
            className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-text-accent hover:text-white transition-colors"
            aria-label="编辑日志"
          >
            编辑
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(log);
            }}
            className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-red-500 hover:text-white transition-colors"
            aria-label="删除日志"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
