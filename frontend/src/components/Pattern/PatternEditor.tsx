import { useState, useCallback } from 'react';
import { usePattern } from '@/hooks/usePattern';
import { PATTERN_TYPE_LABELS, PATTERN_TYPE_COLORS, type PatternType, type Pattern, type PatternCreate, type Period } from '@/types';

interface PatternEditorProps {
  isOpen: boolean;
  stockCode: string;
  period: Period;
  editingPattern?: Pattern | null;
  onClose: () => void;
  onSubmit?: (pattern: Pattern) => void;
}

const PATTERN_TYPES: PatternType[] = [
  'pin_bar',
  'engulfing',
  'evening_star',
  'morning_star',
  'doji',
  'head_shoulders_top',
  'head_shoulders_bottom',
];

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDateTimeLocal(str: string): string {
  return new Date(str).toISOString();
}

function getInitialFormState(editingPattern?: Pattern | null) {
  if (editingPattern) {
    return {
      patternType: editingPattern.patternType,
      startTime: formatDateTimeLocal(new Date(editingPattern.startTime)),
      endTime: formatDateTimeLocal(new Date(editingPattern.endTime)),
      startPrice: editingPattern.startPrice?.toString() || '',
      endPrice: editingPattern.endPrice?.toString() || '',
      description: editingPattern.description || '',
      isValid: editingPattern.isValid,
    };
  }
  const now = new Date();
  return {
    patternType: 'pin_bar' as PatternType,
    startTime: formatDateTimeLocal(now),
    endTime: formatDateTimeLocal(now),
    startPrice: '',
    endPrice: '',
    description: '',
    isValid: true,
  };
}

export function PatternEditor({
  isOpen,
  stockCode,
  period,
  editingPattern,
  onClose,
  onSubmit,
}: PatternEditorProps) {
  const { createPattern, updatePatternData, isLoading, error } = usePattern();

  const initialState = getInitialFormState(editingPattern);
  const [patternType, setPatternType] = useState<PatternType>(initialState.patternType);
  const [startTime, setStartTime] = useState(initialState.startTime);
  const [endTime, setEndTime] = useState(initialState.endTime);
  const [startPrice, setStartPrice] = useState(initialState.startPrice);
  const [endPrice, setEndPrice] = useState(initialState.endPrice);
  const [description, setDescription] = useState(initialState.description);
  const [isValid, setIsValid] = useState(initialState.isValid);

  // Reset form state when editingPattern changes
  const resetForm = useCallback(() => {
    const state = getInitialFormState(editingPattern);
    setPatternType(state.patternType);
    setStartTime(state.startTime);
    setEndTime(state.endTime);
    setStartPrice(state.startPrice);
    setEndPrice(state.endPrice);
    setDescription(state.description);
    setIsValid(state.isValid);
  }, [editingPattern]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const data = {
      stockCode,
      period,
      patternType,
      startTime: parseDateTimeLocal(startTime),
      endTime: parseDateTimeLocal(endTime),
      startPrice: startPrice ? parseFloat(startPrice) : null,
      endPrice: endPrice ? parseFloat(endPrice) : null,
      description: description.trim() || undefined,
    };

    if (editingPattern) {
      const result = await updatePatternData(editingPattern.id, {
        ...data,
        isValid,
      });
      if (result) {
        onSubmit?.(result);
        onClose();
      }
    } else {
      const result = await createPattern(data as PatternCreate);
      if (result) {
        onSubmit?.(result);
        onClose();
      }
    }
  }, [
    stockCode,
    period,
    patternType,
    startTime,
    endTime,
    startPrice,
    endPrice,
    description,
    isValid,
    editingPattern,
    createPattern,
    updatePatternData,
    onSubmit,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  const title = editingPattern ? '编辑形态标注' : '新建形态标注';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pattern-editor-title"
    >
      <div
        className="bg-bg-secondary rounded-lg max-w-md w-full mx-4 p-6 shadow-xl border border-border"
        data-testid="pattern-editor"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="pattern-editor-title"
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
          {/* Pattern Type */}
          <div>
            <label className="block text-text-secondary text-sm mb-2">形态类型</label>
            <div className="grid grid-cols-2 gap-2">
              {PATTERN_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setPatternType(type)}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                    patternType === type
                      ? 'bg-text-accent text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PATTERN_TYPE_COLORS[type] }}
                  />
                  {PATTERN_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">开始时间</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-2">结束时间</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">起始价格 (可选)</label>
              <input
                type="number"
                step="0.01"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder="可选"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-2">结束价格 (可选)</label>
              <input
                type="number"
                step="0.01"
                value={endPrice}
                onChange={(e) => setEndPrice(e.target.value)}
                placeholder="可选"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-text-secondary text-sm mb-2">描述 (可选)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加备注..."
              rows={3}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent resize-none"
            />
          </div>

          {/* Valid Status */}
          {editingPattern && (
            <div className="flex items-center gap-2">
              <label className="text-text-secondary text-sm">状态:</label>
              <button
                onClick={() => setIsValid(!isValid)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isValid
                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                    : 'bg-red-500/20 text-red-500 border border-red-500/30'
                }`}
              >
                {isValid ? '有效' : '失效'}
              </button>
            </div>
          )}

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
    </div>
  );
}