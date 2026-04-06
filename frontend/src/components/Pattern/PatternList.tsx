import { useEffect } from 'react';
import { Loading } from '@/components/common/Loading';
import { usePattern } from '@/hooks/usePattern';
import { PATTERN_TYPE_LABELS, PATTERN_TYPE_COLORS, type Pattern, type Period } from '@/types';

interface PatternListProps {
  stockCode: string;
  period?: Period;
  onPatternSelect?: (pattern: Pattern) => void;
  onPatternEdit?: (pattern: Pattern) => void;
  onPatternCreate?: () => void;
}

function PatternListItem({
  pattern,
  onSelect,
  onEdit,
  onDelete,
}: {
  pattern: Pattern;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const color = PATTERN_TYPE_COLORS[pattern.patternType];
  const label = PATTERN_TYPE_LABELS[pattern.patternType];
  const isValidClass = pattern.isValid ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`p-3 rounded-lg border ${isValidClass} cursor-pointer hover:bg-bg-tertiary transition-colors`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-text-primary font-medium">{label}</span>
        </div>
        <span className={`text-xs ${pattern.isValid ? 'text-green-500' : 'text-red-500'}`}>
          {pattern.isValid ? '有效' : '失效'}
        </span>
      </div>

      <div className="text-text-secondary text-sm space-y-1">
        <div className="flex justify-between">
          <span>时间范围:</span>
          <span>{formatDate(pattern.startTime)} - {formatDate(pattern.endTime)}</span>
        </div>
        {pattern.startPrice && pattern.endPrice && (
          <div className="flex justify-between">
            <span>价格范围:</span>
            <span>{pattern.startPrice.toFixed(2)} - {pattern.endPrice.toFixed(2)}</span>
          </div>
        )}
        {pattern.description && (
          <div className="text-text-tertiary mt-2 truncate">
            {pattern.description}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-text-accent hover:text-white transition-colors"
          aria-label="编辑形态标注"
        >
          编辑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-red-500 hover:text-white transition-colors"
          aria-label="删除形态标注"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export function PatternList({
  stockCode,
  period,
  onPatternSelect,
  onPatternEdit,
  onPatternCreate,
}: PatternListProps) {
  const {
    patterns,
    isLoading,
    error,
    fetchPatternsByStock,
    selectPattern,
    startEdit,
    deletePattern,
  } = usePattern();

  useEffect(() => {
    if (stockCode) {
      fetchPatternsByStock(stockCode, period);
    }
  }, [stockCode, period, fetchPatternsByStock]);

  const handleSelect = (pattern: Pattern) => {
    selectPattern(pattern);
    onPatternSelect?.(pattern);
  };

  const handleEdit = (pattern: Pattern) => {
    startEdit(pattern);
    onPatternEdit?.(pattern);
  };

  const handleDelete = async (pattern: Pattern) => {
    const confirmed = window.confirm(`确认删除形态标注 "${PATTERN_TYPE_LABELS[pattern.patternType]}"？`);
    if (confirmed) {
      await deletePattern(pattern.id);
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-bg-secondary rounded-lg p-4">
        <Loading text="加载形态标注..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-bg-secondary rounded-lg p-4">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-bg-secondary rounded-lg border border-border overflow-hidden" data-testid="pattern-list">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-text-primary font-medium">形态标注</h3>
        <button
          onClick={onPatternCreate}
          className="px-2 py-1 text-xs bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
          aria-label="创建形态标注"
        >
          + 新建
        </button>
      </div>

      {/* List */}
      <div className="p-2 overflow-y-auto max-h-[500px]">
        {patterns.length === 0 ? (
          <div className="text-text-secondary text-sm text-center py-8">
            暂无形态标注
          </div>
        ) : (
          <div className="space-y-2">
            {patterns.map((pattern) => (
              <PatternListItem
                key={pattern.id}
                pattern={pattern}
                onSelect={() => handleSelect(pattern)}
                onEdit={() => handleEdit(pattern)}
                onDelete={() => handleDelete(pattern)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}