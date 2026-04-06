import { useState } from 'react';
import { useChartStore } from '@/stores/chartStore';

interface ChartStyleSettingsProps {
  onClose?: () => void;
}

export function ChartStyleSettings({ onClose }: ChartStyleSettingsProps) {
  const { chartStyle, setChartStyle } = useChartStore();
  const [upColor, setUpColor] = useState(chartStyle.upColor);
  const [downColor, setDownColor] = useState(chartStyle.downColor);

  const handleSave = () => {
    setChartStyle({ upColor, downColor });
    onClose?.();
  };

  const handleReset = () => {
    const defaultColors = {
      upColor: '#26a69a',
      downColor: '#ef5350',
    };
    setUpColor(defaultColors.upColor);
    setDownColor(defaultColors.downColor);
    setChartStyle(defaultColors);
    onClose?.();
  };

  return (
    <div className="p-4 bg-bg-secondary rounded-lg" data-testid="chart-style-settings">
      <h3 className="text-lg font-medium text-text-primary mb-4">K线样式设置</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-text-secondary text-sm mb-2">阳线颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={upColor}
              onChange={(e) => setUpColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={upColor}
              onChange={(e) => setUpColor(e.target.value)}
              className="px-2 py-1 bg-bg-tertiary border border-border rounded text-text-primary text-sm w-24"
            />
          </div>
        </div>

        <div>
          <label className="block text-text-secondary text-sm mb-2">阴线颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={downColor}
              onChange={(e) => setDownColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={downColor}
              onChange={(e) => setDownColor(e.target.value)}
              className="px-2 py-1 bg-bg-tertiary border border-border rounded text-text-primary text-sm w-24"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          重置
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}