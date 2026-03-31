import { useState } from 'react';

interface RiskWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  title?: string;
  content?: string;
}

export function RiskWarningModal({
  isOpen,
  onConfirm,
  title = "模拟交易风险提示",
  content,
}: RiskWarningModalProps) {
  const [checked, setChecked] = useState(false);

  // Reset checked state when modal opens
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
  };

  const handleConfirm = () => {
    setChecked(false);
    onConfirm();
  };

  if (!isOpen) return null;

  const defaultContent = `
您即将进入模拟交易页面，请注意：

1. 本平台仅提供模拟交易服务，不涉及任何真实资金交易。
2. 模拟交易结果不代表实盘收益，仅供参考和学习使用。
3. 本平台不提供任何投资建议，所有交易决策由您自行做出。
4. 请勿根据模拟交易结果进行实盘操作，投资有风险，入市需谨慎。
5. 股票交易存在风险，过往业绩不代表未来表现。
  `.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-secondary rounded-lg max-w-lg w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4 mb-6">
          <pre className="text-text-secondary text-sm whitespace-pre-wrap font-sans">
            {content || defaultContent}
          </pre>
        </div>

        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="w-4 h-4 rounded border-border bg-bg-tertiary"
          />
          <span className="text-text-secondary text-sm">
            我已阅读并理解以上风险提示
          </span>
        </label>

        <button
          onClick={handleConfirm}
          disabled={!checked}
          className="w-full py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认进入
        </button>
      </div>
    </div>
  );
}