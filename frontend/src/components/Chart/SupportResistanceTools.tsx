import { useEffect } from 'react';
import { useDrawing } from '@/hooks/useDrawing';
import type { DrawingToolType } from '@/types/drawing';

interface ToolButtonProps {
  tool: DrawingToolType | 'ai_detect' | 'delete' | 'clear' | 'cancel';
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function ToolButton({
  label,
  icon,
  isActive,
  onClick,
  disabled,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="text-sm hidden sm:inline">{label}</span>
    </button>
  );
}

// Icon components
const HorizontalLineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const TrendLineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <line x1="2" y1="18" x2="22" y2="6" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ChannelIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <line x1="2" y1="16" x2="22" y2="8" stroke="currentColor" strokeWidth="2" />
    <line x1="2" y1="20" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const FibonacciIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <line x1="2" y1="4" x2="22" y2="4" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ExtensionIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="4" x2="22" y2="4" stroke="currentColor" strokeWidth="2" />
    <line x1="2" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const AIIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M6 7h12M9 7v10M15 7v10M4 4h16M8 4v-2h8v2"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const ClearIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

interface SupportResistanceToolsProps {
  stockCode: string;
  period: string;
}

export function SupportResistanceTools({
  stockCode,
  period,
}: SupportResistanceToolsProps) {
  const {
    activeTool,
    toolMode,
    selectedDrawingId,
    isLoadingDetection,
    startDrawing,
    cancelDrawing,
    deleteSelectedDrawing,
    detectSRLevels,
    clearAllDrawings,
  } = useDrawing();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key cancels current drawing
      if (e.key === 'Escape') {
        cancelDrawing();
      }

      // Delete key removes selected drawing
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedDrawingId) {
          deleteSelectedDrawing();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelDrawing, selectedDrawingId, deleteSelectedDrawing]);

  const handleToolClick = (tool: DrawingToolType) => {
    if (activeTool === tool) {
      cancelDrawing();
    } else {
      startDrawing(tool);
    }
  };

  const handleAIDetect = async () => {
    await detectSRLevels(stockCode, period);
  };

  const handleDelete = () => {
    if (selectedDrawingId) {
      deleteSelectedDrawing();
    }
  };

  const handleClear = () => {
    clearAllDrawings();
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg border border-border">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <span className="text-text-secondary text-sm mr-2 hidden sm:inline">
          绘制工具:
        </span>

        <ToolButton
          tool="horizontal_line"
          label="水平线"
          icon={<HorizontalLineIcon />}
          isActive={activeTool === 'horizontal_line'}
          onClick={() => handleToolClick('horizontal_line')}
        />

        <ToolButton
          tool="trend_line"
          label="趋势线"
          icon={<TrendLineIcon />}
          isActive={activeTool === 'trend_line'}
          onClick={() => handleToolClick('trend_line')}
        />

        <ToolButton
          tool="parallel_channel"
          label="平行通道"
          icon={<ChannelIcon />}
          isActive={activeTool === 'parallel_channel'}
          onClick={() => handleToolClick('parallel_channel')}
        />

        <ToolButton
          tool="fibonacci_retracement"
          label="斐波那契回撤"
          icon={<FibonacciIcon />}
          isActive={activeTool === 'fibonacci_retracement'}
          onClick={() => handleToolClick('fibonacci_retracement')}
        />

        <ToolButton
          tool="fibonacci_extension"
          label="斐波那契扩展"
          icon={<ExtensionIcon />}
          isActive={activeTool === 'fibonacci_extension'}
          onClick={() => handleToolClick('fibonacci_extension')}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border mx-2" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <ToolButton
          tool="ai_detect"
          label="AI识别"
          icon={<AIIcon />}
          isActive={false}
          onClick={handleAIDetect}
          disabled={isLoadingDetection}
        />

        <ToolButton
          tool="delete"
          label="删除选中"
          icon={<DeleteIcon />}
          isActive={toolMode === 'selected'}
          onClick={handleDelete}
          disabled={!selectedDrawingId}
        />

        <ToolButton
          tool="clear"
          label="清除全部"
          icon={<ClearIcon />}
          isActive={false}
          onClick={handleClear}
        />
      </div>

      {/* Status indicator */}
      {toolMode === 'drawing' && (
        <div className="ml-4 text-xs text-blue-400 flex items-center gap-1">
          <span className="animate-pulse">绘制中...</span>
          <button
            type="button"
            onClick={cancelDrawing}
            className="text-text-secondary hover:text-text-primary underline"
          >
            取消 (Esc)
          </button>
        </div>
      )}

      {toolMode === 'selected' && (
        <div className="ml-4 text-xs text-green-400">
          已选中 (按 Delete 删除)
        </div>
      )}

      {isLoadingDetection && (
        <div className="ml-4 text-xs text-yellow-400 animate-pulse">
          正在识别支撑阻力位...
        </div>
      )}
    </div>
  );
}