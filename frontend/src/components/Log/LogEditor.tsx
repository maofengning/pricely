import { useState, useCallback, useMemo } from 'react';
import { useLog } from '@/hooks/useLog';
import {
  LOG_PATTERN_TYPE_LABELS,
  PERIOD_LABELS,
  type LogPatternType,
  type TradeLog,
  type TradeLogCreate,
  type Period,
} from '@/types';

interface LogEditorProps {
  isOpen: boolean;
  editingLog?: TradeLog | null;
  onClose: () => void;
  onSubmit?: (log: TradeLog) => void;
}

const PATTERN_TYPES: LogPatternType[] = [
  'head_and_shoulders_top',
  'head_and_shoulders_bottom',
  'double_top',
  'double_bottom',
  'triple_top',
  'triple_bottom',
  'triangle',
  'flag',
];

const PERIOD_OPTIONS: Period[] = ['1min', '5min', '15min', '30min', '1h', '4h', '1d'];

function formatDateTimeLocal(date?: Date | string): string {
  if (!date) {
    const now = new Date();
    return formatDateTimeLocal(now);
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(str: string): string {
  return new Date(str).toISOString();
}

function getInitialFormState(editingLog?: TradeLog | null) {
  if (editingLog) {
    return {
      stockCode: editingLog.stockCode,
      stockName: editingLog.stockName || '',
      period: editingLog.period,
      patternType: editingLog.patternType || '',
      entryPrice: editingLog.entryPrice.toString(),
      stopLoss: editingLog.stopLoss?.toString() || '',
      takeProfit: editingLog.takeProfit?.toString() || '',
      exitPrice: editingLog.exitPrice?.toString() || '',
      quantity: editingLog.quantity.toString(),
      profitLoss: editingLog.profitLoss?.toString() || '',
      notes: editingLog.notes || '',
      tags: editingLog.tags.join(', '),
      tradeTime: formatDateTimeLocal(editingLog.tradeTime || editingLog.createdAt),
    };
  }
  return {
    stockCode: '',
    stockName: '',
    period: '1d' as Period,
    patternType: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    exitPrice: '',
    quantity: '100',
    profitLoss: '',
    notes: '',
    tags: '',
    tradeTime: formatDateTimeLocal(),
  };
}

function LogEditorForm({
  editingLog,
  onClose,
  onSubmit,
}: {
  editingLog?: TradeLog | null;
  onClose: () => void;
  onSubmit?: (log: TradeLog) => void;
}) {
  const { createLog, updateLogData, isLoading, error } = useLog();

  // Use useMemo to compute initial state based on editingLog
  const initialState = useMemo(() => getInitialFormState(editingLog), [editingLog]);

  // Initialize state with computed values
  const [stockCode, setStockCode] = useState(initialState.stockCode);
  const [stockName, setStockName] = useState(initialState.stockName);
  const [period, setPeriod] = useState<Period>(initialState.period);
  const [patternType, setPatternType] = useState<string>(initialState.patternType);
  const [entryPrice, setEntryPrice] = useState(initialState.entryPrice);
  const [stopLoss, setStopLoss] = useState(initialState.stopLoss);
  const [takeProfit, setTakeProfit] = useState(initialState.takeProfit);
  const [exitPrice, setExitPrice] = useState(initialState.exitPrice);
  const [quantity, setQuantity] = useState(initialState.quantity);
  const [profitLoss, setProfitLoss] = useState(initialState.profitLoss);
  const [notes, setNotes] = useState(initialState.notes);
  const [tags, setTags] = useState(initialState.tags);
  const [tradeTime, setTradeTime] = useState(initialState.tradeTime);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!stockCode.trim()) {
      return;
    }
    if (!entryPrice || parseFloat(entryPrice) <= 0) {
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      return;
    }

    const data: TradeLogCreate = {
      stockCode: stockCode.trim(),
      stockName: stockName.trim() || undefined,
      period,
      patternType: patternType ? (patternType as LogPatternType) : undefined,
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      quantity: parseInt(quantity),
      profitLoss: profitLoss ? parseFloat(profitLoss) : undefined,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      tradeTime: parseDateTimeLocal(tradeTime),
    };

    if (editingLog) {
      const result = await updateLogData(editingLog.id, data);
      if (result) {
        onSubmit?.(result);
        onClose();
      }
    } else {
      const result = await createLog(data);
      if (result) {
        onSubmit?.(result);
        onClose();
      }
    }
  }, [
    stockCode,
    stockName,
    period,
    patternType,
    entryPrice,
    stopLoss,
    takeProfit,
    exitPrice,
    quantity,
    profitLoss,
    notes,
    tags,
    tradeTime,
    editingLog,
    createLog,
    updateLogData,
    onSubmit,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const title = editingLog ? '编辑交易日志' : '新建交易日志';

  return (
    <div
      className="bg-bg-secondary rounded-lg max-w-lg w-full mx-4 p-6 shadow-xl border border-border overflow-y-auto max-h-[90vh]"
      data-testid="log-editor"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="log-editor-title"
          className="text-xl font-bold text-text-primary"
        >
          {title}
        </h2>
        <button
          onClick={handleClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="关闭"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Stock Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">股票代码 *</label>
            <input
              type="text"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              placeholder="例如: AAPL"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">股票名称</label>
            <input
              type="text"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">K线周期</label>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === p
                    ? 'bg-text-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Type */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">形态类型</label>
          <select
            value={patternType}
            onChange={(e) => setPatternType(e.target.value)}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
          >
            <option value="">无</option>
            {PATTERN_TYPES.map((type) => (
              <option key={type} value={type}>
                {LOG_PATTERN_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Entry and Exit Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">入场价 *</label>
            <input
              type="number"
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="必填"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">出场价</label>
            <input
              type="number"
              step="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">止损价</label>
            <input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">止盈价</label>
            <input
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
        </div>

        {/* Quantity and Profit/Loss */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">数量 *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="必填"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">盈亏金额</label>
            <input
              type="number"
              step="0.01"
              value={profitLoss}
              onChange={(e) => setProfitLoss(e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
            />
          </div>
        </div>

        {/* Trade Time */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">交易时间</label>
          <input
            type="datetime-local"
            value={tradeTime}
            onChange={(e) => setTradeTime(e.target.value)}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">标签 (逗号分隔)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如: 突破, 反转, 趋势"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-text-secondary text-sm mb-2">备注分析</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加交易分析备注..."
            rows={4}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleClose}
          className="flex-1 py-2 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-primary transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-2 bg-text-accent text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '处理中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export function LogEditor({
  isOpen,
  editingLog,
  onClose,
  onSubmit,
}: LogEditorProps) {
  if (!isOpen) return null;

  // Use key to reset form state when editingLog changes
  const formKey = editingLog?.id || 'new';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-editor-title"
    >
      <LogEditorForm
        key={formKey}
        editingLog={editingLog}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}
