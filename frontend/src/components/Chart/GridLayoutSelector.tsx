import type { GridLayout } from '@/types';
import { GRID_LAYOUTS } from '@/types';

interface GridLayoutSelectorProps {
  value: GridLayout;
  onChange: (layout: GridLayout) => void;
}

const LAYOUT_OPTIONS: { value: GridLayout; label: string }[] = [
  { value: '1x1', label: '1x1' },
  { value: '2x2', label: '2x2' },
  { value: '2x3', label: '2x3' },
  { value: '3x3', label: '3x3' },
];

export function GridLayoutSelector({ value, onChange }: GridLayoutSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary rounded p-1">
      {LAYOUT_OPTIONS.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onChange(layout.value)}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            value === layout.value
              ? 'bg-text-accent text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
          }`}
          title={`${GRID_LAYOUTS[layout.value].cols}列 x ${GRID_LAYOUTS[layout.value].rows}行`}
        >
          {layout.label}
        </button>
      ))}
    </div>
  );
}