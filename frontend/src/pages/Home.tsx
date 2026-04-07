import { useState, useCallback } from 'react';
import { MultiPeriodPanel, OHLCDisplay } from '@/components/Chart';
import { PatternList, PatternEditor } from '@/components/Pattern';
import { RiskWarningModal, RiskWarningBanner } from '@/components/Compliance';
import { useHomeWarning, usePattern } from '@/hooks';
import type { Pattern } from '@/types';

export default function HomePage() {
  const [stockCode, setStockCode] = useState('600036');
  const { showModal, handleConfirm } = useHomeWarning();
  const {
    editorOpen,
    editingPattern,
    fetchPatternsByStock,
    selectPattern,
    startCreate,
    startEdit,
    cancelEdit,
  } = usePattern();

  const handlePatternSelect = useCallback((pattern: Pattern) => {
    selectPattern(pattern);
  }, [selectPattern]);

  const handlePatternEdit = useCallback((pattern: Pattern) => {
    startEdit(pattern);
  }, [startEdit]);

  const handlePatternCreate = useCallback(() => {
    startCreate();
  }, [startCreate]);

  const handleEditorClose = useCallback(() => {
    cancelEdit();
    // Refresh patterns after closing editor
    fetchPatternsByStock(stockCode);
  }, [cancelEdit, fetchPatternsByStock, stockCode]);

  return (
    <div className="flex flex-col h-full">
      {/* Risk Warning Modal - Shows on first entry */}
      <RiskWarningModal
        isOpen={showModal}
        onConfirm={handleConfirm}
      />

      {/* Risk Warning Banner - Shows on every visit */}
      <div className="mb-4">
        <RiskWarningBanner
          title="首页提示"
          content="本页面展示股票K线图表数据，仅供学习研究使用，不构成任何投资建议。"
          dismissible={false}
        />
      </div>

      {/* Stock Selector */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-text-secondary text-sm">股票代码:</label>
        <input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          className="px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入股票代码"
        />
        <OHLCDisplay data={null} />
      </div>

      {/* Main Content - Chart + Pattern List */}
      <div className="flex-1 flex gap-4 min-h-[600px]">
        {/* Chart */}
        <div className="flex-1 bg-bg-secondary rounded-lg overflow-hidden">
          <MultiPeriodPanel
            stockCode={stockCode}
          />
        </div>

        {/* Pattern List Sidebar */}
        <PatternList
          stockCode={stockCode}
          onPatternSelect={handlePatternSelect}
          onPatternEdit={handlePatternEdit}
          onPatternCreate={handlePatternCreate}
        />
      </div>

      {/* Pattern Editor Modal */}
      <PatternEditor
        isOpen={editorOpen}
        stockCode={stockCode}
        period="1d"
        editingPattern={editingPattern}
        onClose={handleEditorClose}
      />
    </div>
  );
}