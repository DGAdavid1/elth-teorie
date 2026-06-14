import type { FilterType } from '../types';
import './FilterBar.css';

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  counts: Record<string, number>;
  total: number;
  typeLabels: Record<string, string>;
}

const FILTERS: FilterType[] = ['all', 'single', 'multiple', 'matching', 'fillin', 'textblanks'];

export function FilterBar({ filter, onFilterChange, counts, total, typeLabels }: Props) {
  return (
    <div className="filter-bar">
      <p className="filter-label">Tip de întrebări:</p>
      <div className="filter-chips">
        {FILTERS.map(f => {
          const count = f === 'all' ? total : (counts[f] || 0);
          if (count === 0 && f !== 'all') return null;
          return (
            <button
              key={f}
              className={`chip ${filter === f ? 'active' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {typeLabels[f] || f}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
