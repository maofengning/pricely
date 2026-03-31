import { useState } from 'react';
import { MultiPeriodPanel, OHLCDisplay } from '@/components/Chart';
import { RiskWarningBanner } from '@/components/Compliance';

export default function HomePage() {
  const [stockCode, setStockCode] = useState('600036');

  return (
    <div className="flex flex-col h-full">
      {/* Risk Warning */}
      <div className="mb-4">
        <RiskWarningBanner />
      </div>

      {/* Stock Selector */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-text-secondary text-sm">股票代码:</label>
        <input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          className="px-3 py-1.5 bg-bg-tertiary border border-border rounded text-text-primary w-32"
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