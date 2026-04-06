import { useState } from 'react';
import { MultiPeriodPanel, OHLCDisplay } from '@/components/Chart';
import { RiskWarningModal, RiskWarningBanner } from '@/components/Compliance';
import { useHomeWarning } from '@/hooks';

export default function HomePage() {
  const [stockCode, setStockCode] = useState('600036');
  const { showModal, handleConfirm } = useHomeWarning();

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

      {/* Chart */}
      <div className="flex-1 min-h-[600px] bg-bg-secondary rounded-lg overflow-hidden">
        <MultiPeriodPanel stockCode={stockCode} />
      </div>
    </div>
  );
}