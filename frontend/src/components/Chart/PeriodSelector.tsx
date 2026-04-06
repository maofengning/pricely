import type { Period } from '@/types';
import { PERIOD_LABELS } from '@/types';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PERIOD_OPTIONS: Period[] = ['1min', '5min', '15min', '30min', '1h', '4h', '1d'];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary rounded p-1">
      {PERIOD_OPTIONS.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            value === period
              ? 'bg-text-accent text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          {PERIOD_LABELS[period]}
        </button>
      ))}
    </div>
  );
}

// Multi-select version for selecting visible periods
interface PeriodMultiSelectProps {
  value: Period[];
  onChange: (periods: Period[]) => void;
  maxSelect?: number;
}

export function PeriodMultiSelect({
  value,
  onChange,
  maxSelect,
}: PeriodMultiSelectProps) {
  const handleToggle = (period: Period) => {
    if (value.includes(period)) {
      // Don't allow deselecting if it's the only one
      if (value.length > 1) {
        onChange(value.filter((p) => p !== period));
      }
    } else {
      // Check max limit
      if (maxSelect === undefined || value.length < maxSelect) {
        onChange([...value, period]);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 bg-bg-secondary rounded p-1 flex-wrap">
      {PERIOD_OPTIONS.map((period) => {
        const isSelected = value.includes(period);
        const isDisabled = !isSelected && maxSelect !== undefined && value.length >= maxSelect;

        return (
          <button
            key={period}
            onClick={() => handleToggle(period)}
            disabled={isDisabled}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              isSelected
                ? 'bg-text-accent text-white'
                : isDisabled
                  ? 'text-text-muted cursor-not-allowed'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            {PERIOD_LABELS[period]}
          </button>
        );
      })}
    </div>
  );
}