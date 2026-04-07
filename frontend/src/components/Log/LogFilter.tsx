import { useState, useCallback } from 'react';
import { PERIOD_LABELS, type Period, type TradeLogQuery } from '@/types';

interface LogFilterProps {
  query: TradeLogQuery;
  onQueryChange: (query: TradeLogQuery) => void;
  onReset: () => void;
}

const PERIOD_OPTIONS: Period[] = ['1min', '5min', '15min', '30min', '1h', '4h', '1d'];

function LogFilterInner({
  initialStockCode,
  initialTags,
  initialStartDate,
  initialEndDate,
  onQueryChange,
  onReset,
}: {
  initialStockCode: string;
  initialTags: string;
  initialStartDate: string;
  initialEndDate: string;
  onQueryChange: (query: TradeLogQuery) => void;
  onReset: () => void;
}) {
  const [localStockCode, setLocalStockCode] = useState(initialStockCode);
  const [localTags, setLocalTags] = useState(initialTags);
  const [localStartDate, setLocalStartDate] = useState(initialStartDate);
  const [localEndDate, setLocalEndDate] = useState(initialEndDate);

  const handleApply = useCallback(() => {
    const newQuery: TradeLogQuery = {
      stockCode: localStockCode.trim() || undefined,
      tags: localTags.trim() ? localTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      startDate: localStartDate || undefined,
      endDate: localEndDate || undefined,
      page: 1, // Reset to first page when filtering
    };
    onQueryChange(newQuery);
  }, [localStockCode, localTags, localStartDate, localEndDate, onQueryChange]);

  const handleReset = useCallback(() => {
    setLocalStockCode('');
    setLocalTags('');
    setLocalStartDate('');
    setLocalEndDate('');
    onReset();
  }, [onReset]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  }, [handleApply]);

  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-4" data-testid="log-filter">
      <h3 className="text-text-primary font-medium mb-4">筛选条件</h3>

      <div className="space-y-4">
        {/* Stock Code */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">股票代码</label>
          <input
            type="text"
            value={localStockCode}
            onChange={(e) => setLocalStockCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如: AAPL"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">标签 (逗号分隔)</label>
          <input
            type="text"
            value={localTags}
            onChange={(e) => setLocalTags(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如: 突破, 反转"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">开始日期</label>
            <input
              type="datetime-local"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">结束日期</label>
            <input
              type="datetime-local"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
        </div>

        {/* Quick Period Filters */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">快速筛选周期</label>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((period) => (
              <button
                key={period}
                onClick={() => {
                  // Note: Period filtering is not implemented in backend yet
                  // This is a placeholder for future functionality
                }}
                className="px-3 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-text-accent hover:text-white transition-colors"
              >
                {PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            className="flex-1 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
          >
            应用筛选
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}

export function LogFilter({ query, onQueryChange, onReset }: LogFilterProps) {
  // Use key to reset internal state when external query changes
  const key = `${query.stockCode || ''}-${query.tags?.join(',') || ''}-${query.startDate || ''}-${query.endDate || ''}`;

  return (
    <LogFilterInner
      key={key}
      initialStockCode={query.stockCode || ''}
      initialTags={query.tags ? query.tags.join(', ') : ''}
      initialStartDate={query.startDate || ''}
      initialEndDate={query.endDate || ''}
      onQueryChange={onQueryChange}
      onReset={onReset}
    />
  );
}
