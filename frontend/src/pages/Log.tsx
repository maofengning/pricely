import { TradeLog } from '@/components/Log';
import type { TradeLog as TradeLogType } from '@/types';

export default function LogPage() {
  // Handle log selection - can be used for navigation or detail view
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogSelect = (_log: TradeLogType) => {
    // Placeholder for log selection handling
    // TODO: Implement navigation to log detail view or other action
  };

  return (
    <TradeLog onLogSelect={handleLogSelect} />
  );
}
